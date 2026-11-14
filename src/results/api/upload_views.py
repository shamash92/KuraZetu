from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.urls import reverse

from rest_framework import serializers, status
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import NATIVE_AUTHENTICATION
from results.api.serializers import AspirantSerializer
from results.location import MESSAGES, Fix
from results.models import Aspirant, ResultUpload
from results.qr import MESSAGES as QR_MESSAGES
from results.races import race_from
from results.uploads import UploadRefused, submit_upload

REFUSAL_STATUS = {
    "station_not_found": status.HTTP_404_NOT_FOUND,
    "not_allowed": status.HTTP_403_FORBIDDEN,
    "photo_too_large": status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
    "key_used": status.HTTP_409_CONFLICT,
    "already_uploaded": status.HTTP_409_CONFLICT,
    "check_running": status.HTTP_409_CONFLICT,
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
    # The photo, or the person's machine reading that already holds it.
    photo = serializers.FileField(required=False)
    check_id = serializers.UUIDField(required=False)
    # The device fix and capture time, when the device gives them.
    latitude = serializers.FloatField(required=False, min_value=-90, max_value=90)
    longitude = serializers.FloatField(required=False, min_value=-180, max_value=180)
    accuracy = serializers.FloatField(required=False, min_value=0)
    captured_at = serializers.DateTimeField(required=False)

    def validate_votes(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Send the tally as an object.")
        return value

    def validate(self, data):
        if ("photo" in data) == ("check_id" in data):
            raise serializers.ValidationError("Send the photo or its check_id.")
        return data


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
                photo=data.get("photo"),
                check_id=data.get("check_id"),
                quality_checked=data["quality_checked"],
                key=data["key"],
                fix=_fix(data),
                captured_at=data.get("captured_at"),
            )
        except UploadRefused as refused:
            return Response(
                {"code": refused.code, "error": refused.message},
                status=REFUSAL_STATUS.get(refused.code, status.HTTP_400_BAD_REQUEST),
            )
        return Response(
            {
                "id": str(upload.id),
                "is_current": upload.is_current,
                "location_grade": upload.location_grade,
                "countable": upload.countable,
                # Why the upload cannot support a result, when it cannot.
                "location_message": MESSAGES.get(upload.location_grade),
                "qr_message": QR_MESSAGES.get(upload.server_qr_result),
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def get(self, request):
        """The person's own current upload for one station and race."""
        race = race_from(request.query_params.get("race", ""))
        current = (
            ResultUpload.objects.filter(
                added_by=request.user,
                polling_station__code=request.query_params.get("station"),
                race=race.key,
                is_current=True,
            ).first()
            if race
            else None
        )
        if current is None:
            return Response(
                {"code": "no_upload", "error": "You have no upload here."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(own_upload(request, current))


def own_upload(request, upload):
    """A person's own upload as they see it: their figures and their photo."""
    candidates = Aspirant.objects.filter(pk__in=upload.votes).select_related("party")
    return {
        "id": str(upload.id),
        "votes": [
            {
                "candidate": AspirantSerializer(candidate).data,
                "votes": upload.votes[str(candidate.id)],
            }
            for candidate in candidates.order_by("id")
        ],
        "rejected_votes": upload.rejected_votes,
        "disputed_votes": upload.disputed_votes,
        "location_grade": upload.location_grade,
        "countable": upload.countable,
        "created_at": upload.created_at,
        **_photo_links(request, upload),
    }


def _photo_links(request, upload):
    """A quick preview, and the full photo for zooming once it has loaded.

    A photo already small has no preview, so both links are the photo and it
    downloads once.
    """
    full = request.build_absolute_uri(
        reverse("result-upload-photo-full", args=[upload.id])
    )
    if not upload.preview:
        return {"photo_preview": full, "photo_full": full}
    preview = request.build_absolute_uri(
        reverse("result-upload-photo", args=[upload.id])
    )
    return {"photo_preview": preview, "photo_full": full}


class ResultUploadPhotoView(APIView):
    """The photo of a person's own current upload. Nobody else can open it."""

    authentication_classes = NATIVE_AUTHENTICATION
    permission_classes = [IsAuthenticated]
    # The full photo as uploaded, instead of the preview.
    full = False

    def get(self, request, upload_id):
        upload = get_object_or_404(
            ResultUpload, pk=upload_id, added_by=request.user, is_current=True
        )
        stored = upload.photo if self.full or not upload.preview else upload.preview
        response = FileResponse(stored.open("rb"), content_type="image/jpeg")
        # Never kept by a shared cache in front of the server.
        response["Cache-Control"] = "private, no-store"
        return response


def _fix(data):
    """A fix needs all three numbers; anything less is no usable fix."""
    if all(data.get(k) is not None for k in ("latitude", "longitude", "accuracy")):
        return Fix(data["latitude"], data["longitude"], data["accuracy"])
    return None
