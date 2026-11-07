from io import BytesIO

from django.contrib.auth import get_user_model
from django.urls import reverse

import pytest
from django_otp import DEVICE_ID_SESSION_KEY
from PIL import Image
from rest_framework.test import APIClient

from results.models import ResultUpload
from results.test_uploads import (  # noqa: F401 (pytest fixtures)
    account,
    client,
    jpeg,
    mca_candidates,
    north_of_centre,
    private_uploads,
    station,
    upload,
    ward,
)

User = get_user_model()

pytestmark = pytest.mark.django_db


@pytest.fixture
def stored(client, station, mca_candidates):
    upload(
        client,
        station,
        mca_candidates,
        photo=jpeg(4032, 3024),
        accuracy=10,
        **north_of_centre(20),
    )
    return ResultUpload.objects.get()


@pytest.fixture
def staff():
    user = User.objects.create_superuser(phone_number="+254700000009", password="pw")
    staff_client = APIClient()
    # The first backend only checks lockouts and cannot hold a session.
    staff_client.force_login(user, backend="django.contrib.auth.backends.ModelBackend")
    # Outside debug the admin also asks for a one-time code.
    device = user.totpdevice_set.create(name="phone", confirmed=True)
    session = staff_client.session
    session[DEVICE_ID_SESSION_KEY] = device.persistent_id
    session.save()
    return staff_client


def test_staff_see_an_upload_without_where_the_uploader_stood(staff, stored):
    page = staff.get(
        reverse("admin:results_resultupload_change", args=[stored.id])
    ).content.decode()

    assert stored.polling_station.code in page
    assert "Ann X: 10" in page
    # Neither the position nor the account is shown.
    assert "0.5001" not in page
    assert "+254700000002" not in page


def test_uploads_cannot_be_added_changed_or_deleted_in_the_admin(staff, stored):
    assert staff.get(reverse("admin:results_resultupload_add")).status_code == 403
    assert (
        staff.post(
            reverse("admin:results_resultupload_delete", args=[stored.id])
        ).status_code
        == 403
    )
    staff.post(
        reverse("admin:results_resultupload_change", args=[stored.id]),
        {"rejected_votes": 99},
    )
    stored.refresh_from_db()
    assert stored.rejected_votes == 2


@pytest.mark.parametrize("which, size", [("full", 4032), ("preview", 2048)])
def test_staff_open_the_photo_and_its_preview(staff, stored, which, size):
    response = staff.get(
        reverse("admin:results_resultupload_photo", args=[stored.id, which])
    )

    assert response.status_code == 200
    assert "no-store" in response["Cache-Control"]
    body = b"".join(response.streaming_content)
    assert max(Image.open(BytesIO(body)).size) == size


def test_people_who_are_not_staff_cannot_open_the_photo(client, stored):
    response = client.get(
        reverse("admin:results_resultupload_photo", args=[stored.id, "full"])
    )

    assert response.status_code == 302
