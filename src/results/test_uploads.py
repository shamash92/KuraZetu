import json
import uuid

from django.contrib.auth import get_user_model
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
