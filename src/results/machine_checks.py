"""Run machine checks of a photo before entry and keep their records.

A first photo gets a reading. A photo taken to agree with an earlier upload
gets a reading and, at the same time, a comparison with that upload's
photo.
"""

import hashlib
import logging
import time
from datetime import timedelta

from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction
from django.urls import reverse
from django.utils import timezone

import anthropic

from results import comparing, qr, reading
from results.models import Aspirant, MachineCheck, ResultUpload
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


# A check still running this long after it started was lost, for example
# when the server restarted during the reading.
LOST_AFTER = timedelta(seconds=reading.DEADLINE_S + 30)


# What the phone shows for each outcome of agreeing.
AGREES = "agrees"
FIGURES_DIFFER = "figures_differ"
NOT_CHECKED = "not_checked"
AGREEMENT_MESSAGES = {
    AGREES: "Your photo matches the uploaded form.",
    FIGURES_DIFFER: "Some figures on your photo differ from the uploaded form.",
    NOT_CHECKED: "Your photo could not be checked.",
}
CHECKED_BY_A_PERSON = "A person will also check the photo."

# The lines the phone shows while an agreeing photo is checked, in order.
# Each is running, passed or failed; the QR code can also be not read,
# which does not stop an agreement.
CHECK_RUNNING = "running"
CHECK_PASSED = "passed"
CHECK_FAILED = "failed"
CHECK_NOT_READ = "not_read"
CHECK_LABELS = [
    ("qr", "QR code matches this stream"),
    ("photo", "Photo is of the paper form and clear"),
    ("same_form", "Same form as the first upload"),
    ("votes", "Every candidate's votes match"),
    ("counts", "Rejected and disputed votes match"),
    ("total", "Total valid votes match, no figure written over"),
]
UNCLEAR_PHOTO = {
    reading.PHOTO_OF_SCREEN,
    reading.PHOTO_POOR,
    reading.PHOTO_UNREADABLE,
    reading.CONTENT_FLAGGED,
}
SAME_FORM = {
    comparing.SAME_FORM,
    comparing.SAME_FORM_WITH_ADDITIONS,
    comparing.DIFFERENT_COPY,
}


def start_check(account, station, race, photo, reference=None):
    """Store the check and read the photo in the background. With a
    ``reference`` upload, the person agrees with it and the photo is also
    compared with its photo. Without one, a photo for a station that already
    has another person's upload is compared with the earliest of them, to
    find a form changed since that photo was taken.

    Returns the reading at once; the phone asks for the result with
    ``for_phone``.
    """
    check = _store(account, station, race, photo, reference)
    if check.status == MachineCheck.RUNNING:
        check_id = check.id
        transaction.on_commit(lambda: _queue(check_id))
        earlier = reference
        if earlier is None:
            earlier = next(iter(_earlier_typed(station, race.key, account)), None)
        if earlier is not None:
            comparison_id = _store_comparison(check, earlier).id
            transaction.on_commit(lambda: _queue_comparison(comparison_id))
    return check


def compare_with(read_check, reference):
    """Compare a photo already read with an earlier upload, for a person who
    agrees once the reading shows the same results."""
    read_check.reference = reference
    read_check.save(update_fields=["reference"])
    if read_check.comparisons.filter(reference=reference).exists():
        # Compared with this upload when the photo was read.
        return
    comparison_id = _store_comparison(read_check, reference).id
    transaction.on_commit(lambda: _queue_comparison(comparison_id))


def _queue(check_id):
    from results.tasks import read_check

    read_check.delay(str(check_id))


def _queue_comparison(check_id):
    from results.tasks import compare_check

    compare_check.delay(str(check_id))


def read_stored(check_id):
    check = MachineCheck.objects.select_related("polling_station").get(pk=check_id)
    _read(check)


def compare_stored(check_id):
    _compare(MachineCheck.objects.select_related("read_check").get(pk=check_id))


