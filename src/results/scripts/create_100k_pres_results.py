import os
import random
import sys

from django.contrib.gis.geos import Point
from django.db.models import F

from tqdm import tqdm

# Set the settings module
# Add the root project directory to Python path
CURRENT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
sys.path.append(PROJECT_ROOT)


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "CommunityTally.settings")
import django

django.setup()

from django.contrib.auth import get_user_model
from django.db.models import Q

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

User = get_user_model()


def create_dummy_100k_pres_results():
    """
    Create 100,000 presidential results for testing purposes.
    """

    # Get all polling stations
    polling_stations_qs = PollingStation.objects.all()

    # Get all aspirants
    aspirants_qs = Aspirant.objects.filter(level="president")

    for station in tqdm(
        polling_stations_qs,
        desc="Creating dummy presidential results in all polling stations",
    ):
        #  we randomise the number of results to create for each polling station to create gaps and calculate percentage polling stations with results

        if random.random() < 0.4:
            continue

        for aspirant in aspirants_qs:
            try:
                x = PollingStationPresidentialResults.objects.get(
                    polling_station=station,
                    presidential_candidate=aspirant,
                )
                if aspirant.id == 1:
                    x.votes = random.randint(100, 190)
                elif aspirant.id == 2:
                    x.votes = random.randint(100, 140)
                elif aspirant == aspirants_qs.last():
                    x.votes = random.randint(1, 10)
                else:
                    x.votes = random.randint(1, 30)
                x.save()
            except PollingStationPresidentialResults.DoesNotExist:
                x = PollingStationPresidentialResults.objects.create(
                    polling_station=station,
                    presidential_candidate=aspirant,
                )
                if aspirant.id == 1:
                    x.votes = random.randint(100, 190)
                elif aspirant.id == 2:
                    x.votes = random.randint(100, 140)
                elif aspirant == aspirants_qs.last():
                    x.votes = random.randint(1, 10)
                else:
                    x.votes = random.randint(1, 30)
                x.save()


def create_dummy_county_results():
    user = User.objects.get(pk=1)

    user_ward = user.polling_center.ward
    user_constituency = user_ward.constituency
    user_county = user_constituency.county

    # Get all polling stations
    polling_stations_qs = PollingStation.objects.filter(
        polling_center__ward__constituency__county=user_county,
    )

    print(polling_stations_qs.count(), "polling stations qs")

    # Get all aspirants

    aspirants_qs = Aspirant.objects.filter(
        Q(county=user_county) | Q(constituency=user_constituency) | Q(ward=user_ward),
    )

    for station in tqdm(
        polling_stations_qs,
        desc="Creating dummy county results",
    ):
        #  we randomise the number of results to create for each polling station to create gaps and calculate percentage polling stations with results

        if random.random() < 0.4:
            continue

        for aspirant in aspirants_qs:
            if aspirant.level == "governor":
                try:
                    x = PollingStationGovernorResults.objects.get(
                        polling_station=station,
                        governor_candidate=aspirant,
                    )

                    x.votes = random.randint(1, 1000)
                    x.save()
                except PollingStationGovernorResults.DoesNotExist:
                    x = PollingStationGovernorResults.objects.create(
                        polling_station=station,
                        governor_candidate=aspirant,
                        votes=random.randint(1, 1000),
                    )

            elif aspirant.level == "senator":
                try:
                    x = PollingStationSenatorResults.objects.get(
                        polling_station=station,
                        senator_candidate=aspirant,
                    )

                    x.votes = random.randint(1, 1000)
                    x.save()
                except PollingStationSenatorResults.DoesNotExist:
                    x = PollingStationSenatorResults.objects.create(
                        polling_station=station,
                        senator_candidate=aspirant,
                        votes=random.randint(1, 1000),
                    )

            elif aspirant.level == "women_rep":
                try:
                    x = PollingStationWomenRepResults.objects.get(
                        polling_station=station,
                        woman_rep_candidate=aspirant,
                    )
                    x.votes = random.randint(1, 1000)
                    x.save()
                except PollingStationWomenRepResults.DoesNotExist:
                    x = PollingStationWomenRepResults.objects.create(
                        polling_station=station,
                        woman_rep_candidate=aspirant,
                        votes=random.randint(1, 1000),
                    )
            elif aspirant.level == "mp":
                try:
                    x = PollingStationMpResults.objects.get(
                        polling_station=station,
                        mp_candidate=aspirant,
                    )
                    x.votes = random.randint(1, 1000)
                    x.save()
                except PollingStationMpResults.DoesNotExist:
                    x = PollingStationMpResults.objects.create(
                        polling_station=station,
                        mp_candidate=aspirant,
                        votes=random.randint(1, 1000),
                    )
            elif aspirant.level == "mca":
                try:
                    x = PollingStationMCAResults.objects.get(
                        polling_station=station,
                        mca_candidate=aspirant,
                    )
                    x.votes = random.randint(1, 1000)
                    x.save()
                except PollingStationMCAResults.DoesNotExist:
                    x = PollingStationMCAResults.objects.create(
                        polling_station=station,
                        mca_candidate=aspirant,
                        votes=random.randint(1, 1000),
                    )


if __name__ == "__main__":
    create_dummy_100k_pres_results()
    create_dummy_county_results()
