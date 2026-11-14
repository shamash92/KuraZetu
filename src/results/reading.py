"""The machine reading of a results form photo.

Sonnet reads the photo. Opus reads the same input only when Sonnet's
attempt fails, is refused, or does not fit the reply format. The model
reports what it sees; the decisions here are fixed rules in code.
"""

import base64
import io
import json
import math
import re
import time
from dataclasses import dataclass
from pathlib import Path

from django.conf import settings

import anthropic
from PIL import Image, ImageOps

VERSION = "read-v1"
MODEL = "claude-sonnet-5-5"
FALLBACK_MODEL = "claude-opus-5-5"
EFFORT = "medium"
MAX_TOKENS = 16000

_FILES = Path(__file__).parent / "readings"
SYSTEM = (_FILES / f"{VERSION}.txt").read_text()
REPLY_FORMAT = json.loads((_FILES / f"{VERSION}.schema.json").read_text())

# The largest image the model reads at full detail: 2576 px on the long
# side and 4784 patches of 28 px. A larger image is shrunk by the provider.
MAX_LONG_SIDE_PX = 2576
MAX_PATCHES = 4784
PATCH_PX = 28

# The person waits for the prefill this long at most.
DEADLINE_S = 60
# Too little time left for a second model to finish.
MIN_FALLBACK_S = 3

# Why a reading did not finish.
PROVIDER_UNAVAILABLE = "provider_unavailable"
RATE_LIMITED = "rate_limited"
TIMEOUT = "timeout"
REPLY_INVALID = "reply_invalid"
REPLY_TRUNCATED = "reply_truncated"
MODEL_REFUSED = "model_refused"
REQUEST_REJECTED = "request_rejected"
AUTH_FAILED = "auth_failed"
NO_CREDIT = "no_credit"
SWITCHED_OFF = "switched_off"
# A comparison whose new photo was deleted as not a results form.
PHOTO_DELETED = "photo_deleted"

# What each error code means, for the admin.
ERROR_REASONS = {
    PROVIDER_UNAVAILABLE: "Anthropic was down or could not be reached.",
    RATE_LIMITED: "Too many readings at once for the account's limit.",
    TIMEOUT: "The reading took longer than the person can wait.",
    REPLY_INVALID: "The model's reply did not fit the reply format.",
    REPLY_TRUNCATED: "The model's reply was cut off before it ended.",
    MODEL_REFUSED: "The model refused to read the photo.",
    REQUEST_REJECTED: "Anthropic rejected the request: a fault in our code.",
    AUTH_FAILED: "The API key is wrong, revoked, or not allowed.",
    NO_CREDIT: "The Anthropic account is out of credit.",
    SWITCHED_OFF: "No API key is set, so reading is switched off.",
    PHOTO_DELETED: "The new photo was not a results form and was deleted.",
}

# What a finished reading found. The reading comes before typing, so a
# complete reading is read_complete: there is no typed tally to compare.
READ_COMPLETE = "read_complete"
READ_INCOMPLETE = "read_incomplete"
PHOTO_POOR = "photo_poor"
PHOTO_UNREADABLE = "photo_unreadable"
ALTERATION_REPORTED = "alteration_reported"
PHOTO_OF_SCREEN = "photo_of_screen"
NOT_A_RESULTS_FORM = "not_a_results_form"
# Vulgar, sexual, violent, threatening, inciting or political material that is
# not a form: blocked, not just retaken.
PHOTO_BLOCKED = "photo_blocked"
# A results form with vulgar, threatening or political writing added: read,
# and a person checks the photo.
CONTENT_FLAGGED = "content_flagged"
OTHER_STATION = "other_station"
OTHER_FORM = "other_form"
OTHER_CANDIDATES = "other_candidates"

