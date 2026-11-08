from django.shortcuts import get_object_or_404

from rest_framework import serializers, status
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import NATIVE_AUTHENTICATION
from results.api.upload_views import REFUSAL_STATUS
from results.machine_checks import for_phone, start_check
from results.models import MachineCheck
from results.races import race_from
from results.uploads import UploadRefused, _check_account, _check_photo
from stations.models import PollingStation


class ReadRequestSerializer(serializers.Serializer):
    station = serializers.CharField()
    race = serializers.CharField()
    photo = serializers.FileField()


class ReadPhotoView(APIView):
    """Start reading a results form photo before entry, to prefill the form.

    Answers at once with the check and its status, usually "running"; the
    phone then asks ReadResultView until it is "done" or "failed". A
    reading that fails leaves the person to type the counts as usual.
    """

    authentication_classes = NATIVE_AUTHENTICATION
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
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
        except UploadRefused as refused:
            return Response(
                {"code": refused.code, "error": refused.message},
                status=REFUSAL_STATUS.get(refused.code, status.HTTP_400_BAD_REQUEST),
            )
        check = start_check(request.user, station, race, data["photo"])
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
