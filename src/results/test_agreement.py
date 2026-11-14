"""Agreeing with an earlier upload: the new photo is read and compared with
the earlier one at the same time."""

import io
import uuid

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse

import pytest
from PIL import Image

from results import comparing, machine_checks, reading
from results.location import CENTRE_MATCH, LOCATION_MISMATCH
from results.models import MachineCheck, ResultUpload
from results.qr import UNREAD
from results.test_reading import (  # noqa: F401 (pytest fixtures)
    URL,
    agent,
    failing,
    figure,
    message,
    provider,
    read_at_once,
    reply,
    result_url,
)
from results.test_uploads import (  # noqa: F401 (pytest fixtures)
    account,
    client,
    jpeg,
    mca_candidates,
    private_uploads,
    station,
    ward,
)

pytestmark = pytest.mark.django_db

User = get_user_model()

# The earlier photo differs from the one each test sends.
EARLIER_PHOTO = jpeg(3024, 4032)


def comparison(sheet="same_sheet", differences=(), both_usable=True, not_compared=()):
    return {
        "both_usable": both_usable,
        "unusable_reason": "",
        "sheet": sheet,
        "sheet_evidence": [
            {"mark": "stamp_position", "agrees": True, "description": "Same place."}
        ],
        "differences": list(differences),
        "not_compared": list(not_compared),
    }


def difference(
    part="candidate_votes",
    affects_figure=True,
    kind="digit_added",
    point={"x": 1600, "y": 800},
):
    return {
        "part": part,
        "candidate_name_as_printed": "ANN X" if part == "candidate_votes" else None,
        "kind": kind,
        "in_a": "70",
        "in_b": "170",
        "affects_figure": affects_figure,
        "point_in_b": point,
    }


@pytest.fixture(autouse=True)
def compare_at_once(monkeypatch):
    """Compare in the request instead of the worker, after the reading."""
    monkeypatch.setattr(
        machine_checks, "_queue_comparison", machine_checks.compare_stored
    )


@pytest.fixture
def earlier(station, mca_candidates):
    """Another person's countable upload: Ann 10, Ben 11, 2 rejected."""
    ann, ben = mca_candidates
    other = User.objects.create_user(phone_number="+254700000009", password="pw")
    upload = ResultUpload(
        key=uuid.uuid4(),
        added_by=other,
        polling_station=station,
        race="mca",
        votes={str(ann.id): 10, str(ben.id): 11},
        rejected_votes=2,
        disputed_votes=0,
        quality_checked=True,
        location_grade=CENTRE_MATCH,
        server_qr_result=UNREAD,
    )
    upload.photo.save("photo.jpg", ContentFile(EARLIER_PHOTO), save=False)
    upload.save()
    return upload


def agree(api_client, at, reference, photo=None):
    return api_client.post(
        URL,
        {
            "station": at.code,
            "race": "mca",
            "reference": str(reference),
            "photo": SimpleUploadedFile(
                "form.jpg", photo or jpeg(4032, 3024), "image/jpeg"
            ),
        },
        format="multipart",
    )


def agree_and_ask(api_client, at, reference, photo=None):
    started = agree(api_client, at, reference, photo)
    assert started.status_code == 202, started.json()
    return api_client.get(result_url(started.json()["check_id"])).json()


# ── Outcomes ────────────────────────────────────────────────────────────


def test_the_same_form_with_the_same_figures_agrees(client, station, earlier, provider):
    fake = provider(message(reply()), message(comparison()))

    data = agree_and_ask(client, station, earlier.id)

    assert data["status"] == "done"
    assert data["agreement"] is True
    assert data["outcome"] == machine_checks.AGREES
    assert data["message"] == "Your photo matches the uploaded form."
    assert data["retake"] is False
    # Sonnet read the photo, then Sonnet compared the two.
    assert fake.models == [reading.MODEL, reading.MODEL]
    read, compared = MachineCheck.objects.order_by("created_at")
    assert (read.kind, compared.kind) == (MachineCheck.READ, MachineCheck.COMPARE)
    assert read.reference == compared.reference == earlier
    assert compared.read_check == read
    assert compared.outcome == comparing.SAME_FORM
    assert compared.input["version"] == comparing.VERSION