def _store(account, station, race, photo, reference=None, clock=time.monotonic):
    """Save the photo, its model copy and the input. Ends the check at once
    when the QR code names another station or race, or reading is off."""
    series = FORM_SERIES[race.key]
    candidates = _ballot(station, race)
    copy, width, height = reading.model_copy(photo)
    check = MachineCheck(
        account=account, polling_station=station, race=race.key, reference=reference
    )
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
        "reference": str(reference.id) if reference else None,
    }
    check.save(force_insert=True)

    started = clock()
    wrong = QR_OUTCOMES.get(check.server_qr_result)
    if wrong:
        # The QR code names another station or race: retake, no model call.
        check.outcome = wrong
        _finish(check, started, clock)
    elif not settings.ANTHROPIC_API_KEY:
        _finish(check, started, clock, error=reading.SWITCHED_OFF)
    return check


def _read(check, client=None, clock=time.monotonic):
    """Ask the model, then record the outcome.

    A reading that cannot be made is recorded as failed and never raises:
    the person then types the counts without a prefill.
    """
    started = clock()
    candidates = check.input["candidates"]
    text = reading.user_text(
        check.input["form_number"], RACE_LABELS[check.race], candidates
    )
    with check.model_copy.open("rb") as stored:
        copy = stored.read()
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
        check.polling_station.code,
        check.input["form_number"][:2],
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


def _store_comparison(reading_check, reference):
    """The comparison of a new photo with the earlier upload's photo. It
    keeps a model copy of the earlier photo; the new photo's copy is the
    reading's."""
    with reference.photo.open("rb") as stored:
        copy, width, height = reading.model_copy(stored)
    check = MachineCheck(
        kind=MachineCheck.COMPARE,
        account=reading_check.account,
        polling_station=reading_check.polling_station,
        race=reading_check.race,
        reference=reference,
        read_check=reading_check,
    )
    check.model_copy.save("model.jpg", ContentFile(copy), save=False)
    check.input = {
        "check": "compare",
        "version": comparing.VERSION,
        "model": reading.MODEL,
        "fallback_model": reading.FALLBACK_MODEL,
        "effort": reading.EFFORT,
        "photographs": {
            "a": {
                "key": check.model_copy.name,
                "sha256": hashlib.sha256(copy).hexdigest(),
                "width": width,
                "height": height,
                "bytes": len(copy),
            },
            "b": reading_check.input["photograph"],
        },
        "reference": str(reference.id),
    }
    check.save(force_insert=True)
    return check


def _compare(check, client=None, clock=time.monotonic):
    """Ask the model to compare the two photos, then record the outcome.

    Never raises: a comparison that cannot be made is recorded as failed.
    """
    started = clock()
    new_copy = check.read_check.model_copy
    if not new_copy:
        # The reading found the new photo was not a results form and
        # deleted it; there is nothing to compare.
        _finish(check, started, clock, error=reading.PHOTO_DELETED)
        return check
    with check.model_copy.open("rb") as stored:
        earlier = stored.read()
    with new_copy.open("rb") as stored:
        later = stored.read()
    try:
        result = comparing.compare(client or _client(), earlier, later, clock=clock)
    except reading.ReadFailed as failed:
        _finish(check, started, clock, error=failed.code, attempts=failed.attempts)
        return check
    check.reply = result.reply
    check.model = result.model
    check.provider_request_id = result.request_id
    check.usage = result.usage
    check.outcome = comparing.outcome(result.reply)
    _finish(check, started, clock, attempts=result.attempts)
    return check


