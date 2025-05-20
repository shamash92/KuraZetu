from django.core.cache import cache
from django.db.models import Sum

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from results.api.serializers import (
    PollingStationGovernorResultsSerializer,
    PollingStationMCAResultsSerializer,
    PollingStationMpResultsSerializer,
    PollingStationPresidentialResultsSerializer,
    PollingStationSenatorResultsSerializer,
    PollingStationWomenRepResultsSerializer,
)
from results.models import (
    Aspirant,
    PollingStationGovernorResults,
    PollingStationMCAResults,
    PollingStationMpResults,
    PollingStationPresidentialResults,
    PollingStationSenatorResults,
    PollingStationWomenRepResults,
)
from stations.models import PollingCenter, PollingStation, Ward


# TODO: We can refactor this code to use a single view for all results and pass the admin level e.g. presidential, governor, senator as url parameter
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

        # print(polling_stations_qs, "polling_stations_qs")

        # Fetch the polling center results
        results = PollingStationPresidentialResults.objects.filter(
            polling_station__polling_center=polling_center
        )

        # print(results, "presidential results results")
        serializer = PollingStationPresidentialResultsSerializer(results, many=True)
        # TODO: get the stream number from polling center model once the model is updated
        return Response(
            {"data": serializer.data, "streams": polling_stations_qs.count()},
            status=status.HTTP_200_OK,
        )


class PollingCenterGovernorResultsAPIView(APIView):
    """
    API view to retrieve governor results for a specific polling station.
    """

    def get(self, request, ward_number, polling_center_code):
        """
        Retrieve governor results for a specific polling station.
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

        # Fetch the polling center results
        results = PollingStationGovernorResults.objects.filter(
            polling_station__polling_center=polling_center
        )

        # print(results, "gpovernor results")

        serializer = PollingStationGovernorResultsSerializer(results, many=True)

        return Response(
            {"data": serializer.data, "streams": polling_stations_qs.count()},
            status=status.HTTP_200_OK,
        )


class PollingCenterSenatorResultsAPIView(APIView):
    """
    API view to retrieve senator results for a specific polling station.
    """

    def get(self, request, ward_number, polling_center_code):
        """
        Retrieve governor results for a specific polling station.
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

        # Fetch the polling center results
        results = PollingStationSenatorResults.objects.filter(
            polling_station__polling_center=polling_center
        )

        # print(results, "senator results")

        serializer = PollingStationSenatorResultsSerializer(results, many=True)

        return Response(
            {"data": serializer.data, "streams": polling_stations_qs.count()},
            status=status.HTTP_200_OK,
        )


class PollingCenterWomenRepResultsAPIView(APIView):
    """
    API view to retrieve Women Rep results for a specific polling station.
    """

    def get(self, request, ward_number, polling_center_code):
        """
        Retrieve Women rep results for a specific polling station.
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

        # Fetch the polling center results
        results = PollingStationWomenRepResults.objects.filter(
            polling_station__polling_center=polling_center
        )

        # print(results, "women rep results")

        serializer = PollingStationWomenRepResultsSerializer(results, many=True)

        return Response(
            {"data": serializer.data, "streams": polling_stations_qs.count()},
            status=status.HTTP_200_OK,
        )


class PollingCenterMpResultsAPIView(APIView):
    """
    API view to retrieve MP results for a specific polling station.
    """

    def get(self, request, ward_number, polling_center_code):
        """
        Retrieve MP results for a specific polling station.
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

        # Fetch the polling center results
        results = PollingStationMpResults.objects.filter(
            polling_station__polling_center=polling_center
        )

        serializer = PollingStationMpResultsSerializer(results, many=True)

        return Response(
            {"data": serializer.data, "streams": polling_stations_qs.count()},
            status=status.HTTP_200_OK,
        )


class PollingCenterMCAResultsAPIView(APIView):
    """
    API view to retrieve MCA results for a specific polling station.
    """

    def get(self, request, ward_number, polling_center_code):
        """
        Retrieve MCA results for a specific polling station.
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

        # Fetch the polling center results
        results = PollingStationMCAResults.objects.filter(
            polling_station__polling_center=polling_center
        )

        serializer = PollingStationMCAResultsSerializer(results, many=True)

        return Response(
            {"data": serializer.data, "streams": polling_stations_qs.count()},
            status=status.HTTP_200_OK,
        )


class TotalPresResultsAPIView(APIView):
    """
    API view to retrieve Presidential Results results for a specific polling station.
    """

    def get(self, request):
        # Try to get cached results

        candidate_results = cache.get("presidential_candidate_results")

        if candidate_results is None:
            # get number of polling stations
            polling_stations = PollingStation.objects.all()
            nationwide_polling_stations_count = polling_stations.count()

            # Get all aspirants
            aspirants = Aspirant.objects.filter(level="president")

            candidate_results = []
            for aspirant in aspirants:
                # Get the total votes for each aspirant
                total_polling_stations_with_results = (
                    PollingStationPresidentialResults.objects.filter(
                        presidential_candidate=aspirant
                    )
                )
                total_polling_stations_count = (
                    total_polling_stations_with_results.count()
                )

                if total_polling_stations_count == 0:
                    continue

                total_votes = total_polling_stations_with_results.aggregate(
                    Sum("votes")
                ).get("votes__sum", 0)

                full_name = aspirant.first_name + " " + aspirant.last_name
                candidate_results.append(
                    {
                        "name": full_name,
                        "party": aspirant.party.name,
                        "party_color": aspirant.party.party_colour_hex,
                        "votes": total_votes,
                        "total_polling_stations_with_results": total_polling_stations_count,
                        "nationwide_polling_stations_count": nationwide_polling_stations_count,
                    }
                )

            # calculate percentages and append to the list
            for candidate in candidate_results:
                total_votes = sum(candidate["votes"] for candidate in candidate_results)
                if total_votes > 0:
                    candidate["percentage"] = round(
                        ((candidate["votes"] / total_votes) * 100), 2
                    )

                else:
                    candidate["percentage"] = 0
            # Sort the results by votes in descending order
            candidate_results = sorted(
                candidate_results, key=lambda x: x["votes"], reverse=True
            )
            cache.set(
                "presidential_candidate_results", candidate_results, timeout=3
            )  # 3 seconds TODO: Set to an appropriate timeout in production

        return Response(
            {"results": candidate_results},
            status=status.HTTP_200_OK,
        )