def test_an_added_signature_still_agrees(client, station, earlier, provider):
    added = difference(part="agents_table", affects_figure=False, kind="mark_only_in_b")
    provider(message(reply()), message(comparison(differences=[added])))

    data = agree_and_ask(client, station, earlier.id)

    assert data["outcome"] == machine_checks.AGREES
    compared = MachineCheck.objects.get(kind=MachineCheck.COMPARE)
    assert compared.outcome == comparing.SAME_FORM_WITH_ADDITIONS


def test_an_agents_copy_with_the_same_figures_agrees(
    client, station, earlier, provider
):
    provider(message(reply()), message(comparison(sheet="different_sheet")))

    data = agree_and_ask(client, station, earlier.id)

    assert data["outcome"] == machine_checks.AGREES
    compared = MachineCheck.objects.get(kind=MachineCheck.COMPARE)
    assert compared.outcome == comparing.DIFFERENT_COPY


def test_a_figure_changed_between_the_photos_differs(
    client, station, earlier, provider
):
    provider(message(reply()), message(comparison(differences=[difference()])))

    data = agree_and_ask(client, station, earlier.id)

    assert data["outcome"] == machine_checks.FIGURES_DIFFER
    assert data["message"] == (
        "Some figures on your photo differ from the uploaded form."
    )
    # The figures read stay for the person who then disagrees.
    assert data["prefill"]["rejected_votes"] == 2


def test_a_figure_read_differently_differs(client, station, earlier, provider):
    provider(message(reply(votes=(10, 41))), message(comparison()))

    data = agree_and_ask(client, station, earlier.id)

    assert data["outcome"] == machine_checks.FIGURES_DIFFER


def test_an_agents_copy_with_other_figures_differs(client, station, earlier, provider):
    provider(
        message(reply(votes=(10, 41))), message(comparison(sheet="different_sheet"))
    )

    data = agree_and_ask(client, station, earlier.id)

    assert data["outcome"] == machine_checks.FIGURES_DIFFER


def test_a_reported_alteration_differs(client, station, earlier, provider):
    altered = {
        "field": "candidate_votes",
        "ballot_number": 1,
        "kind": "digit_inserted",
        "countersigned": "absent",
        "description": "",
        "possible_values": [10, 110],
    }
    provider(message(reply(alterations=[altered])), message(comparison()))

    data = agree_and_ask(client, station, earlier.id)

    assert data["outcome"] == machine_checks.FIGURES_DIFFER


def test_a_figure_that_cannot_be_read_is_not_checked(
    client, station, earlier, provider
):
    provider(message(reply(votes=(10, figure(11, "ambiguous")))), message(comparison()))

    data = agree_and_ask(client, station, earlier.id)

    assert data["outcome"] == machine_checks.NOT_CHECKED
    assert data["message"] == "Your photo could not be checked."


@pytest.mark.parametrize(
    "compared",
    [
        comparison(both_usable=False),
        comparison(sheet="cannot_tell"),
        comparison(not_compared=["candidate_votes"]),
    ],
)
def test_a_comparison_that_cannot_tell_is_not_checked(
    client, station, earlier, provider, compared
):
    provider(message(reply()), message(compared))

    data = agree_and_ask(client, station, earlier.id)

    assert data["outcome"] == machine_checks.NOT_CHECKED
    check = MachineCheck.objects.get(kind=MachineCheck.COMPARE)
    assert check.outcome == comparing.COMPARE_INCONCLUSIVE


def test_a_part_left_out_that_holds_no_figure_does_not_stop_agreement(
    client, station, earlier, provider
):
    provider(message(reply()), message(comparison(not_compared=["agents_table"])))

    data = agree_and_ask(client, station, earlier.id)

    assert data["outcome"] == machine_checks.AGREES


def test_failed_checks_are_never_an_agreement(
    client, station, earlier, provider, failing
):
    provider()
    failing(*[reading.PROVIDER_UNAVAILABLE] * 4)

    data = agree_and_ask(client, station, earlier.id)

    assert data["status"] == "done"
    assert data["outcome"] == machine_checks.NOT_CHECKED
    assert set(MachineCheck.objects.values_list("status", flat=True)) == {
        MachineCheck.FAILED
    }