def for_phone(check):
    """What the phone receives: never the reply, only figures read one way.

    For an agreement, the status stays running until both the reading and
    the comparison end; the outcome is then whether the photo agrees.
    """
    _end_if_lost(check)
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
    answer = {
        "check_id": str(check.id),
        "status": check.status,
        "outcome": check.outcome or None,
        "message": reading.MESSAGES.get(check.outcome),
        "retake": retake,
        "prefill": prefill,
        "agreement": False,
    }
    comparison = comparison_of(check)
    if check.reference_id is None:
        if done and not retake:
            if comparison is not None and comparison.status == MachineCheck.RUNNING:
                # The upload must know whether the form was changed.
                answer.update(
                    status=MachineCheck.RUNNING,
                    outcome=None,
                    message=None,
                    prefill=None,
                )
                return answer
            changed = (
                comparison is not None and comparison.outcome == comparing.FORM_CHANGED
            )
            # The person is shown where the figures look written over since
            # the earlier photo, and may continue or cancel.
            answer["form_changed"] = changed
            if changed:
                message = answer["message"] or ""
                if CHECKED_BY_A_PERSON not in message:
                    answer["message"] = f"{message} {CHECKED_BY_A_PERSON}".strip()
                if comparing.points(comparison.reply):
                    answer["marked_photo"] = reverse(
                        "result-photo-marked", args=[check.id]
                    )
            answer["same_as"] = _same_as(check)
        return answer
    answer["agreement"] = True
    answer["checks"] = agreement_checks(check, comparison)
    if retake:
        return answer
    if MachineCheck.RUNNING in (check.status, comparison.status):
        answer.update(status=MachineCheck.RUNNING, outcome=None, message=None)
        return answer
    code = agreement(check, comparison)
    answer.update(
        status=MachineCheck.DONE, outcome=code, message=AGREEMENT_MESSAGES[code]
    )
    if comparison.status == MachineCheck.DONE and comparing.points(comparison.reply):
        # The person's photo with an arrow at each difference; opens with
        # their token.
        answer["marked_photo"] = reverse("result-photo-marked", args=[check.id])
    return answer


def agreement(read_check, comparison):
    """Whether the new photo agrees with the earlier upload: the first check
    below that fits. A retake is decided before this."""
    if MachineCheck.FAILED in (read_check.status, comparison.status):
        return NOT_CHECKED
    if comparison.outcome == comparing.FORM_CHANGED:
        return FIGURES_DIFFER
    if _differs_from(read_check, comparison.reference):
        return FIGURES_DIFFER
    if read_check.outcome == reading.ALTERATION_REPORTED:
        return FIGURES_DIFFER
    if (
        read_check.outcome != reading.READ_COMPLETE
        or comparison.outcome == comparing.COMPARE_INCONCLUSIVE
        or _read_figures(read_check)["total"] is None
    ):
        return NOT_CHECKED
    return AGREES


def comparison_of(check):
    """The comparison of a reading's photo: with the upload the person
    agrees with, or else the one made when the photo was read. None when
    there was no earlier upload."""
    comparisons = check.comparisons.order_by("created_at")
    if check.reference_id is not None:
        comparisons = comparisons.filter(reference_id=check.reference_id)
    comparison = comparisons.first()
    if comparison is not None:
        _end_if_lost(comparison)
    return comparison


def _earlier_typed(station, race, account):
    """Other people's countable current uploads with a typed tally, oldest
    first."""
    earlier = (
        ResultUpload.objects.filter(
            polling_station=station,
            race=race,
            is_current=True,
            agrees_with__isnull=True,
        )
        .exclude(added_by=account)
        .order_by("created_at")
    )
    return [upload for upload in earlier if upload.countable]


def _same_as(read_check):
    """The earlier upload by someone else whose typed results the photo
    shows exactly, or None. Only when every figure was read one way."""
    if read_check.outcome != reading.READ_COMPLETE:
        return None
    read = _read_figures(read_check)
    if None in read.values():
        return None
    for upload in _earlier_typed(
        read_check.polling_station, read_check.race, read_check.account
    ):
        if _typed_figures(upload) == read:
            return str(upload.id)
    return None


def _differs_from(read_check, reference):
    """Whether a figure read one way differs from the earlier upload's."""
    typed = _typed_figures(reference)
    return any(
        value is not None and value != typed.get(key)
        for key, value in _read_figures(read_check).items()
    )


