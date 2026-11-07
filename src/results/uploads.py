"""Results form uploads: one photo and one typed tally from one account."""

import io

from django.conf import settings
from django.core.cache import cache
from django.core.files.base import ContentFile
from django.db import IntegrityError, transaction

from PIL import Image, ImageOps, UnidentifiedImageError

from results.location import grade_location
from results.models import ResultUpload, UploadDeviceFix
from results.races import candidates_for, race_from, station_results_cache_key
from stations.models import PollingStation

# Roles limited to their registered ward until upload scope is built.
WARD_LIMITED_ROLES = {"voter", "party_agent"}

# A results form cannot be read below this, and a phone photo is far above it.
MIN_SHORT_SIDE_PX = 1000
# Well above a 48-megapixel phone photo; stops an image that decodes to
# gigabytes from a small file.
MAX_PIXELS = 60_000_000
# The most voters a polling stream can have. A station registered above it
# may count up to its register.
STREAM_VOTER_LIMIT = 700
# Long side of the preview. A full photo is 6 to 10 MB and loads slowly; the
# preview is a few hundred KB.
PREVIEW_LONG_SIDE_PX = 2048


class UploadRefused(Exception):
    """Nothing was stored. ``code`` names the reason, ``message`` explains it."""

    def __init__(self, code, message):
        super().__init__(message)
        self.code = code
        self.message = message


def submit_upload(
    account,
    *,
    station_code,
    race,
    votes,
    rejected_votes,
    disputed_votes,
    photo,
    quality_checked,
    key,
    fix=None,
    captured_at=None,
):
    """Store an upload, or raise UploadRefused and store nothing.

    ``fix`` is the device's position (a ``results.location.Fix``) or None.
    Returns ``(upload, created)``. A request repeating an earlier ``key``
    returns that upload with ``created`` False.
    """
    earlier = ResultUpload.objects.filter(key=key).first()
    if earlier is not None:
        return _replay(earlier, account)

    station = (
        PollingStation.objects.select_related(
            "polling_center__ward__constituency__county"
        )
        .filter(code=station_code)
        .first()
    )
    if station is None:
        raise UploadRefused("station_not_found", "Polling station not found.")
    _check_account(account, station)

    found = race_from(race)
    if found is None:
        raise UploadRefused("unknown_race", "Unknown race.")
    _check_not_uploaded(account, station, found.key)
    _check_photo(photo)
    _check_tally(votes, candidates_for(station, found))
    _check_total(votes, rejected_votes, disputed_votes, station)
    location = grade_location(fix, account, station)

    upload = ResultUpload(
        key=key,
        added_by=account,
        polling_station=station,
        race=found.key,
        votes={str(k): v for k, v in votes.items()},
        rejected_votes=rejected_votes,
        disputed_votes=disputed_votes,
        quality_checked=quality_checked,
        location_grade=location.grade,
        fix_accuracy_m=fix.accuracy_m if fix else None,
        distance_to_centre_m=location.distance_m,
        captured_at=captured_at,
    )
    preview = _preview(photo)
    # The files are written first; if the row is not, the files go too.
    upload.photo.save(photo.name, photo, save=False)
    try:
        if preview is not None:
            upload.preview.save("preview.jpg", preview, save=False)
        with transaction.atomic():
            upload.save(force_insert=True)
            if fix is not None:
                UploadDeviceFix.objects.create(upload=upload, point=fix.point)
    except Exception as error:
        upload.photo.delete(save=False)
        if upload.preview:
            upload.preview.delete(save=False)
        if isinstance(error, IntegrityError):
            # The same request arrived twice at once and the other one won.
            earlier = ResultUpload.objects.filter(key=key).first()
            if earlier is not None:
                return _replay(earlier, account)
            # Two different uploads for one station and race arrived at once.
            _check_not_uploaded(account, station, found.key)
        raise
    if location.countable:
        # The station's public results now say it is waiting for confirmation.
        cache.delete(station_results_cache_key(found.key, station.code))
    return upload, True


def _check_not_uploaded(account, station, race):
    """An upload cannot be replaced, so a second one is refused."""
    if ResultUpload.objects.filter(
        added_by=account, polling_station=station, race=race, is_current=True
    ).exists():
        raise UploadRefused(
            "already_uploaded",
            "You have already uploaded this form for this station.",
        )


def _replay(earlier, account):
    if earlier.added_by_id != account.pk:
        raise UploadRefused("key_used", "This upload identifier is already used.")
    return earlier, False


def _check_account(account, station):
    if not account.is_phone_verified:
        raise UploadRefused("not_allowed", "Verify your phone number to upload.")
    if account.role in WARD_LIMITED_ROLES:
        home = account.polling_center
        if home is None or home.ward_id != station.polling_center.ward_id:
            raise UploadRefused(
                "not_allowed", "You can upload only for stations in your ward."
            )


def _check_photo(photo):
    if photo.size > settings.RESULT_UPLOAD_MAX_PHOTO_BYTES:
        limit = settings.RESULT_UPLOAD_MAX_PHOTO_BYTES // (1024 * 1024)
        raise UploadRefused("photo_too_large", f"The photo is larger than {limit} MB.")
    try:
        with Image.open(photo) as image:
            if image.format != "JPEG":
                raise UploadRefused("not_jpeg", "The photo must be a JPEG.")
            width, height = image.size
            if min(width, height) < MIN_SHORT_SIDE_PX:
                raise UploadRefused("photo_pixels", "The photo is too small to read.")
            if width * height > MAX_PIXELS:
                raise UploadRefused("photo_pixels", "The photo has too many pixels.")
            # Decoding at an eighth of the size still reads every byte, so a
            # cut-off or corrupt file fails here, in about a tenth of a second.
            image.draft("RGB", (width // 8, height // 8))
            image.load()
    except (
        UnidentifiedImageError,
        Image.DecompressionBombError,
        OSError,
        SyntaxError,
        ValueError,
    ):
        raise UploadRefused("not_jpeg", "The photo must be a whole JPEG.")
    finally:
        photo.seek(0)


def _preview(photo):
    """A smaller copy of the photo, or None when it is already small.

    A photo already small, often from a low-end phone, is never compressed a
    second time.
    """
    try:
        with Image.open(photo) as image:
            if max(image.size) <= PREVIEW_LONG_SIDE_PX:
                return None
            image.thumbnail((PREVIEW_LONG_SIDE_PX, PREVIEW_LONG_SIDE_PX))
            # The copy carries no EXIF, so turn it the way the phone held it.
            copy = ImageOps.exif_transpose(image).convert("RGB")
    finally:
        photo.seek(0)
    buffer = io.BytesIO()
    copy.save(buffer, "JPEG", quality=85)
    return ContentFile(buffer.getvalue())


def _check_total(votes, rejected_votes, disputed_votes, station):
    limit = max(STREAM_VOTER_LIMIT, station.registered_voters or 0)
    if sum(votes.values()) + rejected_votes + disputed_votes > limit:
        raise UploadRefused(
            "too_many_votes",
            f"The counts add up to more than {limit}, the most voters this "
            "station can have.",
        )


def _check_tally(votes, candidates):
    expected = {str(pk) for pk in candidates.values_list("pk", flat=True)}
    given = {str(k) for k in votes}
    if given - expected:
        raise UploadRefused("invalid_tally", "The tally names an unknown candidate.")
    if expected - given:
        raise UploadRefused("invalid_tally", "The tally is missing a candidate.")
    for count in votes.values():
        if isinstance(count, bool) or not isinstance(count, int) or count < 0:
            raise UploadRefused(
                "invalid_tally", "Every count must be a whole number of 0 or more."
            )
