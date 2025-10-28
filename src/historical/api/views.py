from rest_framework.generics import ListAPIView
from historical.api.serializers import PresidentialResultsSerializer,GovernorResultsSerializer
from historical.models import GovernorResults, PresidentialResults
from stations.models import County


class PresidentialResultsByCountyAndYearView(ListAPIView):
    serializer_class = PresidentialResultsSerializer

    def get_queryset(self):
        county_number = self.kwargs.get('county_number')
        print(county_number,"county_number")
        year = self.kwargs.get('year')
        print(year,"year")
        county = County.objects.get(number=county_number)
        print(county,"county")
        return PresidentialResults.objects.filter(county=county,aspirant__year=year)

class GovernorResultsByCountyAndYearView(ListAPIView):
    serializer_class = GovernorResultsSerializer

    def get_queryset(self):
        county_number = self.kwargs.get('county_number')
        print(county_number,"county_number")
        year = self.kwargs.get('year')
        print(year,"year")
        county = County.objects.get(number=county_number)
        print(county,"county")
        return GovernorResults.objects.filter(county=county,aspirant__year=year)