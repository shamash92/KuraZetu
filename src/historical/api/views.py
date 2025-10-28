from rest_framework.generics import ListAPIView
from historical.api.serializers import (
    PresidentialResultsSerializer,
    GovernorResultsSerializer,
    SenatorResultsSerializer,
    WomenRepResultsSerializer,
    MPResultsSerializer,
    MCAResultsSerializer,
)
from historical.models import (
    GovernorResults,
    PresidentialResults,
    SenatorResults,
    WomenRepResults,
    MPResults,
    MCAResults,
)
from stations.models import County, Constituency, Ward


class PresidentialResultsByCountyAndYearView(ListAPIView):
    serializer_class = PresidentialResultsSerializer

    def get_queryset(self):
        county_number = self.kwargs.get("county_number")
        year = self.kwargs.get("year")
        try:
            county = County.objects.get(number=county_number)
            return PresidentialResults.objects.filter(
                county=county, aspirant__year=year
            )
        except County.DoesNotExist:
            return PresidentialResults.objects.none()


class GovernorResultsByCountyAndYearView(ListAPIView):
    serializer_class = GovernorResultsSerializer

    def get_queryset(self):
        county_number = self.kwargs.get("county_number")
        year = self.kwargs.get("year")
        try:
            county = County.objects.get(number=county_number)
            return GovernorResults.objects.filter(county=county, aspirant__year=year)
        except County.DoesNotExist:
            return GovernorResults.objects.none()


class SenatorResultsByCountyAndYearView(ListAPIView):
    serializer_class = SenatorResultsSerializer

    def get_queryset(self):
        county_number = self.kwargs.get("county_number")
        year = self.kwargs.get("year")
        try:
            county = County.objects.get(number=county_number)
            return SenatorResults.objects.filter(county=county, aspirant__year=year)
        except County.DoesNotExist:
            return SenatorResults.objects.none()


class WomenRepResultsByCountyAndYearView(ListAPIView):
    serializer_class = WomenRepResultsSerializer

    def get_queryset(self):
        county_number = self.kwargs.get("county_number")
        year = self.kwargs.get("year")
        try:
            county = County.objects.get(number=county_number)
            return WomenRepResults.objects.filter(county=county, aspirant__year=year)
        except County.DoesNotExist:
            return WomenRepResults.objects.none()


class MPResultsByConstituencyAndYearView(ListAPIView):
    serializer_class = MPResultsSerializer

    def get_queryset(self):
        constituency_number = self.kwargs.get("constituency_number")
        year = self.kwargs.get("year")
        try:
            constituency = Constituency.objects.get(number=constituency_number)
            return MPResults.objects.filter(
                constituency=constituency, aspirant__year=year
            )
        except Constituency.DoesNotExist:
            return MPResults.objects.none()


class MCAResultsByWardAndYearView(ListAPIView):
    serializer_class = MCAResultsSerializer

    def get_queryset(self):
        ward_number = self.kwargs.get("ward_number")
        year = self.kwargs.get("year")
        try:
            ward = Ward.objects.get(number=ward_number)
            return MCAResults.objects.filter(ward=ward, aspirant__year=year)
        except Ward.DoesNotExist:
            return MCAResults.objects.none()
