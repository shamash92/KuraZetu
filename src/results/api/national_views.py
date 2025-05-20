from django.core.cache import cache
from django.db.models import Sum

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from results.models import Aspirant, PollingStationPresidentialResults
from stations.models import PollingCenter, PollingStation, Ward


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
