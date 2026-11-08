import json
import uuid

from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile

import pytest

from accounts.models import User
from results.models import MachineCheck, ResultUpload
from results.test_uploads import (  # noqa: F401 (pytest fixtures)
    JPEG,
    URL,
    account,
    client,
    mca_candidates,
    private_uploads,
    station,
    ward,
)

pytestmark = pytest.mark.django_db


def make_check(account, station, race="mca", photo=True, **fields):
    check = MachineCheck(
        account=account,
        polling_station=station,
        race=race,
        input={},
        status=MachineCheck.DONE,
        outcome="read_complete",
        server_qr_result="match",
        server_qr_value="00000010136",
        **fields,
    )
    if photo:
        check.photo.save("photo.jpg", ContentFile(JPEG), save=False)
    check.save()
    return check


def send(api_client, at, candidates, **fields):
    data = {
        "station": at.code,
        "race": "mca",
        "votes": json.dumps({str(c.id): 10 + i for i, c in enumerate(candidates)}),
        "rejected_votes": "2",
        "disputed_votes": "0",
        "quality_checked": "true",
        "key": str(uuid.uuid4()),
        **fields,
    }
    return api_client.post(URL, data, format="multipart")


def test_an_upload_uses_the_photo_of_its_reading(
    client, account, station, mca_candidates
):
    check = make_check(account, station)

    response = send(client, station, mca_candidates, check_id=str(check.id))

    assert response.status_code == 201
    upload = ResultUpload.objects.get()
    assert upload.photo.read() == JPEG
    # The code read when the photo was checked is kept, not read again.
    assert upload.server_qr_result == "match"
    check.refresh_from_db()
    assert check.upload == upload


@pytest.mark.parametrize(
    "case",
    ["other_account", "other_race", "already_used", "photo_deleted"],
)
def test_a_reading_that_cannot_be_used_stores_nothing(
    client, account, station, mca_candidates, case
):
    owner = account
    if case == "other_account":
        owner = User.objects.create_user(phone_number="+254700000009", password="pw")
    check = make_check(
        owner,
        station,
        race="mp" if case == "other_race" else "mca",
        photo=case != "photo_deleted",
    )
    if case == "already_used":
        earlier = ResultUpload.objects.create(
            added_by=account,
            polling_station=station,
            race="mca",
            votes={},
            rejected_votes=0,
            disputed_votes=0,
            quality_checked=True,
            key=uuid.uuid4(),
            is_current=False,
        )
        check.upload = earlier
        check.save()

    response = send(client, station, mca_candidates, check_id=str(check.id))

    assert response.status_code == 400
    assert response.data["code"] == "check_not_usable"
    assert ResultUpload.objects.filter(is_current=True).count() == 0


@pytest.mark.parametrize("give_photo, give_check", [(True, True), (False, False)])
def test_an_upload_sends_the_photo_or_its_reading_not_both(
    client, account, station, mca_candidates, give_photo, give_check
):
    fields = {}
    if give_photo:
        fields["photo"] = SimpleUploadedFile("form.jpg", JPEG, "image/jpeg")
    if give_check:
        fields["check_id"] = str(make_check(account, station).id)

    response = send(client, station, mca_candidates, **fields)

    assert response.status_code == 400
    assert response.data["code"] == "invalid_request"
    assert not ResultUpload.objects.exists()
