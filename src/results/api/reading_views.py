import hashlib

from django.shortcuts import get_object_or_404

from rest_framework import serializers, status
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import NATIVE_AUTHENTICATION
from results.api.upload_views import REFUSAL_STATUS
from results.machine_checks import for_phone, start_check
from results.models import MachineCheck, ResultUpload
from results.races import race_from
from results.uploads import (
    UploadRefused,
    _check_account,
    _check_not_uploaded,
    _check_photo,
)
from stations.models import PollingStation

# Who may have a photo read, until the reading limits are built. Everyone
# else types the results, and the upload goes to a reviewer.
READING_ROLES = {"party_agent"}


def may_read(account):
    return account.is_staff or account.role in READING_ROLES


class ReadRequestSerializer(serializers.Serializer):
    station = serializers.CharField()
    race = serializers.CharField()
    photo = serializers.FileField()
    # The earlier upload the person agrees with.
    reference = serializers.UUIDField(required=False)


AGREEMENT_REFUSAL_STATUS = {
    "reference_not_usable": status.HTTP_404_NOT_FOUND,
    "already_uploaded": status.HTTP_409_CONFLICT,
    "same_photo": status.HTTP_409_CONFLICT,
}


class ReadPhotoView(APIView):
    """Start reading a results form photo before entry, to prefill the form.

    Answers at once with the check and its status, usually "running"; the
    phone then asks ReadResultView until it is "done" or "failed". A
    reading that fails leaves the person to type the counts as usual.

    With ``reference``, the person agrees with that earlier upload: the
    photo is also compared with its photo.
    """

    authentication_classes = NATIVE_AUTHENTICATION
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        # First, before the photo is read or the model is called.
        if not may_read(request.user):
            return Response(
                {
                    "code": "reading_not_allowed",
                    "error": "Photo reading is open to staff and party agents only.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        given = ReadRequestSerializer(data=request.data)
        if not given.is_valid():
            return Response(
                {
                    "code": "invalid_request",
                    "error": "The request is missing a field or has a wrong value.",
                    "errors": given.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        data = given.validated_data
        try:
            station, race = _station_and_race(request.user, data)
            _check_photo(data["photo"])
            reference = None
            if "reference" in data:
                reference = _reference(
                    request.user, station, race, data["reference"], data["photo"]
                )
        except UploadRefused as refused:
            return Response(
                {"code": refused.code, "error": refused.message},
                status=AGREEMENT_REFUSAL_STATUS.get(refused.code)
                or REFUSAL_STATUS.get(refused.code, status.HTTP_400_BAD_REQUEST),
            )
        check = start_check(
            request.user, station, race, data["photo"], reference=reference
        )
        return Response(for_phone(check), status=status.HTTP_202_ACCEPTED)


class ReadResultView(APIView):
    """The state of one of the person's own readings. Nobody else's."""

    authentication_classes = NATIVE_AUTHENTICATION
    permission_classes = [IsAuthenticated]

    def get(self, request, check_id):
        check = get_object_or_404(MachineCheck, pk=check_id, account=request.user)
        return Response(for_phone(check))


def _station_and_race(account, data):
    station = (
        PollingStation.objects.select_related(
            "polling_center__ward__constituency__county"
        )
        .filter(code=data["station"])
        .first()
    )
    if station is None:
        raise UploadRefused("station_not_found", "Polling station not found.")
    _check_account(account, station)
    race = race_from(data["race"])
    if race is None:
        raise UploadRefused("unknown_race", "Unknown race.")
    return station, race


def _reference(account, station, race, reference_id, photo):
    """The earlier upload a person agrees with, or UploadRefused.

    It must be another account's current, countable upload for this station
    and race, and the person must not have uploaded here already.
    """
    _check_not_uploaded(account, station, race.key)
    reference = (
        ResultUpload.objects.filter(
            pk=reference_id,
            polling_station=station,
            race=race.key,
            is_current=True,
            # An agreement holds no typed tally of its own to agree with.
            agrees_with__isnull=True,
        )
        .exclude(added_by=account)
        .first()
    )
    if reference is None or not reference.countable:
        raise UploadRefused(
            "reference_not_usable", "The upload you agree with cannot be used."
        )
    sent = _sha256(photo)
    for upload in ResultUpload.objects.filter(
        polling_station=station, race=race.key, is_current=True
    ):
        with upload.photo.open("rb") as stored:
            if _sha256(stored) == sent:
                raise UploadRefused(
                    "same_photo",
                    "This photo has already been uploaded. "
                    "Take your own photo of the form.",
                )
    return reference


def _sha256(photo):
    digest = hashlib.sha256()
    photo.seek(0)
    for chunk in iter(lambda: photo.read(1 << 20), b""):
        digest.update(chunk)
    photo.seek(0)
    return digest.hexdigest()
