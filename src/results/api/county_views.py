from django.core.cache import cache
from django.db.models import Count, Sum

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
from stations.models import PollingStation

# Per level: the model holding its results, the field on that model pointing at
# the aspirant, and how far out the race is counted. "county" means every
# station in the user's county, "constituency" and "ward" narrow it down.
LEVEL_CONFIG = {
    "president": (
        PollingStationPresidentialResults,
        "presidential_candidate",
        "county",
    ),
    "governor": (PollingStationGovernorResults, "governor_candidate", "county"),
    "senator": (PollingStationSenatorResults, "senator_candidate", "county"),
    "women_rep": (PollingStationWomenRepResults, "woman_rep_candidate", "county"),
    "mp": (PollingStationMpResults, "mp_candidate", "constituency"),
    "mca": (PollingStationMCAResults, "mca_candidate", "ward"),
}


class CountyTotalResultsAPIView(APIView):
    """
    Totals for one race, counted across the signed-in user's county,
    constituency or ward depending on the level.
    """

    def get(self, request, level):
        level = self.kwargs.get("level")

        if level not in LEVEL_CONFIG:
            return Response(
                {"error": "Unknown level"}, status=status.HTTP_400_BAD_REQUEST
            )

        results_model, candidate_field, scope = LEVEL_CONFIG[level]

        user_ward = request.user.polling_center.ward
        user_constituency = user_ward.constituency
        user_county = user_constituency.county

        county_code = user_county.number

        cache_key = f"county_{county_code}_{level}_candidate_results"

        candidate_results = cache.get(cache_key)

        if candidate_results is None:
            if scope == "ward":
                station_filter = {"polling_center__ward": user_ward}
                results_filter = {"polling_station__polling_center__ward": user_ward}
            elif scope == "constituency":
                station_filter = {
                    "polling_center__ward__constituency": user_constituency
                }
                results_filter = {
                    "polling_station__polling_center__ward__constituency": (
                        user_constituency
                    )
                }
            else:
                station_filter = {
                    "polling_center__ward__constituency__county": user_county
                }
                results_filter = {
                    "polling_station__polling_center__ward__constituency__county": (
                        user_county
                    )
                }

            county_polling_stations_count = PollingStation.objects.filter(
                **station_filter
            ).count()

            # Group in the database rather than walking every aspirant at this
            # level nationally. Only candidates with results appear, which is
            # what the previous per-aspirant loop arrived at by skipping the
            # rest after it had already queried for them.
            totals = (
                results_model.objects.filter(**results_filter)
                .values(candidate_field)
                .annotate(total_votes=Sum("votes"), counted_streams=Count("id"))
            )

            aspirants_by_id = {
                aspirant.id: aspirant
                for aspirant in Aspirant.objects.filter(
                    id__in=[row[candidate_field] for row in totals]
                ).select_related("party")
            }

            candidate_results = []
            for row in totals:
                aspirant = aspirants_by_id.get(row[candidate_field])
                if aspirant is None:
                    continue

                candidate_results.append(
                    {
                        "fullName": f"{aspirant.first_name} {aspirant.last_name}",
                        "party": aspirant.party.name,
                        "party_color": aspirant.party.party_colour_hex,
                        "totalVotes": row["total_votes"] or 0,
                        "countedStreams": row["counted_streams"],
                        "county_polling_stations_count": county_polling_stations_count,
                    }
                )

            total_votes = sum(
                candidate["totalVotes"] for candidate in candidate_results
            )
            for candidate in candidate_results:
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
