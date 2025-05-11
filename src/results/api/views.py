from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from results.api.serializers import PollingStationPresidentialResultsSerializer
from results.models import PollingStationPresidentialResults
from stations.models import PollingCenter, PollingStation, Ward


class PollingCenterPresidentialResultsAPIView(APIView):
    """
    API view to retrieve presidential results for a polling center.
    """

    def get(self, request, ward_number, polling_center_code):
        """
        Retrieve presidential results for a specific polling center.
        """

        # get polling stations
        try:
            ward = Ward.objects.get(number=ward_number)
        except Ward.DoesNotExist:
            return Response(
                {"error": "Ward not found."},
                status=status.HTTP_200_OK,
            )
        try:
            polling_center = PollingCenter.objects.get(
                code=polling_center_code, ward=ward
            )
        except PollingCenter.DoesNotExist:
            return Response(
                {"error": "Polling center not found."},
                status=status.HTTP_200_OK,
            )
        polling_stations_qs = PollingStation.objects.filter(
            polling_center=polling_center
        )

        print(polling_stations_qs, "polling_stations_qs")

        # Fetch the polling center results
        results = PollingStationPresidentialResults.objects.filter(
            polling_station__polling_center=polling_center
        )

        print(results, "presidential results results")
        serializer = PollingStationPresidentialResultsSerializer(results, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
