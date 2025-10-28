import json

from django.core.cache import cache
from django.db.models import Sum
from django.shortcuts import render

from rest_framework import status
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from results.api.serializers import (
    AspirantSerializer,
    PollingStationGovernorResultsSerializer,
    PollingStationMCAResultsSerializer,
    PollingStationMpResultsSerializer,
    PollingStationPresidentialExtrasSerializer,
    PollingStationPresidentialResultsSerializer,
    PollingStationSenatorResultsSerializer,
    PollingStationWomenRepResultsSerializer,
)
from results.models import (
    Aspirant,
    PollingStationGovernorResults,
    PollingStationMCAResults,
    PollingStationMpResults,
    PollingStationPresidentialExtras,
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


class PollingStationPresidentialResultsAPIView(APIView):

    authentication_classes = [
        TokenAuthentication,
        SessionAuthentication,
    ]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        polling_station_code = kwargs.get("polling_station_code")
        print(
            polling_station_code,
            "polling_station_code in PollingStationPresidentialResultsAPIView",
        )

        try:
            polling_station = PollingStation.objects.get(code=polling_station_code)
        except PollingStation.DoesNotExist:
            return Response(
                {"error": "Polling station not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        pres_results_qs = PollingStationPresidentialResults.objects.filter(
            polling_station=polling_station
        ).order_by("votes")

        serializer = PollingStationPresidentialResultsSerializer(
            pres_results_qs, many=True
        )

        try:
            polling_station_extras = PollingStationPresidentialExtras.objects.get(
                polling_station=polling_station
            )
        except PollingStationPresidentialExtras.DoesNotExist:
            polling_station_extras = None

        extra_data = (
            PollingStationPresidentialExtrasSerializer(polling_station_extras).data
            if polling_station_extras
            else None
        )

        # print(serializer.data, "serializer data in PollingStationPresResultsAPIView")
        return Response(
            {
                "data": serializer.data,
                "extra_data": extra_data,
                "status": status.HTTP_200_OK,
            }
        )


class PollingStationCandidatesListAPIView(APIView):

    authentication_classes = [
        TokenAuthentication,
        SessionAuthentication,
    ]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        polling_station_code = kwargs.get("polling_station_code")
        level = kwargs.get("level")

        try:
            polling_station = PollingStation.objects.get(code=polling_station_code)
        except PollingStation.DoesNotExist:
            return Response(
                {"error": "Polling station not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        print(
            polling_station_code,
            "polling_station_code in PollingStationPresidentialResultsAPIView",
        )
        if level == "president":
            aspirants = Aspirant.objects.filter(level="president")
        elif level == "governor":
            aspirants = Aspirant.objects.filter(
                level="governor",
                county=polling_station.polling_center.ward.constituency.county,
            )
        elif level == "senator":
            aspirants = Aspirant.objects.filter(
                level="senator",
                county=polling_station.polling_center.ward.constituency.county,
            )
        elif level == "mp":
            aspirants = Aspirant.objects.filter(
                level="mp",
                constituency=polling_station.polling_center.ward.constituency,
            )
        elif level == "mca":
            aspirants = Aspirant.objects.filter(
                level="mca",
                ward=polling_station.polling_center.ward,
            )
        else:
            return Response(
                {"error": "Invalid level specified."},
                status=status.HTTP_200_OK,
            )

        aspirants = AspirantSerializer(aspirants, many=True)

        return Response(
            {
                "data": aspirants.data,
                "status": status.HTTP_200_OK,
            }
        )


class PollingStationResultsCreateAPIView(APIView):
    """
    API view to create results for a polling station.
    """

    authentication_classes = [
        TokenAuthentication,
        SessionAuthentication,
    ]
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, *args, **kwargs):
        level = kwargs.get("level")

        client_data = request.data

        data = json.loads(client_data.get("data", "{}"))
        image = client_data.get("image", "{}")

        print(data, "data in PollingStationResultsCreateAPIView")
        print(image, "image in PollingStationResultsCreateAPIView")

        polling_station_code = data.get("polling_station")

        print(
            polling_station_code,
            "polling_station_code in PollingStationResultsCreateAPIView",
        )

        print(
            data["polling_station"],
            "polling_station_code in PollingStationResultsCreateAPIView 2222",
        )

        if not polling_station_code:
            return Response(
                {"error": "Polling station code is required."},
                status=status.HTTP_200_OK,
            )

        if level != data.get("level"):
            return Response(
                {"error": "Level mismatch."},
                status=status.HTTP_200_OK,
            )
        print("-------")
        try:
            polling_station = PollingStation.objects.get(code=polling_station_code)
        except PollingStation.DoesNotExist:
            return Response(
                {"error": "Polling station not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if len(data.get("votes")) <= 0:
            return Response(
                {"error": "No votes provided."},
                status=status.HTTP_200_OK,
            )

        for aspirant_votes in data.get("votes"):
            print(
                aspirant_votes,
                "aspirant_votes in for loop",
            )
            try:
                aspirant = Aspirant.objects.get(pk=aspirant_votes["id"])
                result = PollingStationPresidentialResults.objects.create(
                    polling_station=polling_station,
                    presidential_candidate=aspirant,
                    votes=aspirant_votes["votes"],
                )

            except Exception as e:
                return Response(
                    {"error": str(e), "message": "Failed to create results."},
                    status=status.HTTP_200_OK,
                )
        # Create extra
        try:
            x = PollingStationPresidentialExtras.objects.create(
                polling_station=polling_station,
                rejected_votes=data.get("rejected_votes", 0),
                disputed_votes=data.get("disputed_votes", 0),
                valid_votes_cast=sum(
                    aspirant["votes"] for aspirant in data.get("votes", [])
                ),
                added_by=request.user if request.user.is_authenticated else None,
            )

            x.form_34A.save(
                "form34A.jpg",
                image,
                save=True,
            )

        except Exception as e:
            return Response(
                {"error": str(e), "message": "Failed to create extra results."},
                status=status.HTTP_200_OK,
            )

        return Response(
            {"message": "Results created successfully."},
            status=status.HTTP_201_CREATED,
        )
