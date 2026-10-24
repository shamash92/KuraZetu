import json
import uuid

from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point, Polygon
from django.core.files.storage import FileSystemStorage
from django.core.files.uploadedfile import SimpleUploadedFile

import pytest
from rest_framework.test import APIClient

from results.models import Aspirant, Party, ResultUpload
from stations.models import Constituency, County, PollingCenter, PollingStation, Ward

User = get_user_model()

pytestmark = pytest.mark.django_db

URL = "/api/results/uploads/"
# The smallest bytes that start like a JPEG; the server checks the start only.
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 64


@pytest.fixture(autouse=True)
def private_uploads(monkeypatch, tmp_path):
    # The field resolves its storage once, when models load.
    field = ResultUpload._meta.get_field("photo")
    monkeypatch.setattr(field, "storage", FileSystemStorage(location=str(tmp_path)))
    return tmp_path


@pytest.fixture
def ward():
    county = County.objects.create(name="County", number=1)
    constituency = Constituency.objects.create(
        name="Constituency", county=county, number=1
    )
    return Ward.objects.create(name="Ward", constituency=constituency, number=1)


@pytest.fixture
def station(ward):
    centre = PollingCenter.objects.create(name="Centre", code="001", ward=ward)
    return PollingStation.objects.create(
        polling_center=centre, code="000000101", registered_voters=500
    )


@pytest.fixture
def account(station):
    user = User.objects.create_user(phone_number="+254700000002", password="pw")
    user.is_phone_verified = True
    user.polling_center = station.polling_center
    user.save()
    return user


@pytest.fixture
def client(account):
    api_client = APIClient()
    api_client.force_authenticate(user=account)
    return api_client


@pytest.fixture
def mca_candidates(ward):
    party = Party.objects.create(name="Party", short_name="P")
    return [
        Aspirant.objects.create(
            first_name=name, last_name="X", party=party, level="mca", ward=ward
        )
        for name in ("Ann", "Ben")
    ]


def upload(client, at, candidates, **overrides):
    data = {
        "station": at.code,
        "race": "mca",
        "votes": {str(c.id): 10 + i for i, c in enumerate(candidates)},
        "rejected_votes": 2,
        "disputed_votes": 0,
        "quality_checked": True,
        "key": str(uuid.uuid4()),
        **overrides,
    }
    photo = data.pop("photo", JPEG)
    payload = {
        key: value if isinstance(value, str) else json.dumps(value)
        for key, value in data.items()
    }
    payload["photo"] = SimpleUploadedFile("form.jpg", photo, "image/jpeg")
    return client.post(URL, payload, format="multipart")


def test_an_upload_is_stored_with_its_tally_and_photo(
    client, account, station, mca_candidates, private_uploads
):
    ann, ben = mca_candidates

    response = upload(client, station, mca_candidates)

    assert response.status_code == 201
    stored = ResultUpload.objects.get()
    assert stored.added_by == account
    assert stored.polling_station == station
    assert stored.race == "mca"
    assert stored.votes == {str(ann.id): 10, str(ben.id): 11}
    assert (stored.rejected_votes, stored.disputed_votes) == (2, 0)
    assert stored.quality_checked is True
    assert stored.is_current is True
    assert stored.photo.read() == JPEG
    # The photo lives in private storage, not under the public media folder.
    assert list(private_uploads.rglob("*.jpg"))


def test_the_same_request_sent_twice_stores_one_upload(client, station, mca_candidates):
    key = str(uuid.uuid4())

    first = upload(client, station, mca_candidates, key=key)
    again = upload(client, station, mca_candidates, key=key)

    assert first.status_code == 201
    assert again.status_code == 200
    assert again.data["id"] == first.data["id"]
    assert ResultUpload.objects.count() == 1


def test_uploading_again_replaces_the_current_upload_and_keeps_the_old(
    client, station, mca_candidates
):
    first = upload(client, station, mca_candidates)
    second = upload(client, station, mca_candidates)

    assert second.status_code == 201
    old = ResultUpload.objects.get(id=first.data["id"])
    new = ResultUpload.objects.get(id=second.data["id"])
    assert not old.is_current
    assert new.is_current


def test_a_key_used_by_another_account_is_refused(
    client, station, mca_candidates, account
):
    key = str(uuid.uuid4())
    upload(client, station, mca_candidates, key=key)
    other = User.objects.create_user(phone_number="+254700000003", password="pw")
    other.is_phone_verified = True
    other.polling_center = account.polling_center
    other.save()
    other_client = APIClient()
    other_client.force_authenticate(user=other)

    response = upload(other_client, station, mca_candidates, key=key)

    assert response.status_code == 409
    assert ResultUpload.objects.count() == 1


