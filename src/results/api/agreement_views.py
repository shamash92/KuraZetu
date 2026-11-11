"""Agreeing with an earlier upload: the station's earlier photos
and their tags, the photos themselves, and saving an agreement."""

import io

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.urls import reverse

from PIL import Image, ImageOps
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import NATIVE_AUTHENTICATION
from results.agreements import earlier_uploads, tags
from results.api.reading_views import may_read
from results.api.upload_views import REFUSAL_STATUS, _fix, own_upload
from results.location import MESSAGES
from results.models import ResultUpload
from results.qr import MESSAGES as QR_MESSAGES
from results.races import race_from
from results.uploads import UploadRefused, submit_agreement
from stations.models import PollingStation

AGREEMENT_REFUSAL_STATUS = {
    **REFUSAL_STATUS,
    "check_not_usable": status.HTTP_409_CONFLICT,
    "not_agreed": status.HTTP_409_CONFLICT,
    "reference_not_usable": status.HTTP_409_CONFLICT,
}


class StationUploadsView(APIView):
    """Every upload of one station and race a person may see, one card each,
    to swipe through: their own first, with its figures, then everyone
    else's countable uploads, oldest first, each followed by the agreements
    with it. Others' cards show the photo and tags only, never the figures
    or who uploaded."""

    authentication_classes = NATIVE_AUTHENTICATION
    permission_classes = [IsAuthenticated]

    def get(self, request, polling_station_code, level):
        station = get_object_or_404(PollingStation, code=polling_station_code)
        race = race_from(level)
        if race is None:
            return Response(
                {"code": "unknown_race", "error": "Unknown race."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        mine = ResultUpload.objects.filter(
            added_by=request.user,
            polling_station=station,
            race=race.key,
            is_current=True,
        ).first()
        # Agreeing needs a machine check, open to readers only.
        may_agree = mine is None and may_read(request.user)
        cards = []
        own_tags = []
        for upload, upload_tags, agreements in earlier_uploads(station, race.key):
            if upload == mine:
                own_tags = upload_tags
            else:
                cards.append(_card(request, upload, upload_tags, may_agree))
            for agreement, agreement_tags in agreements:
                if agreement == mine:
                    own_tags = agreement_tags
                else:
                    cards.append(_card(request, agreement, agreement_tags, False))
        if mine is not None:
            own = {
                **own_upload(request, mine),
                "mine": True,
                "agrees_with": (
                    str(mine.agrees_with_id) if mine.agrees_with_id else None
                ),
                "tags": own_tags or tags(mine, people=1),
                "may_agree": False,
            }
            cards.insert(0, own)
        return Response(
            {
                "uploads": cards,
                # Someone else uploaded, and this person has not.
                "may_disagree": mine is None and bool(cards),
            }
        )


def _card(request, upload, upload_tags, may_agree):
    return {
        "id": str(upload.id),
        "mine": False,
        "agrees_with": str(upload.agrees_with_id) if upload.agrees_with_id else None,
        "photo": request.build_absolute_uri(
            reverse("result-upload-shared-photo", args=[upload.id])
        ),
        "tags": upload_tags,
        # An agreement holds no typed tally of its own to agree with.
        "may_agree": may_agree and upload.agrees_with_id is None,
    }


class SharedPhotoView(APIView):
    """A countable upload's photo as others see it: a copy with all metadata
    removed, never the stored photo."""

    authentication_classes = NATIVE_AUTHENTICATION
    permission_classes = [IsAuthenticated]

    def get(self, request, upload_id):
        upload = get_object_or_404(ResultUpload, pk=upload_id, is_current=True)
        if not upload.countable:
            return Response(status=status.HTTP_404_NOT_FOUND)
        response = HttpResponse(_without_metadata(upload), content_type="image/jpeg")
        response["Cache-Control"] = "private, no-store"
        return response


def _without_metadata(upload):
    """JPEG bytes with no EXIF, location, or device data.

    The preview is already such a copy. A photo small enough to have no
    preview is copied pixel by pixel.
    """
    stored = upload.preview or upload.photo
    with stored.open("rb") as source, Image.open(source) as image:
        upright = ImageOps.exif_transpose(image).convert("RGB")
    buffer = io.BytesIO()
    upright.save(buffer, "JPEG", quality=90)
    return buffer.getvalue()


class AgreementRequestSerializer(serializers.Serializer):
    # The person's reading of their photo, made with the earlier upload.
    check_id = serializers.UUIDField()
    quality_checked = serializers.BooleanField()
    key = serializers.UUIDField()
    latitude = serializers.FloatField(required=False, min_value=-90, max_value=90)
    longitude = serializers.FloatField(required=False, min_value=-180, max_value=180)
    accuracy = serializers.FloatField(required=False, min_value=0)
    captured_at = serializers.DateTimeField(required=False)


class AgreementView(APIView):
    """Save an agreement with an earlier upload, once its photo was found to
    agree. Nothing is typed; the photo was sent with the reading."""

    authentication_classes = NATIVE_AUTHENTICATION
    permission_classes = [IsAuthenticated]

    def post(self, request):
        given = AgreementRequestSerializer(data=request.data)
        if not given.is_valid():
            return Response(
                {
                    "code": "invalid_request",
                    "error": "The agreement is missing a field or has a wrong value.",
                    "errors": given.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        data = given.validated_data
        try:
            upload, created = submit_agreement(
                request.user,
                check_id=data["check_id"],
                quality_checked=data["quality_checked"],
                key=data["key"],
                fix=_fix(data),
                captured_at=data.get("captured_at"),
            )
        except UploadRefused as refused:
            return Response(
                {"code": refused.code, "error": refused.message},
                status=AGREEMENT_REFUSAL_STATUS.get(
                    refused.code, status.HTTP_400_BAD_REQUEST
                ),
            )
        return Response(
            {
                "id": str(upload.id),
                "is_current": upload.is_current,
                "location_grade": upload.location_grade,
                "countable": upload.countable,
                "location_message": MESSAGES.get(upload.location_grade),
                "qr_message": QR_MESSAGES.get(upload.server_qr_result),
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
