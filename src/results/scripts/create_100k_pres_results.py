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

from results.models import Aspirant, PollingStationPresidentialResults
from stations.models import PollingStation

User = get_user_model()


def create_100k_pres_results():
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


if __name__ == "__main__":
    # Create 100k presidential results
    create_100k_pres_results()