@pytest.mark.parametrize(
    "change, status, code",
    [
        ("missing_candidate", 400, "invalid_tally"),
        ("unknown_candidate", 400, "invalid_tally"),
        ("negative_count", 400, "invalid_tally"),
        ("text_count", 400, "invalid_tally"),
        ("negative_rejected", 400, "invalid_request"),
        ("not_jpeg", 400, "not_jpeg"),
        ("unknown_race", 400, "unknown_race"),
        ("unknown_station", 404, "station_not_found"),
    ],
)
def test_a_refused_upload_stores_nothing(
    client, station, mca_candidates, private_uploads, change, status, code
):
    ann, ben = mca_candidates
    overrides = {
        "missing_candidate": {"votes": {str(ann.id): 10}},
        "unknown_candidate": {"votes": {str(ann.id): 10, str(ben.id): 11, "999999": 1}},
        "negative_count": {"votes": {str(ann.id): -1, str(ben.id): 11}},
        "text_count": {"votes": {str(ann.id): "ten", str(ben.id): 11}},
        "negative_rejected": {"rejected_votes": -1},
        "not_jpeg": {"photo": b"\x89PNG\r\n\x1a\n" + b"\x00" * 64},
        "unknown_race": {"race": "mayor"},
        "unknown_station": {"station": "999999999"},
    }[change]

    response = upload(client, station, mca_candidates, **overrides)

    assert response.status_code == status
    assert response.data["code"] == code
    assert not ResultUpload.objects.exists()
    assert not list(private_uploads.rglob("*"))


def test_a_photo_above_the_limit_is_refused(
    client, station, mca_candidates, settings, private_uploads
):
    settings.RESULT_UPLOAD_MAX_PHOTO_BYTES = len(JPEG) - 1

    response = upload(client, station, mca_candidates)

    assert response.status_code == 413
    assert "MB" in response.data["error"]
    assert not ResultUpload.objects.exists()
    assert not list(private_uploads.rglob("*"))


def test_an_account_without_a_verified_phone_cannot_upload(
    client, account, station, mca_candidates
):
    account.is_phone_verified = False
    account.save()

    response = upload(client, station, mca_candidates)

    assert response.status_code == 403
    assert not ResultUpload.objects.exists()


@pytest.mark.parametrize("role", ["voter", "party_agent"])
def test_voters_and_agents_upload_only_in_their_ward(
    client, account, station, mca_candidates, role
):
    other_ward = Ward.objects.create(
        name="Other", constituency=station.polling_center.ward.constituency, number=2
    )
    account.role = role
    account.polling_center = PollingCenter.objects.create(
        name="Home", code="002", ward=other_ward
    )
    account.save()

    response = upload(client, station, mca_candidates)

    assert response.status_code == 403
    assert not ResultUpload.objects.exists()


def test_signing_in_is_required(station, mca_candidates):
    response = upload(APIClient(), station, mca_candidates)
    assert response.status_code == 401


# ── Location check ──────────────────────────────────────────────────────

M_PER_DEG_LAT = 111_320
CENTRE = (36.5, 0.5)  # lng, lat


def north_of_centre(metres):
    return {"longitude": CENTRE[0], "latitude": CENTRE[1] + metres / M_PER_DEG_LAT}


@pytest.fixture
def located(station):
    """The station's ward has a boundary and its centre a verified pin."""
    ward = station.polling_center.ward
    ward.boundary = Polygon(((36, 0), (37, 0), (37, 1), (36, 1), (36, 0)))
    ward.save()
    centre = station.polling_center
    centre.pin_location = Point(*CENTRE)
    centre.is_verified = True
    centre.save()
    return station


@pytest.mark.parametrize(
    "fix, grade",
    [
        ({**north_of_centre(80), "accuracy": 10}, "centre_match"),
        ({**north_of_centre(500), "accuracy": 10}, "ward_fallback"),
        ({"longitude": 38.0, "latitude": 0.5, "accuracy": 10}, "location_mismatch"),
        ({**north_of_centre(10), "accuracy": 150}, "location_unknown"),
        ({}, "location_unknown"),
    ],
)
def test_the_server_grades_where_the_upload_was_made(
    client, located, mca_candidates, fix, grade
):
    response = upload(client, located, mca_candidates, **fix)

    assert response.status_code == 201
    assert response.data["location_grade"] == grade
    stored = ResultUpload.objects.get()
    assert stored.location_grade == grade
    assert response.data["countable"] is (grade in ("centre_match", "ward_fallback"))


def test_an_upload_that_cannot_count_says_why(client, located, mca_candidates):
    response = upload(
        client, located, mca_candidates, accuracy=150, **north_of_centre(5)
    )

    assert response.data["countable"] is False
    assert "location" in response.data["location_message"].lower()


