from rest_framework.generics import ListAPIView

from stations.api.serializers import (
    ConstituencySerializer,
    CountySerializer,
    PollingCenterSerializer,
    WardSerializer,
)
from stations.models import Constituency, County, PollingCenter, Ward


class CountiesBoundariesListAPIView(ListAPIView):
    """
    List all County Boundaries
    """

    queryset = County.objects.all()
    serializer_class = CountySerializer

    def get_queryset(self):
        return County.objects.all().order_by("name")


class ConstituenciesBoundariesListAPIView(ListAPIView):
    """
    List all Constituencies Boundaries
    """

    queryset = Constituency.objects.all()
    serializer_class = ConstituencySerializer

    def get_queryset(self, *args, **kwargs):
        county_number = self.kwargs.get("county_number")

        county_qs = County.objects.get(number=int(county_number))

        return Constituency.objects.filter(county=county_qs).order_by("name")


class WardBoundariesListAPIView(ListAPIView):
    """
    List all Ward Boundaries
    """

    queryset = Ward.objects.all()
    serializer_class = WardSerializer

    def get_queryset(self, *args, **kwargs):
        constituency_number = self.kwargs.get("constituency_number")

        constituency = Constituency.objects.get(number=constituency_number)

        return Ward.objects.filter(constituency=constituency).order_by("name")


class WardPollingCenterListAPIView(ListAPIView):
    """
    List all Ward Polling Centers
    """

    queryset = PollingCenter.objects.all()
    serializer_class = PollingCenterSerializer

    def get_queryset(self, *args, **kwargs):
        ward_number = self.kwargs.get("ward_number")

        ward = Ward.objects.get(number=ward_number)

        return PollingCenter.objects.filter(ward=ward).order_by("name")