def test_a_photo_that_is_not_a_form_is_retaken_and_not_compared(
    client, station, earlier, provider
):
    not_a_form = reply(
        screening={
            "is_results_form": False,
            "reason": "unrelated",
            "flagged": False,
            "flag_reason": "none",
        }
    )
    fake = provider(message(not_a_form))

    data = agree_and_ask(client, station, earlier.id)

    assert data["retake"] is True
    assert data["outcome"] == reading.NOT_A_RESULTS_FORM
    compared = MachineCheck.objects.get(kind=MachineCheck.COMPARE)
    assert compared.error == reading.PHOTO_DELETED
    # Only the reading called the model.
    assert fake.models == [reading.MODEL]


def test_the_phone_waits_for_both_checks(
    client, station, earlier, provider, monkeypatch
):
    monkeypatch.setattr(machine_checks, "_queue_comparison", lambda check_id: None)
    provider(message(reply()))

    data = agree_and_ask(client, station, earlier.id)

    assert data["status"] == "running"
    assert data["outcome"] is None


def test_a_first_reading_is_not_an_agreement(client, station, earlier, provider):
    from results.test_reading import send

    provider(message(reply()), message(comparison()))

    data = send(client, station).json()

    assert data["agreement"] is False
    assert data["outcome"] == reading.READ_COMPLETE
    assert MachineCheck.objects.get(kind=MachineCheck.READ).reference is None


# ── Who may agree, and with what ────────────────────────────────────────


def test_a_voter_is_refused_before_anything_is_stored(
    client, account, station, earlier, provider
):
    fake = provider()
    account.role = "voter"
    account.save()

    response = agree(client, station, earlier.id)

    assert response.status_code == 403
    assert not MachineCheck.objects.exists()
    assert fake.models == []


def test_nobody_agrees_with_their_own_upload(
    client, account, station, earlier, provider
):
    earlier.added_by = account
    earlier.save()
    provider()

    response = agree(client, station, earlier.id)

    assert response.status_code == 409
    assert response.json()["code"] == "already_uploaded"


def test_a_person_who_uploaded_cannot_agree(
    client, account, station, earlier, mca_candidates, provider
):
    ResultUpload.objects.create(
        key=uuid.uuid4(),
        added_by=account,
        polling_station=station,
        race="mca",
        votes={},
        rejected_votes=0,
        disputed_votes=0,
        quality_checked=True,
        photo=ContentFile(jpeg(), name="mine.jpg"),
    )
    provider()

    response = agree(client, station, earlier.id)

    assert response.status_code == 409
    assert response.json()["code"] == "already_uploaded"


@pytest.mark.parametrize(
    "change",
    [
        {"is_current": False},
        {"race": "governor"},
        {"location_grade": LOCATION_MISMATCH},
    ],
)
def test_an_upload_that_cannot_be_agreed_with_is_refused(
    client, station, earlier, provider, change
):
    ResultUpload.objects.filter(pk=earlier.pk).update(**change)
    provider()

    response = agree(client, station, earlier.id)

    assert response.status_code == 404
    assert response.json()["code"] == "reference_not_usable"
    assert not MachineCheck.objects.exists()


def test_an_unknown_upload_is_refused(client, station, earlier, provider):
    provider()

    response = agree(client, station, uuid.uuid4())

    assert response.status_code == 404
    assert response.json()["code"] == "reference_not_usable"


def test_the_earlier_photo_sent_again_is_refused(client, station, earlier, provider):
    fake = provider()

    response = agree(client, station, earlier.id, photo=EARLIER_PHOTO)

    assert response.status_code == 409
    assert response.json()["code"] == "same_photo"
    assert not MachineCheck.objects.exists()
    assert fake.models == []


# ── Agreeing after a reading that shows the same results ───────────────


def read_only(api_client, at):
    """Read a photo with no earlier upload to agree with, as Disagree does.
    It is compared with the earliest upload at the same time."""
    started = api_client.post(
        URL,
        {
            "station": at.code,
            "race": "mca",
            "photo": SimpleUploadedFile("form.jpg", jpeg(4032, 3024), "image/jpeg"),
        },
        format="multipart",
    )
    assert started.status_code == 202, started.json()
    return api_client.get(result_url(started.json()["check_id"])).json()


