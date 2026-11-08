import io
import json
from datetime import timedelta
from types import SimpleNamespace

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone

import pytest
from PIL import Image

from results import machine_checks, reading
from results.models import MachineCheck
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

# The path comes from the environment, so look it up by name.
URL = reverse("result-photo-reading")


def figure(value, legibility="clear", blank=False):
    return {
        "as_written": "" if value is None else str(value),
        "value": value,
        "blank": blank,
        "legibility": legibility,
        "possible_values": [],
    }


def text(as_printed, legibility="clear"):
    return {"as_printed": as_printed, "legibility": legibility}


def reply(votes=(10, 11), **changes):
    """A reply for a Form 36A of station 000000101 with two candidates."""
    seen = "present"
    body = {
        "screening": {
            "is_results_form": True,
            "reason": "results_form",
            "flagged": False,
            "flag_reason": "none",
        },
        "capture": {
            "whole_page_visible": True,
            "photo_of_screen": "absent",
            "sheet_kind": "printed_form_in_pen",
            "readability": "good",
            "quality_problems": [],
            "notes": "",
        },
        "identity": {
            "form_number": text("FORM 36A"),
            "county": text("COUNTY"),
            "constituency": text("CONSTITUENCY"),
            "ward": text("WARD"),
            "polling_centre": text("CENTRE"),
            "station_code": text("000000101", "ambiguous"),
            "stream": text("1 of 1"),
            "serial_number": text("123"),
        },
        "candidates": [
            {"ballot_number": n, "name_as_printed": "NAME", "votes": v}
            for n, v in enumerate(
                (figure(v) if not isinstance(v, dict) else v for v in votes), 1
            )
        ],
        "extra_rows": [],
        "totals": {
            "valid_votes_under_table": figure(21),
            "valid_votes_in_counts": figure(21),
            "registered_voters": figure(500),
            "rejected": figure(2),
            "rejection_objected": figure(0),
            "disputed": figure(0),
        },
        "marks": {
            "presiding_officer_signature": seen,
            "deputy_presiding_officer_signature": seen,
            "stamp": seen,
            "stamp_count": 1,
            "agent_rows_filled": 2,
            "agent_rows_signed": 2,
            "refusal_reasons_written": "absent",
            "comments_written": "absent",
        },
        "alterations": [],
    }
    for path, value in changes.items():
        if "__" in path:
            part, key = path.split("__")
            body[part][key] = value
        else:
            body[path] = value
    return body


def message(body=None, stop_reason="end_turn", model=reading.MODEL):
    return SimpleNamespace(
        stop_reason=stop_reason,
        model=model,
        content=[
            SimpleNamespace(type="thinking", thinking=""),
            SimpleNamespace(type="text", text=json.dumps(body or reply())),
        ],
        usage=SimpleNamespace(input_tokens=5000, output_tokens=2000),
        _request_id="req_1",
    )


class FakeProvider:
    """Answers each model in turn with the given message or error code."""

    def __init__(self, *answers):
        self.answers = list(answers)
        self.models = []

    def with_options(self, **options):
        return self

    @property
    def messages(self):
        return self

    def stream(self, **body):
        self.models.append(body["model"])
        return FakeStream(self.answers.pop(0))


class FakeStream:
    """A streamed reply: the events, then the whole message."""

    request_id = "req_test"

    def __init__(self, message, events=()):
        self.message = message
        self.events = events

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def __iter__(self):
        return iter(self.events)

    def get_final_message(self):
        return self.message


@pytest.fixture
def failing(monkeypatch):
    """Make the provider's calls fail with each error code, in turn."""

    def use(*codes):
        codes = list(codes)

        def call(client, body, timeout, clock):
            raise reading._Failed(codes.pop(0))

        monkeypatch.setattr(reading, "_call", call)

    return use


# ── The copy the model reads ────────────────────────────────────────────