# What the phone tells the person for each outcome.
MESSAGES = {
    READ_COMPLETE: (
        "The values below were extracted by our system and may be inaccurate. "
        "Check and edit where necessary."
    ),
    READ_INCOMPLETE: (
        "The values below were extracted by our system and may be inaccurate. "
        "Fill in the empty boxes, then check and edit the rest where necessary."
    ),
    PHOTO_POOR: "The photo is not sharp enough to read every figure. Retake it.",
    PHOTO_UNREADABLE: "The figures cannot be read in this photo. Retake it.",
    ALTERATION_REPORTED: (
        "The values below were extracted by our system and may be inaccurate. "
        "Check and edit where necessary. A person will also check the photo."
    ),
    PHOTO_OF_SCREEN: (
        "The values below were extracted by our system and may be inaccurate. "
        "Check and edit where necessary. A person will also check the photo."
    ),
    NOT_A_RESULTS_FORM: "This photo is not a results form. Retake it.",
    PHOTO_BLOCKED: (
        "We have blocked this photo. It is vulgar, violent, threatening or "
        "political material. Only photos of results forms are accepted."
    ),
    CONTENT_FLAGGED: (
        "The values below were extracted by our system and may be inaccurate. "
        "Fill in any empty boxes, and check and edit where necessary. A person "
        "will also check the photo."
    ),
    OTHER_STATION: "This form is for another polling station.",
    OTHER_FORM: "This form is for another race.",
    OTHER_CANDIDATES: "This form does not list the candidates for this race.",
}
# Outcomes that send the person back to the camera, with nothing to prefill.
RETAKE = {
    PHOTO_POOR,
    PHOTO_UNREADABLE,
    NOT_A_RESULTS_FORM,
    PHOTO_BLOCKED,
    OTHER_STATION,
    OTHER_FORM,
    OTHER_CANDIDATES,
}
# Reasons from the screening that block the photo.
BLOCKED_REASONS = {
    "sexual",
    "violent_or_gory",
    "hateful_or_vulgar",
    "threat_or_incitement",
    "political_material",
}

# The fields of a reply that hold the tally.
TALLY_FIELDS = {
    "candidate_votes",
    "valid_votes_under_table",
    "valid_votes_in_counts",
    "rejected",
    "disputed",
}


class ReadFailed(Exception):
    """A reading did not finish. ``code`` names why."""

    def __init__(self, code, attempts):
        super().__init__(code)
        self.code = code
        self.attempts = attempts


@dataclass
class Reading:
    reply: dict
    model: str
    attempts: list
    request_id: str
    usage: dict


