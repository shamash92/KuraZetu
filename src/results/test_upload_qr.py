import io

import pytest
import qrcode
from PIL import Image

from results import uploads
from results.models import ResultUpload
from results.test_uploads import (  # noqa: F401 (pytest fixtures)
    account,
    client,
    located,
    mca_candidates,
    north_of_centre,
    private_uploads,
    public_results,
    upload,
    viewer,
    ward,
)
from stations.models import PollingCenter, PollingStation

pytestmark = pytest.mark.django_db

CENTRE_CODE = "0030170080001"
STREAM_1 = f"{CENTRE_CODE}01"
STREAM_2 = f"{CENTRE_CODE}02"
OTHER_CENTRE = "003017008000201"
MCA = "36"


@pytest.fixture
def station(ward):
    """Stream 1 of a centre with two streams, and a second centre."""
    centre = PollingCenter.objects.create(name="Centre", code="0001", ward=ward)
    PollingStation.objects.create(
        polling_center=centre, code=STREAM_2, registered_voters=500
    )
    other = PollingCenter.objects.create(name="Other", code="0002", ward=ward)
    PollingStation.objects.create(
        polling_center=other, code=OTHER_CENTRE, registered_voters=500
    )
    return PollingStation.objects.create(
        polling_center=centre, code=STREAM_1, registered_voters=500
    )


def form_photo(text=None, turn=0):
    """A phone-sized photo with the form's QR code in its top corner."""
    page = Image.new("RGB", (4032, 3024), (240, 240, 240))
    if text is not None:
        code = qrcode.make(text).get_image().convert("RGB").resize((500, 500))
        page.paste(code, (3300, 200))
    buffer = io.BytesIO()
    page.rotate(turn, expand=True).save(buffer, "JPEG", quality=90)
    return buffer.getvalue()


def send(client, at, candidates, photo):
    return upload(
        client, at, candidates, photo=photo, accuracy=10, **north_of_centre(20)
    )


@pytest.mark.parametrize("turn", [0, 90])
def test_a_form_for_the_named_station_and_race_matches(
    client, located, mca_candidates, turn
):
    response = send(client, located, mca_candidates, form_photo(STREAM_1 + MCA, turn))

    assert response.status_code == 201
    assert response.data["countable"] is True
    assert response.data["qr_message"] is None
    stored = ResultUpload.objects.get()
    assert (stored.server_qr_result, stored.server_qr_value) == (
        "match",
        STREAM_1 + MCA,
    )


@pytest.mark.parametrize(
    "printed, result",
    [
        (STREAM_2 + MCA, "other_stream"),
        (OTHER_CENTRE + MCA, "other_centre"),
        (STREAM_1 + "34", "other_form"),
    ],
)
def test_a_form_for_another_station_or_race_is_kept_but_cannot_count(
    client, located, mca_candidates, viewer, printed, result
):
    response = send(client, located, mca_candidates, form_photo(printed))

    # Stored for a reviewer, never refused.
    assert response.status_code == 201
    assert response.data["countable"] is False
    assert "A reviewer will check it" in response.data["qr_message"]
    stored = ResultUpload.objects.get()
    assert (stored.server_qr_result, stored.server_qr_value) == (result, printed)
    assert public_results(viewer, located)["waiting"] is False


@pytest.mark.parametrize(
    "printed",
    [
        None,
        # Not a station we know.
        "999999999999901" + MCA,
        # A QR that is not a form code at all.
        "https://example.com",
    ],
)
def test_a_form_code_that_cannot_be_read_still_counts(
    client, located, mca_candidates, viewer, printed
):
    response = send(client, located, mca_candidates, form_photo(printed))

    assert response.status_code == 201
    assert response.data["countable"] is True
    assert ResultUpload.objects.get().server_qr_result == "unread"
    assert public_results(viewer, located)["waiting"] is True


def test_a_reader_that_fails_never_blocks_the_upload(
    client, located, mca_candidates, monkeypatch
):
    def broken(photo):
        raise RuntimeError("reader crashed")

    monkeypatch.setattr(uploads, "read_qr", broken)

    response = send(client, located, mca_candidates, form_photo(STREAM_2 + MCA))

    assert response.status_code == 201
    assert response.data["countable"] is True
    stored = ResultUpload.objects.get()
    assert (stored.server_qr_result, stored.server_qr_value) == ("not_checked", "")
