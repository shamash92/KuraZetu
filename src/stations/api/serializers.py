from rest_framework.serializers import ModelSerializer
from rest_framework_gis.serializers import GeoFeatureModelSerializer

from stations.models import (
    Constituency,
    County,
    PollingCenter,
    PollingStation,
    Ward,
    PollingCenterVerification,
)
from rest_framework.fields import SerializerMethodField


class CountySerializer(GeoFeatureModelSerializer):
    class Meta:
        model = County
        geo_field = "boundary"
        fields = (
            "id",
            "number",
            "name",
            "boundary",
        )


class ConstituencySerializer(GeoFeatureModelSerializer):
    county = CountySerializer()

    class Meta:
        model = Constituency
        geo_field = "boundary"
        fields = (
            "id",
            "name",
            "county",
            "number",
            "boundary",
        )


class WardSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Ward
        geo_field = "boundary"
        fields = (
            "id",
            "name",
            "number",
            "boundary",
        )


class PollingCenterSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = PollingCenter
        geo_field = "pin_location"
        fields = (
            "id",
            "name",
            "code",
            "ward",
            "pin_location",
            "radius",
            "pin_location_error",
            "is_verified",
        )


class PollingCenterBoundarySerializer(GeoFeatureModelSerializer):

    ward = SerializerMethodField()
    ward_number = SerializerMethodField()
    constituency = SerializerMethodField()
    county = SerializerMethodField()
    is_unlocated = SerializerMethodField()

    def get_ward(self, obj):
        return obj.ward.name if obj.ward else None

    def get_ward_number(self, obj):
        return obj.ward.number if obj.ward else None

    def get_constituency(self, obj):
        return obj.ward.constituency.name if obj.ward else None

    def get_county(self, obj):
        return obj.ward.constituency.county.name if obj.ward else None

    ward_boundary = SerializerMethodField()

    def get_is_unlocated(self, obj):
        # No usable seed: null pin, or sitting at the 0,0 null-island.
        pin = obj.pin_location
        if pin is None:
            return True
        return abs(pin.x) < 1e-6 and abs(pin.y) < 1e-6

    def get_ward_boundary(self, obj):
        # GeoJSON of the ward polygon so the client can draw the outline,
        # clamp the map, and warn when a pin falls outside it.
        import json

        if obj.ward_id and obj.ward.boundary:
            return json.loads(obj.ward.boundary.geojson)
        return None

    class Meta:
        model = PollingCenter
        geo_field = "boundary"
        fields = (
            "id",
            "name",
            "code",
            "ward",
            "ward_number",
            "ward_boundary",
            "constituency",
            "county",
            "pin_location",
            "radius",
            "pin_location_error",
            "is_verified",
            "is_unlocated",
            "location_upvotes",
        )


class PollingStationSerializer(ModelSerializer):
    class Meta:
        model = PollingStation
        fields = (
            "code",
            "stream_number",
            "registered_voters",
            "date_created",
            "date_modified",
            "is_verified",
        )


class CommunityNotesPollingCenterSerializer(ModelSerializer):
    ward = SerializerMethodField()
    constituency = SerializerMethodField()
    county = SerializerMethodField()

    def get_ward(self, obj):
        return obj.ward.name if obj.ward else None

    def get_constituency(self, obj):
        return obj.ward.constituency.name if obj.ward else None

    def get_county(self, obj):
        return obj.ward.constituency.county.name if obj.ward else None

    class Meta:
        model = PollingCenter
        fields = (
            "id",
            "name",
            "code",
            "ward",
            "constituency",
            "county",
        )


class PartiallyVerifiedPollingCenterBoundarySerializer(GeoFeatureModelSerializer):

    name = SerializerMethodField()
    suggested_by = SerializerMethodField()
    suggested_on = SerializerMethodField()
    comment = SerializerMethodField()

    def get_name(self, obj):
        return obj.polling_center.name if obj.polling_center else None

    def get_suggested_by(self, obj):
        # AI suggestions are credited to the model; citizens get a masked handle.
        if obj.ai_suggestion:
            return obj.ai_model or "AI model"
        from stations.verification import mask_handle

        return mask_handle(obj.verified_by)

    def get_suggested_on(self, obj):
        return obj.date_modified.isoformat() if obj.date_modified else None

    def get_comment(self, obj):
        return obj.comments

    class Meta:
        model = PollingCenterVerification
        geo_field = "boundary"
        fields = (
            "id",
            "polling_center",
            "name",
            "pin_location",
            "radius",
            "suggested_by",
            "suggested_on",
            "comment",
            "ai_suggestion",
            "ai_model",
            "nominatim",
            "is_outlier",
            "is_upvote",
        )


class PollingStationInfoSerializer(ModelSerializer):
    polling_center = SerializerMethodField()

    def get_polling_center(self, obj):
        return obj.polling_center.name if obj.polling_center else None

    class Meta:
        model = PollingStation
        fields = (
            "polling_center",
            "stream_number",
            "code",
            "registered_voters",
            "is_verified",
        )
