"""A custom dashboard shows the public tally within its own race and area."""

import io
import uuid

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.urls import reverse

import pytest
from PIL import Image
from rest_framework.test import APIClient

from results.dashboard_access import add_member
from results.dashboard_models import MediaHouse, ResultsDashboard
from results.location import CENTRE_MATCH
from results.models import (
    Aspirant,
    Party,
    PollingStationGovernorResults,
    PollingStationMCAResults,
    PollingStationPresidentialResults,
    ResultUpload,
)
from results.qr import MATCH
from results.test_agreement_save import photo_with_exif
from results.test_uploads import account, station, ward  # noqa: F401
from stations.models import PollingCenter, PollingStation, Ward

pytestmark = pytest.mark.django_db


@pytest.fixture
def party():
    return Party.objects.create(name="Example party", short_name="EP")


def signed_in(account):
    client = APIClient()
    client.force_authenticate(account)
    return client


def test_aspirant_sees_only_its_race_and_area_until_access_ends(
    account, station, ward, party
):
    ann, ben = (
        Aspirant.objects.create(
            first_name="Candidate", last_name=name, party=party, level="mca", ward=ward
        )
        for name in ("A", "B")
    )
    for candidate in (ann, ben):
        PollingStationMCAResults.objects.create(
            polling_station=station, mca_candidate=candidate, votes=40
        )
    dashboard = ResultsDashboard.objects.create(
        kind="aspirant", aspirant=ann, name="Ward dashboard", active=True
    )
    add_member(dashboard, account.phone_number, owner=True)
    client = signed_in(account)
    url = reverse("dashboard-results")

    body = client.get(url).json()
    assert body["race"] == "mca"
    assert body["summary"]["status"] == "Tied"
    assert (body["summary"]["reported"], body["summary"]["stations"]) == (1, 1)
    assert [child["name"] for child in body["children"]] == ["Centre"]
    assert client.get(url, {"area": "station", "id": station.pk}).status_code == 200

    outside = Ward.objects.create(
        name="Other ward", number=2, constituency=ward.constituency
    )
    assert client.get(url, {"area": "national"}).status_code == 404
    assert client.get(url, {"area": "ward", "id": outside.pk}).status_code == 404

    dashboard.active = False
    dashboard.save()
    assert client.get(url).status_code == 404
    assert client.get(reverse("dashboard-context")).json()["dashboard"] is None


def test_media_drills_from_national_to_a_station_and_civilians_cannot(
    account, station, ward, party
):
    president = Aspirant.objects.create(
        first_name="Candidate", last_name="P", party=party, level="president"
    )
    PollingStationPresidentialResults.objects.create(
        polling_station=station, presidential_candidate=president, votes=20
    )
    client = signed_in(account)
    assert client.get(reverse("dashboard-results")).status_code == 404

    dashboard = ResultsDashboard.objects.create(
        kind="media",
        name="Newsroom",
        media_house=MediaHouse.objects.create(name="Newsroom"),
        active=True,
    )
    add_member(dashboard, account.phone_number)
    body = client.get(reverse("dashboard-results")).json()
    assert (body["race"], body["summary"]["votes"]) == ("president", 20)
    assert body["children"][0]["level"] == "county"
    for level, area in [
        ("county", ward.constituency.county),
        ("constituency", ward.constituency),
        ("ward", ward),
        ("center", station.polling_center),
        ("station", station),
    ]:
        response = client.get(
            reverse("dashboard-results"), {"area": level, "id": area.pk}
        )
        assert response.status_code == 200, response.json()
        assert response.json()["summary"]["votes"] == 20


def test_dashboard_totals_match_the_civilian_county_totals(
    account, station, ward, party
):
    county = ward.constituency.county
    governors = [
        Aspirant.objects.create(
            first_name="Governor",
            last_name=name,
            party=party,
            level="governor",
            county=county,
        )
        for name in ("A", "B")
    ]
    second = PollingStation.objects.create(
        polling_center=station.polling_center, code="000000102", registered_voters=400
    )
    for at, votes in [(station, (30, 12)), (second, (5, 9))]:
        for candidate, count in zip(governors, votes):
            PollingStationGovernorResults.objects.create(
                polling_station=at, governor_candidate=candidate, votes=count
            )
    dashboard = ResultsDashboard.objects.create(
        kind="aspirant", aspirant=governors[0], name="County dashboard", active=True
    )
    add_member(dashboard, account.phone_number, owner=True)
    client = signed_in(account)

    paid = client.get(reverse("dashboard-results")).json()["summary"]["candidates"]
    civilian = client.get(
        reverse("county-presidential-results", kwargs={"level": "governor"})
    ).json()["results"]

    assert {row["name"]: row["votes"] for row in paid} == {
        row["fullName"]: row["totalVotes"] for row in civilian
    }


