"""Saving an agreement, the station's earlier photos and their tags, and
refusing a disagreement with the same counts."""

import io
import json
import uuid

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.urls import reverse

import pytest
from PIL import Image
from rest_framework.test import APIClient

from results import comparing, machine_checks, reading
from results.location import CENTRE_MATCH, LOCATION_MISMATCH
from results.models import MachineCheck, ResultUpload
from results.qr import UNREAD
from results.test_agreement import (  # noqa: F401 (pytest fixtures)
    agree,
    compare_at_once,
    comparison,
    difference,
    earlier,
    read_only,
)
from results.test_reading import (  # noqa: F401 (pytest fixtures)
    agent,
    message,
    provider,
    read_at_once,
    reply,
)
from results.test_upload_check import send
from results.test_uploads import (  # noqa: F401 (pytest fixtures)
    account,
    client,
    jpeg,
    mca_candidates,
    private_uploads,
    station,
    upload,
    ward,
)
from stations.models import PollingStation

pytestmark = pytest.mark.django_db

User = get_user_model()

AGREEMENTS = reverse("result-agreements")


def listing(api_client, at, level="mca"):
    return api_client.get(reverse("polling-station-uploads", args=[at.code, level]))


def save(api_client, check_id, **overrides):
    return api_client.post(
        AGREEMENTS,
        {
            "check_id": str(check_id),
            "quality_checked": True,
            "key": str(uuid.uuid4()),
            **overrides,
        },
        format="json",
    )


def agreed_check(api_client, at, reference, provider, compared=None):
    """A reading of the person's photo, made to agree with ``reference``."""
    provider(message(reply()), message(compared or comparison()))
    started = agree(api_client, at, reference.id)
    assert started.status_code == 202, started.json()
    return MachineCheck.objects.get(pk=started.json()["check_id"])


def other_client(phone="+254700000010", role="voter"):
    person = User.objects.create_user(phone_number=phone, password="pw")
    person.role = role
    person.is_phone_verified = True
    person.polling_center = PollingStation.objects.get().polling_center
    person.save()
    api_client = APIClient()
    api_client.force_authenticate(user=person)
    return api_client


# ── Saving an agreement ─────────────────────────────────────────────────


def test_an_agreement_is_saved_with_the_earlier_tally(
    client, account, station, earlier, provider
):
    check = agreed_check(client, station, earlier, provider)

    response = save(client, check.id)

    assert response.status_code == 201, response.json()
    saved = ResultUpload.objects.get(pk=response.json()["id"])
    assert saved.added_by == account
    assert saved.agrees_with == earlier
    assert saved.votes == earlier.votes
    assert (saved.rejected_votes, saved.disputed_votes) == (2, 0)
    assert saved.server_qr_result == check.server_qr_result
    assert saved.photo
    check.refresh_from_db()
    assert check.upload == saved


def test_the_same_agreement_sent_twice_is_saved_once(
    client, station, earlier, provider
):
    check = agreed_check(client, station, earlier, provider)
    key = str(uuid.uuid4())

    first = save(client, check.id, key=key)
    again = save(client, check.id, key=key)

    assert (first.status_code, again.status_code) == (201, 200)
    assert first.json()["id"] == again.json()["id"]
    assert ResultUpload.objects.filter(agrees_with=earlier).count() == 1


def test_a_photo_that_does_not_agree_is_not_saved(client, station, earlier, provider):
    check = agreed_check(
        client, station, earlier, provider, comparison(differences=[difference()])
    )

    response = save(client, check.id)

    assert response.status_code == 409
    assert response.json()["code"] == "not_agreed"
    assert not ResultUpload.objects.filter(agrees_with=earlier).exists()


def test_an_agreement_still_being_checked_is_not_saved(
    client, station, earlier, provider, monkeypatch
):
    monkeypatch.setattr(machine_checks, "_queue_comparison", lambda check_id: None)
    provider(message(reply()))
    started = agree(client, station, earlier.id)

    response = save(client, started.json()["check_id"])

    assert response.status_code == 409
    assert response.json()["code"] == "not_agreed"


def test_an_earlier_upload_that_stopped_counting_is_not_agreed_with(
    client, station, earlier, provider
):
    check = agreed_check(client, station, earlier, provider)
    ResultUpload.objects.filter(pk=earlier.pk).update(is_current=False)

    response = save(client, check.id)

    assert response.status_code == 409
    assert response.json()["code"] == "reference_not_usable"


def test_another_persons_check_cannot_be_saved(client, station, earlier, provider):
    check = agreed_check(client, station, earlier, provider)

    response = save(other_client(), check.id)

    assert response.status_code == 409
    assert response.json()["code"] == "check_not_usable"


def test_a_first_reading_cannot_be_saved_as_an_agreement(
    client, station, earlier, provider
):
    from results.test_reading import start

    provider(message(reply()), message(comparison()))
    started = start(client, station)

    response = save(client, started.json()["check_id"])

    assert response.status_code == 409
    assert response.json()["code"] == "check_not_usable"