def agree_after(api_client, check_id, reference):
    return api_client.post(
        reverse("result-photo-agree", args=[check_id]),
        {"reference": str(reference)},
        format="json",
    )


def test_a_reading_with_the_earlier_results_names_that_upload(
    client, station, earlier, provider
):
    provider(message(reply()), message(comparison()))

    data = read_only(client, station)

    assert data["same_as"] == str(earlier.id)


def test_a_reading_with_other_results_names_no_upload(
    client, station, earlier, provider
):
    provider(message(reply(votes=(10, 41))), message(comparison()))

    data = read_only(client, station)

    assert data["same_as"] is None


def test_agreeing_after_the_reading_compares_the_photo_already_read(
    client, station, earlier, provider
):
    fake = provider(message(reply()), message(comparison()))
    read = read_only(client, station)

    answered = agree_after(client, read["check_id"], earlier.id)

    assert answered.status_code == 202, answered.json()
    data = client.get(result_url(read["check_id"])).json()
    assert data["agreement"] is True
    assert data["outcome"] == machine_checks.AGREES
    # Read once, then compared once: the photo is not read again.
    assert fake.models == [reading.MODEL, reading.MODEL]
    check, compared = MachineCheck.objects.order_by("created_at")
    assert check.reference == compared.reference == earlier
    assert compared.read_check == check


def test_a_photo_already_compared_is_not_compared_again(
    client, station, earlier, provider
):
    provider(message(reply()), message(comparison()))
    data = agree_and_ask(client, station, earlier.id)

    answered = agree_after(client, data["check_id"], earlier.id)

    assert answered.status_code == 409
    assert answered.json()["code"] == "not_comparable"


# ── The comparison request ──────────────────────────────────────────────


def test_the_model_gets_both_photos_and_no_figures():
    body = comparing.request(reading.MODEL, jpeg(30, 40), jpeg(60, 80))

    content = body["messages"][0]["content"]
    assert [part["type"] for part in content] == ["image", "text", "image", "text"]
    assert content[1]["text"] == "Photograph A, taken earlier."
    # The only numbers are the size of photograph B, for placing arrows.
    assert content[3]["text"] == (
        "Photograph B, taken later, 60 wide by 80 high pixels.\n\n"
        "Compare the two photographs and fill in the reply."
    )
    assert body["system"][0]["text"] == comparing.SYSTEM
    assert body["output_config"]["format"]["schema"] == comparing.REPLY_FORMAT


# ── The checklist the phone shows ───────────────────────────────────────


def lines(data):
    return {c["code"]: (c["state"], c["details"]) for c in data["checks"]}


def test_a_matching_photo_passes_every_line(client, station, earlier, provider):
    provider(message(reply()), message(comparison()))

    data = agree_and_ask(client, station, earlier.id)

    assert [c["label"] for c in data["checks"]] == [
        "QR code matches this stream",
        "Photo is of the paper form and clear",
        "Same form as the first upload",
        "Every candidate's votes match",
        "Rejected and disputed votes match",
        "Total valid votes match, no figure written over",
    ]
    assert lines(data) == {
        # The test photo has no QR code; that does not stop an agreement.
        "qr": ("not_read", []),
        "photo": ("passed", []),
        "same_form": ("passed", []),
        "votes": ("passed", []),
        "counts": ("passed", []),
        "total": ("passed", []),
    }
    assert data["outcome"] == machine_checks.AGREES


def test_a_differing_vote_is_named_with_the_photos_number_only(
    client, station, earlier, provider
):
    provider(message(reply(votes=(10, 12))), message(comparison()))

    data = agree_and_ask(client, station, earlier.id)

    assert lines(data)["votes"] == ("failed", ["Ben X: your photo shows 12"])
    # The earlier upload's typed 11 is never shown.
    assert "11" not in str(data["checks"])
    assert data["outcome"] == machine_checks.FIGURES_DIFFER