def test_an_agreement_does_not_count_as_a_disagreement(account, station, ward, party):
    president = Aspirant.objects.create(
        first_name="Candidate", last_name="P", party=party, level="president"
    )
    dashboard = ResultsDashboard.objects.create(
        kind="party", party=party, name="Party dashboard", active=True
    )
    add_member(dashboard, account.phone_number, owner=True)
    client = signed_in(account)

    def uploaded(votes, agrees_with=None):
        return ResultUpload.objects.create(
            key=uuid.uuid4(),
            polling_station=station,
            race="president",
            votes={str(president.pk): votes},
            rejected_votes=0,
            disputed_votes=0,
            photo="form.jpg",
            quality_checked=True,
            location_grade=CENTRE_MATCH,
            server_qr_result=MATCH,
            agrees_with=agrees_with,
        )

    first = uploaded(20)
    uploaded(0, agrees_with=first)
    assert client.get(reverse("dashboard-results")).json()["summary"][
        "disagreements"
    ] == (0)

    uploaded(25)
    assert client.get(reverse("dashboard-results")).json()["summary"][
        "disagreements"
    ] == (1)


def test_out_of_area_centre_is_refused(account, station, ward, party):
    candidate = Aspirant.objects.create(
        first_name="Candidate", last_name="A", party=party, level="mca", ward=ward
    )
    dashboard = ResultsDashboard.objects.create(
        kind="aspirant", aspirant=candidate, name="Ward dashboard", active=True
    )
    add_member(dashboard, account.phone_number, owner=True)
    elsewhere = PollingCenter.objects.create(
        name="Elsewhere",
        code="009",
        ward=Ward.objects.create(
            name="Far ward", number=3, constituency=ward.constituency
        ),
    )
    response = signed_in(account).get(
        reverse("dashboard-results"), {"area": "center", "id": elsewhere.pk}
    )
    assert response.status_code == 404


def test_station_list_gives_the_candidates_place_at_each_station(
    account, station, ward, party
):
    ann, ben = (
        Aspirant.objects.create(
            first_name="Candidate", last_name=name, party=party, level="mca", ward=ward
        )
        for name in ("A", "B")
    )
    for candidate, votes in ((ann, 30), (ben, 40)):
        PollingStationMCAResults.objects.create(
            polling_station=station, mca_candidate=candidate, votes=votes
        )
    quiet = PollingStation.objects.create(
        polling_center=station.polling_center, code="000000102", registered_voters=400
    )
    dashboard = ResultsDashboard.objects.create(
        kind="aspirant", aspirant=ann, name="Ward dashboard", active=True
    )
    add_member(dashboard, account.phone_number, owner=True)
    client = signed_in(account)
    url = reverse("dashboard-stations")

    rows = {
        row["id"]: row
        for row in client.get(url, {"area": "ward", "id": ward.pk}).json()["stations"]
    }
    assert (rows[station.pk]["votes"], rows[station.pk]["position"]) == (30, 2)
    assert rows[station.pk]["leaders"] == ["Candidate B"]
    assert not rows[quiet.pk]["reported"] and rows[quiet.pk]["position"] is None

    outside = Ward.objects.create(
        name="Other ward", number=2, constituency=ward.constituency
    )
    assert client.get(url, {"area": "ward", "id": outside.pk}).status_code == 404
    assert client.get(url, {"area": "national"}).status_code == 404


def test_station_uploads_show_figures_and_a_photo_without_metadata(
    account, station, ward, party
):
    ann, ben = (
        Aspirant.objects.create(
            first_name="Candidate", last_name=name, party=party, level="mca", ward=ward
        )
        for name in ("A", "B")
    )
    dashboard = ResultsDashboard.objects.create(
        kind="aspirant", aspirant=ann, name="Ward dashboard", active=True
    )
    add_member(dashboard, account.phone_number, owner=True)
    client = signed_in(account)

    people = iter(
        get_user_model().objects.create_user(phone_number=f"+25470000002{n}")
        for n in range(3)
    )

    def uploaded(votes, agrees_with=None):
        upload = ResultUpload(
            key=uuid.uuid4(),
            added_by=next(people),
            polling_station=station,
            race="mca",
            votes={str(ann.pk): votes, str(ben.pk): 10},
            rejected_votes=1,
            disputed_votes=0,
            quality_checked=True,
            location_grade=CENTRE_MATCH,
            server_qr_result=MATCH,
            agrees_with=agrees_with,
        )
        upload.photo.save("photo.jpg", ContentFile(photo_with_exif(1200, 1600)))
        return upload

    first = uploaded(20)
    uploaded(0, agrees_with=first)
    uploaded(25)

    body = client.get(reverse("dashboard-uploads"), {"id": station.pk}).json()
    assert [(u["votes"][str(ann.pk)], u["agreed"]) for u in body["uploads"]] == [
        (20, 1),
        (25, 0),
    ]
    assert set(body["uploads"][0]) == {"id", "votes", "rejected", "disputed", "agreed"}

    photo = client.get(reverse("dashboard-upload-photo", args=[first.pk]))
    assert photo["Content-Type"] == "image/jpeg"
    assert photo["Cache-Control"] == "private, no-store"
    assert dict(Image.open(io.BytesIO(photo.content)).getexif()) == {}

    outside = PollingStation.objects.create(
        polling_center=PollingCenter.objects.create(
            name="Elsewhere",
            code="009",
            ward=Ward.objects.create(
                name="Far ward", number=3, constituency=ward.constituency
            ),
        ),
        code="000000901",
        registered_voters=400,
    )
    assert (
        client.get(reverse("dashboard-uploads"), {"id": outside.pk}).status_code == 404
    )
    first.polling_station = outside
    first.save()
    assert (
        client.get(reverse("dashboard-upload-photo", args=[first.pk])).status_code
        == 404
    )