def _read_figures(read_check):
    """Each figure read one way from the photo, None where it was not:
    votes by aspirant id, then rejected, disputed and the valid total."""
    by_ballot = {
        c["ballot_number"]: c["aspirant_id"] for c in read_check.input["candidates"]
    }
    figures = reading.prefill(read_check.reply, list(by_ballot))
    read = {str(by_ballot[n]): value for n, value in figures["votes"].items()}
    read["rejected"] = figures["rejected"]
    read["disputed"] = figures["disputed"]
    total = read_check.reply["totals"]["valid_votes_in_counts"]
    read["total"] = total["value"] if reading.readable(total) else None
    return read


def _typed_figures(reference):
    return {
        **{str(k): v for k, v in reference.votes.items()},
        "rejected": reference.rejected_votes,
        "disputed": reference.disputed_votes,
        "total": sum(reference.votes.values()),
    }


def agreement_checks(read_check, comparison):
    """The six lines shown while the photo is checked against the earlier
    upload. A line that failed on a figure names it, with the number read
    from the person's own photo; the earlier upload's typed figures are
    never shown."""
    states = {}
    details = {code: [] for code, _ in CHECK_LABELS}

    if read_check.server_qr_result == qr.MATCH:
        states["qr"] = CHECK_PASSED
    elif read_check.server_qr_result in (qr.UNREAD, qr.NOT_CHECKED):
        states["qr"] = CHECK_NOT_READ
    else:
        states["qr"] = CHECK_FAILED

    if comparison.status == MachineCheck.RUNNING:
        states["same_form"] = CHECK_RUNNING
    elif comparison.status == MachineCheck.DONE and comparison.outcome in SAME_FORM:
        states["same_form"] = CHECK_PASSED
    else:
        states["same_form"] = CHECK_FAILED

    from_reading = ("photo", "votes", "counts", "total")
    reference = comparison.reference
    if read_check.status == MachineCheck.RUNNING:
        states.update({code: CHECK_RUNNING for code in from_reading})
    elif (
        read_check.status != MachineCheck.DONE
        or not read_check.reply
        or reference is None
        # Not a usable form photo: there are no figures to compare.
        or read_check.outcome in reading.RETAKE
    ):
        states.update({code: CHECK_FAILED for code in from_reading})
    else:
        unclear = read_check.outcome in UNCLEAR_PHOTO
        states["photo"] = CHECK_FAILED if unclear else CHECK_PASSED
        read = _read_figures(read_check)
        typed = _typed_figures(reference)
        names = {
            str(c["aspirant_id"]): c["name"].title()
            for c in read_check.input["candidates"]
        }
        lines = [("votes", key, name) for key, name in names.items()] + [
            ("counts", "rejected", "Rejected"),
            ("counts", "disputed", "Disputed"),
            ("total", "total", "Total"),
        ]
        for code, key, name in lines:
            if read[key] is None:
                details[code].append(f"{name}: could not be read")
            elif read[key] != typed.get(key):
                details[code].append(f"{name}: your photo shows {read[key]}")
        if any(
            a["field"] in reading.TALLY_FIELDS
            for a in read_check.reply.get("alterations", [])
        ):
            details["total"].append("A figure is written over")
        for code in ("votes", "counts", "total"):
            states[code] = CHECK_FAILED if details[code] else CHECK_PASSED

    return [
        {"code": code, "label": label, "state": states[code], "details": details[code]}
        for code, label in CHECK_LABELS
    ]


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
            "name": aspirant.full_name,
            "party": aspirant.party.name if aspirant.party else "Independent",
        }
        for number, aspirant in enumerate(aspirants, start=1)
    ]


def _end_if_lost(check):
    """A reading lost with its server ends as timed out, so the phone stops
    waiting and the person types the counts."""
    if (
        check.status == MachineCheck.RUNNING
        and timezone.now() - check.created_at > LOST_AFTER
    ):
        check.status = MachineCheck.FAILED
        check.error = reading.TIMEOUT
        check.finished_at = timezone.now()
        check.save(update_fields=["status", "error", "finished_at"])


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
