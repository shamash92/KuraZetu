from rest_framework.serializers import ModelSerializer
from rest_framework_gis.serializers import GeoFeatureModelSerializer

from stations.models import Constituency, County, PollingCenter, PollingStation, Ward
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
            "pin_location_error",
            "is_verified",
        )


class PollingCenterBoundarySerializer(GeoFeatureModelSerializer):

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
        geo_field = "boundary"
        fields = (
            "id",
            "name",
            "code",
            "ward",
            "constituency",
            "county",
            "pin_location",
            "pin_location_error",
            "is_verified",
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
