from rest_framework import serializers, status
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import NATIVE_AUTHENTICATION
from results.uploads import UploadRefused, submit_upload

REFUSAL_STATUS = {
    "station_not_found": status.HTTP_404_NOT_FOUND,
    "not_allowed": status.HTTP_403_FORBIDDEN,
    "photo_too_large": status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
    "key_used": status.HTTP_409_CONFLICT,
}


class UploadRequestSerializer(serializers.Serializer):
    station = serializers.CharField()
    race = serializers.CharField()
    # Multipart carries the tally as JSON text: {"<aspirant id>": votes}.
    votes = serializers.JSONField(binary=True)
    rejected_votes = serializers.IntegerField(min_value=0)
    disputed_votes = serializers.IntegerField(min_value=0)
    quality_checked = serializers.BooleanField()
    key = serializers.UUIDField()
    photo = serializers.FileField()

    def validate_votes(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Send the tally as an object.")
        return value


class ResultUploadView(APIView):
    """A signed-in person uploads one results form photo and its tally."""

    authentication_classes = NATIVE_AUTHENTICATION
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        given = UploadRequestSerializer(data=request.data)
        if not given.is_valid():
            return Response(
                {
                    "code": "invalid_request",
                    "error": "The upload is missing a field or has a wrong value.",
                    "errors": given.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        data = given.validated_data
        try:
            upload, created = submit_upload(
                request.user,
                station_code=data["station"],
                race=data["race"],
                votes=data["votes"],
                rejected_votes=data["rejected_votes"],
                disputed_votes=data["disputed_votes"],
                photo=data["photo"],
                quality_checked=data["quality_checked"],
                key=data["key"],
            )
        except UploadRefused as refused:
            return Response(
                {"code": refused.code, "error": refused.message},
                status=REFUSAL_STATUS.get(refused.code, status.HTTP_400_BAD_REQUEST),
            )
        return Response(
            {"id": str(upload.id), "is_current": upload.is_current},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
