"""Run a machine reading of a photo before entry and keep its record."""

import hashlib
import logging
import time

from django.conf import settings
from django.core.files.base import ContentFile
from django.utils import timezone

import anthropic

from results import qr, reading
from results.models import Aspirant, MachineCheck
from results.qr import FORM_SERIES
from results.races import candidates_for

logger = logging.getLogger(__name__)

RACE_LABELS = dict(Aspirant.LEVEL_CHOICES)
# A QR code read as another station's or race's ends the check before the
# model is called.
QR_OUTCOMES = {
    qr.OTHER_STREAM: reading.OTHER_STATION,
    qr.OTHER_CENTRE: reading.OTHER_STATION,
    qr.OTHER_FORM: reading.OTHER_FORM,
}


def run_check(account, station, race, photo, client=None, clock=time.monotonic):
    """Read the photo for this station and race, and store the check record.

    A reading that cannot be made is recorded as failed and never raises:
    the person then types the counts without a prefill.
    """
    series = FORM_SERIES[race.key]
    candidates = _ballot(station, race)
    copy, width, height = reading.model_copy(photo)
    check = MachineCheck(account=account, polling_station=station, race=race.key)
    check.server_qr_value, check.server_qr_result = _check_qr(photo, station, race)
    check.photo.save("photo.jpg", photo, save=False)
    check.model_copy.save("model.jpg", ContentFile(copy), save=False)
    check.input = {
        "check": "read",
        "version": reading.VERSION,
        "model": reading.MODEL,
        "fallback_model": reading.FALLBACK_MODEL,
        "effort": reading.EFFORT,
        "photograph": {
            "key": check.model_copy.name,
            "sha256": hashlib.sha256(copy).hexdigest(),
            "width": width,
            "height": height,
            "bytes": len(copy),
        },
        "form_number": f"{series}A",
        "race": race.key,
        "candidates": candidates,
        "reference": None,
    }
    check.save(force_insert=True)

    started = clock()
    wrong = QR_OUTCOMES.get(check.server_qr_result)
    if wrong:
        # The QR code names another station or race: retake, no model call.
        check.outcome = wrong
        _finish(check, started, clock)
        return check
    if not settings.ANTHROPIC_API_KEY:
        _finish(check, started, clock, error=reading.SWITCHED_OFF)
        return check
    text = reading.user_text(
        check.input["form_number"], RACE_LABELS[race.key], candidates
    )
    try:
        result = reading.read(client or _client(), copy, text, clock=clock)
    except reading.ReadFailed as failed:
        _finish(check, started, clock, error=failed.code, attempts=failed.attempts)
        return check
    check.reply = result.reply
    check.model = result.model
    check.provider_request_id = result.request_id
    check.usage = result.usage
    check.outcome = reading.outcome(
        result.reply,
        station.code,
        series,
        [c["ballot_number"] for c in candidates],
        qr_matched=check.server_qr_result == qr.MATCH,
    )
    if check.outcome in (reading.NOT_A_RESULTS_FORM, reading.PHOTO_BLOCKED):
        # It may be vulgar or illegal: deleted at once, only the record and
        # the reason are kept.
        check.photo.delete(save=False)
        check.model_copy.delete(save=False)
        check.reply = {"screening": result.reply["screening"]}
    _finish(check, started, clock, attempts=result.attempts)
    return check


def for_phone(check):
    """What the phone receives: never the reply, only figures read one way."""
    done = check.status == MachineCheck.DONE
    retake = done and check.outcome in reading.RETAKE
    prefill = None
    if done and not retake:
        by_ballot = {
            c["ballot_number"]: c["aspirant_id"] for c in check.input["candidates"]
        }
        figures = reading.prefill(check.reply, list(by_ballot))
        prefill = {
            "votes": {
                str(by_ballot[n]): value for n, value in figures["votes"].items()
            },
            "rejected_votes": figures["rejected"],
            "disputed_votes": figures["disputed"],
        }
    return {
        "check_id": str(check.id),
        "status": check.status,
        "outcome": check.outcome or None,
        "message": reading.MESSAGES.get(check.outcome),
        "retake": retake,
        "prefill": prefill,
    }


def _ballot(station, race):
    """The race's candidates at this station, numbered in a fixed order.

    The model matches rows by the printed name; the number only links its
    answer back to the aspirant.
    """
    aspirants = (
        candidates_for(station, race)
        .select_related("party")
        .order_by("surname", "last_name", "first_name", "id")
    )
    return [
        {
            "ballot_number": number,
            "aspirant_id": aspirant.id,
            "name": " ".join(
                part
                for part in (aspirant.first_name, aspirant.last_name, aspirant.surname)
                if part
            ),
            "party": aspirant.party.name if aspirant.party else "Independent",
        }
        for number, aspirant in enumerate(aspirants, start=1)
    ]


def _check_qr(photo, station, race):
    """The form code and how it compares, as at upload. Never raises."""
    try:
        value = qr.read_qr(photo)
        return value or "", qr.classify(value, station, race.key)
    except Exception:
        logger.exception("QR check failed for station %s", station.code)
        return "", qr.NOT_CHECKED


def _finish(check, started, clock, error="", attempts=None):
    check.status = MachineCheck.FAILED if error else MachineCheck.DONE
    check.error = error
    check.attempts = attempts or []
    check.duration_ms = round((clock() - started) * 1000)
    check.finished_at = timezone.now()
    check.save()


def _client():
    return anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