def model_copy(photo):
    """The photo as the model reads it: upright, no metadata, full detail.

    Returns JPEG bytes, width and height.
    """
    with Image.open(photo) as image:
        upright = ImageOps.exif_transpose(image).convert("RGB")
    photo.seek(0)
    width, height = upright.size
    scale = min(
        1.0,
        MAX_LONG_SIDE_PX / max(width, height),
        math.sqrt(MAX_PATCHES * PATCH_PX * PATCH_PX / (width * height)),
    )
    size = (int(width * scale), int(height * scale))
    while math.ceil(size[0] / PATCH_PX) * math.ceil(size[1] / PATCH_PX) > MAX_PATCHES:
        size = (size[0] - PATCH_PX, size[1] - round(PATCH_PX * size[1] / size[0]))
    quality = 90
    if settings.DEBUG:
        # About a quarter of the bytes, so a slow home connection can send
        # two photos to the model within the time limit. Never in production.
        size = (size[0] // 2, size[1] // 2)
        quality = 80
    if size != upright.size:
        upright = upright.resize(size, Image.LANCZOS)
    buffer = io.BytesIO()
    upright.save(buffer, "JPEG", quality=quality)
    return buffer.getvalue(), size[0], size[1]


def user_text(form_number, race_label, candidates):
    listing = json.dumps(
        [
            {
                "ballot_number": c["ballot_number"],
                "name": c["name"],
                "party": c["party"],
            }
            for c in candidates
        ],
        ensure_ascii=False,
    )
    return (
        f"Form: {form_number} ({race_label} election).\n"
        f"Candidates on the ballot, in order:\n{listing}\n"
        "Read the photograph and fill in the reply."
    )


def request(model, image_bytes, text):
    """The request for one attempt. The same input gives the same request."""
    return body(
        model,
        SYSTEM,
        REPLY_FORMAT,
        [image(image_bytes), {"type": "text", "text": text}],
    )


def body(model, system, reply_format, content):
    """One request: fixed instructions and reply format, then the content."""
    return {
        "model": model,
        "max_tokens": MAX_TOKENS,
        "output_config": {
            "effort": EFFORT,
            "format": {"type": "json_schema", "schema": reply_format},
        },
        # Fixed text, cached by the provider between calls.
        "system": [
            {"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}
        ],
        "messages": [{"role": "user", "content": content}],
    }


def image(image_bytes):
    return {
        "type": "image",
        "source": {
            "type": "base64",
            "media_type": "image/jpeg",
            "data": base64.standard_b64encode(image_bytes).decode(),
        },
    }


def read(client, image_bytes, text, clock=time.monotonic):
    """Read the photo: Sonnet first, Opus only when Sonnet's attempt fails.

    Raises ReadFailed with the last error code when neither finishes.
    """
    return ask(
        client,
        lambda model: request(model, image_bytes, text),
        REPLY_FORMAT,
        clock,
    )


def ask(client, request_for, reply_format, clock=time.monotonic):
    """Make one request: Sonnet first, Opus only when Sonnet's attempt fails.

    ``request_for(model)`` builds the request. Raises ReadFailed with the
    last error code when neither finishes.
    """
    started = clock()
    attempts = []
    for model in (MODEL, FALLBACK_MODEL):
        left = DEADLINE_S - (clock() - started)
        if attempts and left < MIN_FALLBACK_S:
            break
        try:
            message, request_id = _call(client, request_for(model), left, clock)
            reply = _parse(message, reply_format)
        except _Failed as failed:
            attempts.append(
                {
                    "model": model,
                    "error": failed.code,
                    "status": failed.status,
                    "detail": failed.detail,
                }
            )
            if failed.code in (AUTH_FAILED, NO_CREDIT):
                # Opus would be refused the same way.
                break
            continue
        attempts.append({"model": model, "error": None})
        return Reading(
            reply=reply,
            model=message.model,
            attempts=attempts,
            request_id=request_id or "",
            usage={
                "input_tokens": message.usage.input_tokens,
                "output_tokens": message.usage.output_tokens,
            },
        )
    raise ReadFailed(attempts[-1]["error"], attempts)


class _Failed(Exception):
    def __init__(self, code, status=None, detail=""):
        super().__init__(code)
        self.code = code
        self.status = status
        self.detail = detail


def _call(client, body, timeout, clock=time.monotonic):
    """One call, with the provider's errors named by their error code.

    The reply is streamed so the call can be cut off once the time is up:
    the client's own timeout only limits each wait between data, not the
    whole call. No retries: the person is waiting.
    """
    deadline = clock() + timeout
    try:
        client = client.with_options(timeout=timeout, max_retries=0)
        with client.messages.stream(**body) as stream:
            for _ in stream:
                if clock() > deadline:
                    # Leaving the block closes the connection.
                    raise _Failed(TIMEOUT)
            return stream.get_final_message(), stream.request_id
    except anthropic.APITimeoutError:
        raise _Failed(TIMEOUT)
    except anthropic.APIStatusError as error:
        raise _Failed(_status_code(error), error.status_code, _message(error))
    except anthropic.APIConnectionError as error:
        raise _Failed(PROVIDER_UNAVAILABLE, detail=str(error))


def _status_code(error):
    if error.status_code == 402:
        return NO_CREDIT
    if error.status_code in (401, 403):
        return AUTH_FAILED
    if error.status_code == 429:
        return RATE_LIMITED
    if error.status_code >= 500:
        return PROVIDER_UNAVAILABLE
    return REQUEST_REJECTED


def _message(error):
    """The provider's own words, kept to explain a failure."""
    body = error.body if isinstance(error.body, dict) else {}
    return str(body.get("error", {}).get("message") or error.message)[:500]


def _parse(message, reply_format=REPLY_FORMAT):
    """The reply of a finished call, or _Failed with its error code."""
    if message.stop_reason == "refusal":
        raise _Failed(MODEL_REFUSED)
    if message.stop_reason == "max_tokens":
        raise _Failed(REPLY_TRUNCATED)
    text = next((b.text for b in message.content if b.type == "text"), None)
    try:
        reply = json.loads(text or "")
    except ValueError:
        raise _Failed(REPLY_INVALID)
    if not isinstance(reply, dict) or set(reply) != set(reply_format["required"]):
        raise _Failed(REPLY_INVALID)
    return reply


def outcome(reply, station_code, series, ballot_numbers, qr_matched=False):
    """The outcome code: the first check below that fits.

    The reading comes before typing, so a complete reading is read_complete.
    When the form's QR code matched, it decides the station and race, not the
    small print.
    """
    # First: a photo that is not a results form ends the check.
    screening = reply["screening"]
    if not screening["is_results_form"]:
        if screening["reason"] in BLOCKED_REASONS:
            return PHOTO_BLOCKED
        return NOT_A_RESULTS_FORM
    capture = reply["capture"]
    identity = reply["identity"]
    if not qr_matched:
        printed = identity["station_code"]
        digits = re.sub(r"\D", "", printed["as_printed"])
        # Only a whole station code, read one way, can name another station.
        if (
            printed["legibility"] == "clear"
            and len(digits) == 15
            and digits != station_code
        ):
            return OTHER_STATION
        form = identity["form_number"]
        form_series = re.search(r"3[4-9]", form["as_printed"])
        if form["legibility"] == "clear" and form_series and form_series[0] != series:
            return OTHER_FORM
    # Skipped while DEBUG is on, so a form shown on a laptop screen can be
    # photographed to test uploads locally. DEBUG is never on in production.
    if not settings.DEBUG and (
        capture["photo_of_screen"] == "present"
        or capture["sheet_kind"] == "not_printed_form"
    ):
        return PHOTO_OF_SCREEN
    if capture["readability"] == "unreadable":
        return PHOTO_UNREADABLE
    if capture["readability"] == "poor":
        return PHOTO_POOR
    # The candidates come from our list for the race, never from another
    # upload: a form that leaves one out, or prints another, is not this
    # race's form.
    if reply["extra_rows"] or any(
        not c["name_as_printed"].strip() for c in reply["candidates"]
    ):
        return OTHER_CANDIDATES
    if screening["flagged"]:
        return CONTENT_FLAGGED
    figures = _tally_figures(reply)
    if set(ballot_numbers) - set(figures["votes"]) or not all(
        readable(f) for f in _all(figures)
    ):
        return READ_INCOMPLETE
    if any(a["field"] in TALLY_FIELDS for a in reply["alterations"]):
        return ALTERATION_REPORTED
    return READ_COMPLETE


def prefill(reply, ballot_numbers):
    """The figures that fill the form: only those read one way.

    Keyed by ballot number; None leaves the box empty for the person.
    """
    figures = _tally_figures(reply)

    def value(figure):
        return figure["value"] if figure and readable(figure) else None

    return {
        "votes": {n: value(figures["votes"].get(n)) for n in ballot_numbers},
        "rejected": value(figures["rejected"]),
        "disputed": value(figures["disputed"]),
    }


def _tally_figures(reply):
    return {
        "votes": {c["ballot_number"]: c["votes"] for c in reply["candidates"]},
        "rejected": reply["totals"]["rejected"],
        "disputed": reply["totals"]["disputed"],
    }


def _all(figures):
    return [*figures["votes"].values(), figures["rejected"], figures["disputed"]]


def readable(figure):
    return (
        figure["legibility"] == "clear"
        and not figure["blank"]
        and isinstance(figure["value"], int)
    )