def test_nobody_agrees_with_an_agreement(client, station, earlier, provider):
    check = agreed_check(client, station, earlier, provider)
    saved = save(client, check.id).json()["id"]
    provider()

    response = agree(other_client(role="party_agent"), station, saved)

    assert response.status_code == 404
    assert response.json()["code"] == "reference_not_usable"


# ── Disagreeing with the same counts ────────────────────────────────────


def test_the_same_counts_as_an_earlier_upload_are_refused(
    client, station, mca_candidates, earlier
):
    response = upload(client, station, mca_candidates)

    assert response.status_code == 400
    assert response.json()["code"] == "same_as_earlier"
    assert response.json()["error"] == (
        "Your results are the same as an upload already made for this form. "
        "Tap Agree instead."
    )
    assert ResultUpload.objects.count() == 1


def test_other_counts_are_accepted(client, station, mca_candidates, earlier):
    ann, ben = mca_candidates

    response = upload(
        client, station, mca_candidates, votes={str(ann.id): 10, str(ben.id): 41}
    )

    assert response.status_code == 201


def test_an_earlier_upload_that_does_not_count_refuses_nothing(
    client, station, mca_candidates, earlier
):
    ResultUpload.objects.filter(pk=earlier.pk).update(location_grade=LOCATION_MISMATCH)

    assert upload(client, station, mca_candidates).status_code == 201


# ── Disagreeing with a changed form ─────────────────────────────────────


def disagree(api_client, at, provider, compared):
    """Read a photo showing Ben 41, against the earlier upload's 11; it is
    compared with the earlier photo at the same time."""
    provider(message(reply(votes=(10, 41))), message(compared))
    return read_only(api_client, at)


def submit(api_client, at, candidates, check_id):
    ann, ben = candidates
    votes = json.dumps({str(ann.id): 10, str(ben.id): 41})
    return send(api_client, at, candidates, check_id=check_id, votes=votes)


def test_a_form_changed_since_the_earlier_photo_does_not_count(
    client, station, mca_candidates, earlier, provider
):
    data = disagree(client, station, provider, comparison(differences=[difference()]))

    assert data["agreement"] is False
    assert data["outcome"] == reading.READ_COMPLETE
    # Shown where the figures look written over, and told a person will look.
    assert data["form_changed"] is True
    assert data["message"].endswith("A person will also check the photo.")
    marked = client.get(data["marked_photo"])
    assert marked.status_code == 200
    assert marked["Content-Type"] == "image/jpeg"
    compared = MachineCheck.objects.get(kind=MachineCheck.COMPARE)
    assert (compared.reference, compared.outcome) == (earlier, comparing.FORM_CHANGED)

    response = submit(client, station, mca_candidates, data["check_id"])

    assert response.status_code == 201, response.json()
    stored = ResultUpload.objects.exclude(pk=earlier.pk).get()
    assert stored.form_changed
    stored.location_grade = CENTRE_MATCH
    assert not stored.countable


@pytest.mark.parametrize(
    "compared",
    [
        comparison(),
        comparison(sheet="different_sheet"),
        comparison(sheet="cannot_tell"),
    ],
)
def test_a_form_not_found_changed_is_stored_as_usual(
    client, station, mca_candidates, earlier, provider, compared
):
    data = disagree(client, station, provider, compared)

    assert data["form_changed"] is False
    assert "marked_photo" not in data
    assert "A person will also check" not in data["message"]
    response = submit(client, station, mca_candidates, data["check_id"])
    assert response.status_code == 201, response.json()
    assert not ResultUpload.objects.exclude(pk=earlier.pk).get().form_changed


def test_an_upload_waits_for_the_comparison(
    client, station, mca_candidates, earlier, provider, monkeypatch
):
    monkeypatch.setattr(machine_checks, "_queue_comparison", lambda check_id: None)
    provider(message(reply(votes=(10, 41))))
    data = read_only(client, station)

    assert data["status"] == "running"
    response = submit(client, station, mca_candidates, data["check_id"])
    assert response.status_code == 409
    assert response.json()["code"] == "check_running"
    assert ResultUpload.objects.count() == 1


# ── The station's uploads, one card each ──────────────────────────────


def labels(card):
    return [tag["label"] for tag in card["tags"]]


def test_a_station_with_no_upload_lists_nothing(client, station, mca_candidates):
    data = listing(client, station).json()

    assert data == {"uploads": [], "may_disagree": False}


def test_another_persons_upload_shows_its_photo_and_tags_only(client, station, earlier):
    data = listing(client, station).json()

    (card,) = data["uploads"]
    assert card["id"] == str(earlier.id)
    assert card["mine"] is False
    assert labels(card) == ["First upload"]
    assert card["may_agree"] is True
    assert data["may_disagree"] is True
    text = json.dumps(data)
    assert "votes" not in text and "added_by" not in text
    assert str(earlier.added_by.phone_number) not in text


