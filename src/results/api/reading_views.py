from rest_framework import serializers, status
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import NATIVE_AUTHENTICATION
from results.api.upload_views import REFUSAL_STATUS
from results.machine_checks import for_phone, run_check
from results.races import race_from
from results.uploads import UploadRefused, _check_account, _check_photo
from stations.models import PollingStation


class ReadRequestSerializer(serializers.Serializer):
    station = serializers.CharField()
    race = serializers.CharField()
    photo = serializers.FileField()


class ReadPhotoView(APIView):
    """Read a results form photo before entry, to prefill the form.

    A reading that fails still answers 200 with status "failed": the
    person types the counts and uploads as usual.
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
        check = run_check(request.user, station, race, data["photo"])
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