def test_a_phone_photo_is_shrunk_to_the_largest_size_read_in_full():
    data, width, height = reading.model_copy(io.BytesIO(jpeg(4032, 3024)))

    assert (width, height) == Image.open(io.BytesIO(data)).size
    assert max(width, height) <= reading.MAX_LONG_SIDE_PX
    patches = -(-width // 28) * -(-height // 28)
    assert 4600 < patches <= reading.MAX_PATCHES


def test_a_small_photo_is_not_enlarged():
    _, width, height = reading.model_copy(io.BytesIO(jpeg(1200, 1600)))

    assert (width, height) == (1200, 1600)


# ── Sonnet, then Opus only when Sonnet fails ────────────────────────────


def test_sonnet_reads_and_opus_is_not_called():
    provider = FakeProvider(message())

    result = reading.read(provider, b"jpeg", "text")

    assert provider.models == [reading.MODEL]
    assert result.reply == reply()
    assert result.attempts == [{"model": reading.MODEL, "error": None}]


@pytest.mark.parametrize(
    "first, code",
    [
        (message(stop_reason="refusal"), reading.MODEL_REFUSED),
        (message(stop_reason="max_tokens"), reading.REPLY_TRUNCATED),
        (
            SimpleNamespace(
                stop_reason="end_turn",
                content=[SimpleNamespace(type="text", text="{}")],
            ),
            reading.REPLY_INVALID,
        ),
    ],
)
def test_opus_reads_when_sonnet_does_not_finish(first, code):
    provider = FakeProvider(first, message(model=reading.FALLBACK_MODEL))

    result = reading.read(provider, b"jpeg", "text")

    assert provider.models == [reading.MODEL, reading.FALLBACK_MODEL]
    assert result.model == reading.FALLBACK_MODEL
    assert (result.attempts[0]["model"], result.attempts[0]["error"]) == (
        reading.MODEL,
        code,
    )


def test_when_both_fail_the_last_error_is_kept(failing):
    failing(reading.PROVIDER_UNAVAILABLE, reading.TIMEOUT)

    with pytest.raises(reading.ReadFailed) as failed:
        reading.read(None, b"jpeg", "text")

    assert failed.value.code == reading.TIMEOUT
    assert len(failed.value.attempts) == 2


def test_rejected_credentials_do_not_try_opus(failing):
    failing(reading.AUTH_FAILED)

    with pytest.raises(reading.ReadFailed) as failed:
        reading.read(None, b"jpeg", "text")

    assert [a["model"] for a in failed.value.attempts] == [reading.MODEL]


def test_no_opus_when_too_little_of_the_time_is_left(failing):
    failing(reading.TIMEOUT)
    times = iter([0, 0, reading.DEADLINE_S - 1.5])

    with pytest.raises(reading.ReadFailed) as failed:
        reading.read(None, b"jpeg", "text", clock=lambda: next(times))

    assert len(failed.value.attempts) == 1


# ── Outcome: the first check that fits ────────────────────────────────


def outcome(body):
    return reading.outcome(body, "000000101", "36", [1, 2])


def test_a_complete_reading():
    assert outcome(reply()) == reading.READ_COMPLETE


@pytest.mark.parametrize(
    "body, code",
    [
        (
            reply(screening={"is_results_form": False, "reason": "sexual"}),
            reading.PHOTO_BLOCKED,
        ),
        (
            reply(
                screening={"is_results_form": False, "reason": "threat_or_incitement"}
            ),
            reading.PHOTO_BLOCKED,
        ),
        (
            reply(screening={"is_results_form": False, "reason": "other_picture"}),
            reading.NOT_A_RESULTS_FORM,
        ),
        (
            reply(screening={"is_results_form": False, "reason": "political_material"}),
            reading.PHOTO_BLOCKED,
        ),
        (
            reply(
                screening={
                    "is_results_form": True,
                    "reason": "results_form",
                    "flagged": True,
                    "flag_reason": "political_message",
                }
            ),
            reading.CONTENT_FLAGGED,
        ),
        (
            reply(identity__station_code=text("000000000000102")),
            reading.OTHER_STATION,
        ),
        (reply(identity__form_number=text("FORM 34A")), reading.OTHER_FORM),
        (reply(capture__photo_of_screen="present"), reading.PHOTO_OF_SCREEN),
        (reply(capture__readability="poor"), reading.PHOTO_POOR),
        (reply(capture__readability="unreadable"), reading.PHOTO_UNREADABLE),
        (reply(votes=(10, figure(18, "ambiguous"))), reading.READ_INCOMPLETE),
        (reply(votes=(10, figure(None, blank=True))), reading.READ_INCOMPLETE),
        (reply(votes=(10,)), reading.READ_INCOMPLETE),
        (
            reply(
                alterations=[
                    {
                        "field": "candidate_votes",
                        "ballot_number": 1,
                        "kind": "digit_written_over",
                        "countersigned": "absent",
                        "description": "",
                        "possible_values": [10, 16],
                    }
                ]
            ),
            reading.ALTERATION_REPORTED,
        ),
    ],
)
def test_outcome_codes(body, code):
    assert outcome(body) == code


def test_a_station_code_read_two_ways_names_no_station():
    body = reply(identity__station_code=text("000000000000102", "ambiguous"))

    assert outcome(body) == reading.READ_COMPLETE


def test_only_figures_read_one_way_fill_the_form():
    body = reply(votes=(10, figure(18, "ambiguous")))

    assert reading.prefill(body, [1, 2]) == {
        "votes": {1: 10, 2: None},
        "rejected": 2,
        "disputed": 0,
    }


# ── The reading step ────────────────────────────────────────────────────


def start(api_client, at, photo=None):
    from django.core.files.uploadedfile import SimpleUploadedFile

    return api_client.post(
        URL,
        {
            "station": at.code,
            "race": "mca",
            "photo": SimpleUploadedFile(
                "form.jpg", photo or jpeg(4032, 3024), "image/jpeg"
            ),
        },
        format="multipart",
    )


def send(api_client, at, photo=None):
    """Start a reading, then ask for its result as the phone does."""
    started = start(api_client, at, photo)
    if started.status_code != 202:
        return started
    return api_client.get(result_url(started.json()["check_id"]))


def result_url(check_id):
    return reverse("result-photo-reading-result", args=[check_id])


@pytest.fixture(autouse=True)
def read_at_once(monkeypatch):
    """Read in the request instead of the worker, so tests see the result."""
    monkeypatch.setattr(machine_checks, "_queue", machine_checks.read_stored)
    monkeypatch.setattr(
        machine_checks.transaction, "on_commit", lambda callback: callback()
    )


@pytest.fixture
def provider(monkeypatch, settings):
    settings.ANTHROPIC_API_KEY = "test"

    def answer(*answers):
        fake = FakeProvider(*answers)
        monkeypatch.setattr(machine_checks, "_client", lambda: fake)
        return fake

    return answer


def test_reading_needs_a_signed_in_person(station):
    from rest_framework.test import APIClient

    assert send(APIClient(), station).status_code == 401


def test_the_phone_gets_the_figures_read_one_way_and_never_the_reply(
    client, station, mca_candidates, provider
):
    ann, ben = mca_candidates
    provider(message(reply(votes=(10, figure(18, "ambiguous")))))

    response = send(client, station)

    assert response.status_code == 200
    data = response.json()
    check = MachineCheck.objects.get()
    # Candidates are numbered by surname: both are X, then by first name.
    assert data["prefill"] == {
        "votes": {str(ann.id): 10, str(ben.id): None},
        "rejected_votes": 2,
        "disputed_votes": 0,
    }
    assert data["outcome"] == reading.READ_INCOMPLETE
    assert data["retake"] is False
    assert "reply" not in data and "candidates" not in json.dumps(data)
    assert check.status == MachineCheck.DONE
    assert check.model == reading.MODEL


def test_a_form_with_political_writing_is_read_and_kept_for_a_person(
    client, station, mca_candidates, provider
):
    ann, ben = mca_candidates
    screening = {
        "is_results_form": True,
        "reason": "results_form",
        "flagged": True,
        "flag_reason": "political_message",
    }
    provider(message(reply(screening=screening)))

    data = send(client, station).json()

    assert data["outcome"] == reading.CONTENT_FLAGGED
    assert data["retake"] is False
    assert data["prefill"]["votes"] == {str(ann.id): 10, str(ben.id): 11}
    assert MachineCheck.objects.get().photo


def test_a_photo_to_retake_fills_nothing(client, station, mca_candidates, provider):
    provider(message(reply(capture__readability="unreadable")))

    data = send(client, station).json()

    assert data["retake"] is True
    assert data["prefill"] is None
    assert data["message"] == reading.MESSAGES[reading.PHOTO_UNREADABLE]


def test_the_model_is_not_told_the_station_or_the_account(
    client, station, mca_candidates, provider, account, monkeypatch
):
    sent = []
    fake = provider(message())
    real_stream = fake.stream
    monkeypatch.setattr(
        fake, "stream", lambda **body: sent.append(body) or real_stream(**body)
    )

    send(client, station)

    text = json.dumps(sent[0]["messages"][0]["content"][1])
    assert station.code not in text
    assert account.phone_number.as_e164 not in text
    check = MachineCheck.objects.get()
    assert "station" not in check.input
    assert check.input["form_number"] == "36A"
    assert check.input["photograph"]["width"] <= reading.MAX_LONG_SIDE_PX
    assert check.photo and check.model_copy


def test_without_a_key_machine_reading_is_switched_off(
    client, station, mca_candidates, settings
):
    settings.ANTHROPIC_API_KEY = ""

    response = send(client, station)

    assert response.status_code == 200
    assert response.json()["status"] == "failed"
    assert MachineCheck.objects.get().error == reading.SWITCHED_OFF


def test_a_failed_reading_still_answers(
    client, station, mca_candidates, provider, failing
):
    provider()
    failing(reading.PROVIDER_UNAVAILABLE, reading.PROVIDER_UNAVAILABLE)

    response = send(client, station)

    assert response.status_code == 200
    assert response.json() == {
        "check_id": str(MachineCheck.objects.get().id),
        "status": "failed",
        "outcome": None,
        "message": None,
        "retake": False,
        "prefill": None,
    }


# ── The QR code is read first ───────────────────────────────────────────


def test_a_qr_for_another_station_ends_the_check_without_the_model(
    client, station, mca_candidates, provider, monkeypatch
):
    fake = provider()
    monkeypatch.setattr(machine_checks.qr, "read_qr", lambda photo: "x")
    monkeypatch.setattr(machine_checks.qr, "classify", lambda *a: "other_stream")

    data = send(client, station).json()

    assert fake.models == []
    assert data["outcome"] == reading.OTHER_STATION
    assert data["retake"] is True
    assert MachineCheck.objects.get().server_qr_result == "other_stream"


def test_a_matching_qr_outweighs_the_small_print(
    client, station, mca_candidates, provider, monkeypatch
):
    provider(message(reply(identity__station_code=text("000000000000102"))))
    monkeypatch.setattr(machine_checks.qr, "read_qr", lambda photo: "x")
    monkeypatch.setattr(machine_checks.qr, "classify", lambda *a: "match")

    assert send(client, station).json()["outcome"] == reading.READ_COMPLETE


@pytest.mark.parametrize(
    "reason, code",
    [
        ("hateful_or_vulgar", reading.PHOTO_BLOCKED),
        ("other_picture", reading.NOT_A_RESULTS_FORM),
    ],
)
def test_a_photo_that_is_not_a_form_is_deleted_at_once(
    client, station, mca_candidates, provider, private_uploads, reason, code
):
    screening = {"is_results_form": False, "reason": reason}
    provider(message(reply(screening=screening)))

    data = send(client, station).json()

    assert data["retake"] is True
    assert data["outcome"] == code
    assert data["message"] == reading.MESSAGES[code]
    check = MachineCheck.objects.get()
    assert not check.photo and not check.model_copy
    assert not list(private_uploads.rglob("*.jpg"))
    # Only the reason is kept.
    assert check.reply == {"screening": screening}


# ── Why a reading failed ────────────────────────────────────────────────


@pytest.mark.parametrize(
    "status, code",
    [
        (402, reading.NO_CREDIT),
        (401, reading.AUTH_FAILED),
        (403, reading.AUTH_FAILED),
        (429, reading.RATE_LIMITED),
        (529, reading.PROVIDER_UNAVAILABLE),
        (400, reading.REQUEST_REJECTED),
    ],
)
def test_each_provider_status_is_named(status, code):
    assert reading._status_code(SimpleNamespace(status_code=status)) == code


def test_the_provider_message_is_kept():
    error = SimpleNamespace(
        body={"error": {"message": "The compiled grammar is too large"}},
        message="Error code: 400",
    )

    assert reading._message(error) == "The compiled grammar is too large"


def test_no_credit_does_not_try_opus(failing):
    failing(reading.NO_CREDIT, reading.NO_CREDIT)

    with pytest.raises(reading.ReadFailed) as failed:
        reading.read(object(), b"jpeg", "text")

    assert [a["model"] for a in failed.value.attempts] == [reading.MODEL]


def test_a_reading_is_cut_off_when_the_time_is_up():
    stream = FakeStream(None, events=["ping", "ping", "ping"])
    client = SimpleNamespace(
        with_options=lambda **o: SimpleNamespace(
            messages=SimpleNamespace(stream=lambda **body: stream)
        )
    )
    times = iter([0, 10, 61])

    with pytest.raises(reading._Failed) as failed:
        reading._call(client, {}, 60, clock=lambda: next(times))

    assert failed.value.code == reading.TIMEOUT


# ── Reading in the background ───────────────────────────────────────────


def test_the_photo_post_answers_before_the_reading_ends(
    client, station, mca_candidates, provider
):
    provider(message())

    response = start(client, station)

    assert response.status_code == 202
    assert response.json()["status"] == "running"
    assert response.json()["prefill"] is None


def test_only_the_owner_can_ask_for_a_result(client, station, mca_candidates, provider):
    from rest_framework.test import APIClient

    provider(message())
    check_id = start(client, station).json()["check_id"]
    other = User.objects.create_user(phone_number="+254700000009", password="pw")
    stranger = APIClient()
    stranger.force_authenticate(user=other)

    assert stranger.get(result_url(check_id)).status_code == 404


def test_a_reading_lost_with_its_server_ends_as_timed_out(
    client, station, mca_candidates, provider, monkeypatch
):
    monkeypatch.setattr(machine_checks, "_queue", lambda check_id: None)
    check_id = start(client, station).json()["check_id"]
    MachineCheck.objects.filter(pk=check_id).update(
        created_at=timezone.now() - machine_checks.LOST_AFTER - timedelta(seconds=1)
    )

    data = client.get(result_url(check_id)).json()

    assert (data["status"], data["retake"]) == ("failed", False)
    assert MachineCheck.objects.get(pk=check_id).error == reading.TIMEOUT