def test_a_grade_sent_by_the_app_is_ignored(client, located, mca_candidates):
    response = upload(
        client,
        located,
        mca_candidates,
        location_grade="centre_match",
        **{"longitude": 38.0, "latitude": 0.5, "accuracy": 10},
    )

    assert response.data["location_grade"] == "location_mismatch"


@pytest.mark.parametrize("role", ["party_agent", "observer"])
def test_agents_and_observers_get_the_fix_accuracy_on_top_of_the_radius(
    client, account, located, mca_candidates, role
):
    account.role = role
    account.save()

    near = upload(client, located, mca_candidates, accuracy=60, **north_of_centre(140))
    far = upload(client, located, mca_candidates, accuracy=99, **north_of_centre(195))

    assert near.data["location_grade"] == "centre_match"
    assert far.data["location_grade"] == "centre_match"


def test_a_voter_gets_no_allowance_for_accuracy(client, located, mca_candidates):
    response = upload(
        client, located, mca_candidates, accuracy=60, **north_of_centre(140)
    )

    assert response.data["location_grade"] == "ward_fallback"


def test_the_agent_allowance_stops_at_200_metres(
    client, account, located, mca_candidates
):
    account.role = "party_agent"
    account.save()

    response = upload(
        client, located, mca_candidates, accuracy=99, **north_of_centre(210)
    )

    assert response.data["location_grade"] == "ward_fallback"


@pytest.mark.parametrize("pin", ["unverified", "null_island"])
def test_only_a_verified_real_pin_gives_a_centre_match(
    client, located, mca_candidates, pin
):
    centre = located.polling_center
    if pin == "unverified":
        centre.is_verified = False
    else:
        centre.pin_location = Point(0, 0)
    centre.save()

    response = upload(
        client, located, mca_candidates, accuracy=10, **north_of_centre(20)
    )

    assert response.data["location_grade"] == "ward_fallback"


def test_an_outside_ward_centre_counts_only_within_100_metres_for_everyone(
    client, account, located, mca_candidates
):
    centre = located.polling_center
    centre.is_outside_ward_boundary = True
    centre.save()
    account.role = "observer"
    account.save()

    close = upload(client, located, mca_candidates, accuracy=50, **north_of_centre(90))
    inside_ward = upload(
        client, located, mca_candidates, accuracy=50, **north_of_centre(140)
    )

    assert close.data["location_grade"] == "centre_match"
    assert inside_ward.data["location_grade"] == "location_mismatch"


def test_a_centre_inside_its_ward_counts_only_from_inside_the_ward(
    client, located, mca_candidates
):
    # The ward's northern edge runs 50 m north of the pin.
    edge = CENTRE[1] + 50 / M_PER_DEG_LAT
    ward = located.polling_center.ward
    ward.boundary = Polygon(((36, 0), (37, 0), (37, edge), (36, edge), (36, 0)))
    ward.save()

    inside = upload(client, located, mca_candidates, accuracy=10, **north_of_centre(30))
    across = upload(client, located, mca_candidates, accuracy=10, **north_of_centre(80))

    assert inside.data["location_grade"] == "centre_match"
    assert across.data["location_grade"] == "location_mismatch"


def test_an_outside_ward_centre_counts_near_its_pin_outside_the_ward(
    client, located, mca_candidates
):
    centre = located.polling_center
    centre.is_outside_ward_boundary = True
    centre.save()
    edge = CENTRE[1] - 1 / M_PER_DEG_LAT
    ward = centre.ward
    ward.boundary = Polygon(((36, 0), (37, 0), (37, edge), (36, edge), (36, 0)))
    ward.save()

    response = upload(
        client, located, mca_candidates, accuracy=10, **north_of_centre(20)
    )

    assert response.data["location_grade"] == "centre_match"


def test_a_ward_without_a_boundary_gives_no_ward_fallback(
    client, located, mca_candidates
):
    ward = located.polling_center.ward
    ward.boundary = None
    ward.save()

    response = upload(
        client, located, mca_candidates, accuracy=10, **north_of_centre(500)
    )

    assert response.data["location_grade"] == "location_mismatch"


def test_the_position_is_kept_apart_from_the_upload(client, located, mca_candidates):
    upload(client, located, mca_candidates, accuracy=12, **north_of_centre(80))

    stored = ResultUpload.objects.get()
    assert stored.fix_accuracy_m == 12
    assert round(stored.distance_to_centre_m) == 80
    assert stored.device_fix.point.y == pytest.approx(CENTRE[1] + 80 / M_PER_DEG_LAT)
    assert not hasattr(stored, "latitude")