def test_an_unclear_figure_is_named(client, station, earlier, provider):
    provider(message(reply(votes=(10, figure(11, "ambiguous")))), message(comparison()))

    data = agree_and_ask(client, station, earlier.id)

    assert lines(data)["votes"] == ("failed", ["Ben X: could not be read"])
    assert data["outcome"] == machine_checks.NOT_CHECKED


def test_a_differing_total_stops_the_agreement(client, station, earlier, provider):
    provider(
        message(reply(totals__valid_votes_in_counts=figure(20))),
        message(comparison()),
    )

    data = agree_and_ask(client, station, earlier.id)

    assert lines(data)["total"] == ("failed", ["Total: your photo shows 20"])
    assert data["outcome"] == machine_checks.FIGURES_DIFFER


def test_an_unclear_total_is_not_checked(client, station, earlier, provider):
    provider(
        message(reply(totals__valid_votes_in_counts=figure(21, "ambiguous"))),
        message(comparison()),
    )

    data = agree_and_ask(client, station, earlier.id)

    assert lines(data)["total"] == ("failed", ["Total: could not be read"])
    assert data["outcome"] == machine_checks.NOT_CHECKED


def test_a_screen_photo_fails_the_photo_line(client, station, earlier, provider):
    provider(message(reply(capture__photo_of_screen="present")), message(comparison()))

    data = agree_and_ask(client, station, earlier.id)

    assert lines(data)["photo"] == ("failed", [])
    assert lines(data)["votes"] == ("passed", [])
    assert data["outcome"] == machine_checks.NOT_CHECKED


def test_a_changed_form_fails_the_same_form_line(client, station, earlier, provider):
    provider(message(reply()), message(comparison(differences=[difference()])))

    data = agree_and_ask(client, station, earlier.id)

    assert lines(data)["same_form"] == ("failed", [])
    assert data["outcome"] == machine_checks.FIGURES_DIFFER


def test_lines_still_running_show_as_running(
    client, station, earlier, provider, monkeypatch
):
    monkeypatch.setattr(machine_checks, "_queue_comparison", lambda check_id: None)
    provider(message(reply()))

    data = agree_and_ask(client, station, earlier.id)

    assert data["status"] == "running"
    assert lines(data)["same_form"] == ("running", [])
    assert lines(data)["votes"] == ("passed", [])


# ── The photo with an arrow at each difference ──────────────────────────


def test_each_difference_gets_an_arrow_on_the_persons_photo(
    client, station, earlier, provider
):
    provider(message(reply()), message(comparison(differences=[difference()])))

    data = agree_and_ask(client, station, earlier.id)

    response = client.get(data["marked_photo"])
    assert response.status_code == 200
    assert response["Content-Type"] == "image/jpeg"
    marked = Image.open(io.BytesIO(response.content)).convert("RGB")
    check = MachineCheck.objects.get(pk=data["check_id"])
    assert marked.size == Image.open(check.model_copy.open("rb")).size
    # The arrow runs to the right of the figure at (1600, 800).
    right = [marked.getpixel((x, 800)) for x in range(1600, 1800)]
    assert any(r > 150 and g < 100 and b < 100 for r, g, b in right)
    # Nothing is drawn to its left.
    left = [marked.getpixel((x, 800)) for x in range(0, 1550)]
    assert not any(r > 150 and g < 100 and b < 100 for r, g, b in left)


def test_a_matching_photo_has_nothing_to_mark(client, station, earlier, provider):
    provider(message(reply()), message(comparison()))

    data = agree_and_ask(client, station, earlier.id)

    assert "marked_photo" not in data
    response = client.get(f"{result_url(data['check_id'])}marked-photo/")
    assert response.status_code == 404


def test_a_difference_with_no_point_is_not_marked(client, station, earlier, provider):
    provider(
        message(reply()), message(comparison(differences=[difference(point=None)]))
    )

    data = agree_and_ask(client, station, earlier.id)

    assert data["outcome"] == machine_checks.FIGURES_DIFFER
    assert "marked_photo" not in data


def test_nobody_else_can_open_the_marked_photo(client, station, earlier, provider):
    from results.test_agreement_save import other_client

    provider(message(reply()), message(comparison(differences=[difference()])))
    data = agree_and_ask(client, station, earlier.id)

    assert other_client().get(data["marked_photo"]).status_code == 404