def test_an_agents_upload_is_tagged(client, station, earlier):
    earlier.added_by.role = "party_agent"
    earlier.added_by.save()

    card = listing(client, station).json()["uploads"][0]

    assert labels(card) == ["First upload", "Agent uploaded"]


def test_a_saved_agreement_verifies_both_photos(client, station, earlier, provider):
    check = agreed_check(client, station, earlier, provider)
    save(client, check.id)
    # Located at the centre, so the agreement counts.
    ResultUpload.objects.filter(agrees_with=earlier).update(location_grade=CENTRE_MATCH)

    first, agreement = listing(other_client(), station).json()["uploads"]

    assert labels(first) == ["First upload", "Verified by 2 people", "AI verified"]
    # The person who agreed is a party agent (the reading tests read as one).
    assert labels(agreement) == [
        "Agent uploaded",
        "Verified by 2 people",
        "AI verified",
    ]
    assert agreement["agrees_with"] == str(earlier.id)
    assert agreement["may_agree"] is False


def test_the_persons_own_upload_comes_first_with_its_figures(
    client, station, mca_candidates, earlier
):
    ann, ben = mca_candidates
    upload(client, station, mca_candidates, votes={str(ann.id): 10, str(ben.id): 41})

    data = listing(client, station).json()

    own, other = data["uploads"]
    assert own["mine"] is True
    assert own["countable"] is False  # sent with no location
    assert {row["votes"] for row in own["votes"]} == {10, 41}
    assert own["photo_preview"]
    # Not countable, so not the first upload; the tests upload as an agent.
    assert labels(own) == ["Agent uploaded"]
    assert other["id"] == str(earlier.id) and "votes" not in other
    # One upload each: nothing left to agree or disagree with.
    assert other["may_agree"] is False
    assert data["may_disagree"] is False


def test_a_persons_agreement_comes_first_with_its_tags(
    client, station, earlier, provider
):
    check = agreed_check(client, station, earlier, provider)
    save(client, check.id)
    ResultUpload.objects.filter(agrees_with=earlier).update(location_grade=CENTRE_MATCH)

    own, first = listing(client, station).json()["uploads"]

    assert own["mine"] is True and own["agrees_with"] == str(earlier.id)
    assert labels(own) == ["Agent uploaded", "Verified by 2 people", "AI verified"]
    assert first["id"] == str(earlier.id)


def test_a_voter_may_disagree_but_not_agree(station, earlier):
    data = listing(other_client(role="voter"), station).json()

    assert data["uploads"][0]["may_agree"] is False
    assert data["may_disagree"] is True


def test_an_upload_that_does_not_count_is_not_shown_to_others(client, station, earlier):
    ResultUpload.objects.filter(pk=earlier.pk).update(location_grade=LOCATION_MISMATCH)

    assert listing(client, station).json()["uploads"] == []


def test_the_listing_needs_a_signed_in_person(station, earlier):
    assert listing(APIClient(), station).status_code == 401


# ── The photo others see ────────────────────────────────────────────────


def photo_with_exif(width=1200, height=1600):
    image = Image.new("RGB", (width, height), (240, 240, 240))
    exif = Image.Exif()
    exif[0x010F] = "PhoneMaker"  # Make
    exif[0x0110] = "PhoneModel"  # Model
    buffer = io.BytesIO()
    image.save(buffer, "JPEG", exif=exif.tobytes())
    return buffer.getvalue()


@pytest.mark.parametrize("size", [(1200, 1600), (3024, 4032)])
def test_the_photo_shown_to_others_carries_no_metadata(
    client, station, mca_candidates, size
):
    other = User.objects.create_user(phone_number="+254700000011", password="pw")
    shared = ResultUpload(
        key=uuid.uuid4(),
        added_by=other,
        polling_station=station,
        race="mca",
        votes={},
        rejected_votes=0,
        disputed_votes=0,
        quality_checked=True,
        location_grade=CENTRE_MATCH,
        server_qr_result=UNREAD,
    )
    shared.photo.save("photo.jpg", ContentFile(photo_with_exif(*size)), save=False)
    shared.save()
    assert dict(Image.open(shared.photo.open("rb")).getexif())

    response = client.get(reverse("result-upload-shared-photo", args=[shared.id]))

    assert response.status_code == 200
    assert response["Content-Type"] == "image/jpeg"
    image = Image.open(io.BytesIO(response.content))
    assert dict(image.getexif()) == {}


def test_a_photo_that_does_not_count_is_not_shown(client, earlier):
    ResultUpload.objects.filter(pk=earlier.pk).update(location_grade=LOCATION_MISMATCH)

    response = client.get(reverse("result-upload-shared-photo", args=[earlier.id]))

    assert response.status_code == 404
