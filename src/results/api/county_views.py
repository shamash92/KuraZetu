from django.core.cache import cache
from django.db.models import Sum

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

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


class CountyTotalResultsAPIView(APIView):
    """
    API view to retrieve Presidential Results results for a specific polling station.
    """

    def get(self, request, level):
        level = self.kwargs.get("level")
        print(level, "level ")
        # Try to get cached results
        user_ward = request.user.polling_center.ward
        user_constituency = user_ward.constituency
        user_county = user_constituency.county

        county_code = user_county.number
        # print(county_code, "county code")

        cache_key = f"county_{county_code}_{level}_candidate_results"

        candidate_results = cache.get(cache_key)

        if candidate_results is None:
            # get number of polling stations
            if level == "mp":
                polling_stations = PollingStation.objects.filter(
                    polling_center__ward__constituency=user_constituency
                )
            elif level == "mca":
                polling_stations = PollingStation.objects.filter(
                    polling_center__ward=user_ward
                )
            else:
                polling_stations = PollingStation.objects.filter(
                    polling_center__ward__constituency__county=user_county
                )
            county_polling_stations_count = polling_stations.count()

            # Get all aspirants
            aspirants = Aspirant.objects.filter(
                level=level,
            )

            # print(aspirants, "aspirants")

            if level == "president":
                county_results_qs = PollingStationPresidentialResults.objects.filter(
                    polling_station__polling_center__ward__constituency__county=user_county,
                )
            elif level == "governor":
                print("are we reaching here")
                county_results_qs = PollingStationGovernorResults.objects.filter(
                    polling_station__polling_center__ward__constituency__county=user_county,
                )
                print(county_results_qs, "county results qs governor")
            elif level == "senator":
                county_results_qs = PollingStationSenatorResults.objects.filter(
                    polling_station__polling_center__ward__constituency__county=user_county,
                )
            elif level == "women_rep":
                county_results_qs = PollingStationWomenRepResults.objects.filter(
                    polling_station__polling_center__ward__constituency__county=user_county,
                )
            elif level == "mp":
                county_results_qs = PollingStationMpResults.objects.filter(
                    polling_station__polling_center__ward__constituency=user_constituency,
                )
            elif level == "mca":
                county_results_qs = PollingStationMCAResults.objects.filter(
                    polling_station__polling_center__ward=user_ward,
                )

            candidate_results = []
            for aspirant in aspirants:
                # Get the total votes for each aspirant
                if level == "president":
                    total_polling_stations_with_results = county_results_qs.filter(
                        presidential_candidate=aspirant,
                    )
                elif level == "governor":
                    total_polling_stations_with_results = county_results_qs.filter(
                        governor_candidate=aspirant,
                    )
                    print(
                        total_polling_stations_with_results.count(),
                        "total_polling_stations_with_results governor",
                    )
                elif level == "senator":
                    total_polling_stations_with_results = county_results_qs.filter(
                        senator_candidate=aspirant,
                    )
                elif level == "women_rep":
                    total_polling_stations_with_results = county_results_qs.filter(
                        woman_rep_candidate=aspirant,
                    )
                elif level == "mp":
                    total_polling_stations_with_results = county_results_qs.filter(
                        mp_candidate=aspirant,
                    )
                elif level == "mca":
                    total_polling_stations_with_results = county_results_qs.filter(
                        mca_candidate=aspirant,
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
                        "fullName": full_name,
                        "party": aspirant.party.name,
                        "party_color": aspirant.party.party_colour_hex,
                        "totalVotes": total_votes,
                        "countedStreams": total_polling_stations_count,
                        "county_polling_stations_count": county_polling_stations_count,
                    }
                )

            # calculate percentages and append to the list
            for candidate in candidate_results:
                total_votes = sum(
                    candidate["totalVotes"] for candidate in candidate_results
                )
                if total_votes > 0:
                    candidate["percentage"] = round(
                        ((candidate["totalVotes"] / total_votes) * 100), 2
                    )

                else:
                    candidate["percentage"] = 0
            # Sort the results by votes in descending order
            candidate_results = sorted(
                candidate_results, key=lambda x: x["totalVotes"], reverse=True
            )

            # print(candidate_results, "candidate results")

            cache.set(
                cache_key,
                candidate_results,
                timeout=3,
            )

            # 3 seconds TODO: Set to an appropriate timeout in production

        return Response(
            {
                "results": candidate_results,
            },
            status=status.HTTP_200_OK,
        )
