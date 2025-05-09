from rest_framework_gis.serializers import GeoFeatureModelSerializer

from stations.models import Constituency, County, PollingCenter, Ward


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
