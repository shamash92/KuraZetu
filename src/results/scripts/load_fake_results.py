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

from results.models import (
    Aspirant,
    Party,
    PollingStationGovernorResults,
    PollingStationMpResults,
    PollingStationPresidentialResults,
    PollingStationSenatorResults,
    PollingStationWomenRepResults,
)
from stations.models import Constituency, County, PollingCenter, PollingStation, Ward

User = get_user_model()


def update_superuser_details():
    # ward = Ward.objects.get(number=1388)

    polling_center = PollingCenter.objects.get(
        name__icontains="TOI Market",
    )  # TOI Market (or replace with a ward of your choice)

    user = User.objects.get(id=1)  # Replace with the ID of the superuser

    user.polling_center = polling_center
    user.save()


def create_parties():
    """
    Create parties for the aspirants.
    """
    party_data = [
        {"name": "Party A", "code": "PA", "party_color": "#FF5733"},
        {"name": "Party B", "code": "PB", "party_color": "#33FF57"},
        {"name": "Party C", "code": "PC", "party_color": "#3357FF"},
        {"name": "Party D", "code": "PD", "party_color": "#FF33A1"},
    ]

    for data in party_data:
        Party.objects.get_or_create(
            name=data["name"],
            short_name=data["code"],
            party_colour_hex=data["party_color"],
        )


def create_aspirants():
    """
    Get or create an aspirant based on the provided data.
    """
    data = [
        {
            "first_name": "Pres",
            "last_name": "1",
            "party": 1,
            "level": "president",
        },
        {
            "first_name": "Pres",
            "last_name": "2",
            "party": 2,
            "level": "president",
        },
        {
            "first_name": "Pres",
            "last_name": "3",
            "party": 3,
            "level": "president",
        },
        {
            "first_name": "Pres",
            "last_name": "4",
            "party": 4,
            "level": "president",
        },
        {
            "first_name": "Aspirant",
            "last_name": "2",
            "party": 1,
            "level": "governor",
        },
        {
            "first_name": "Aspirant",
            "last_name": "3",
            "party": 2,
            "level": "governor",
        },
        {
            "first_name": "Aspirant",
            "last_name": "4",
            "party": 3,
            "level": "governor",
        },
        {
            "first_name": "Aspirant",
            "last_name": "6",
            "party": 1,
            "level": "senator",
        },
        {
            "first_name": "Aspirant",
            "last_name": "8",
            "party": 3,
            "level": "senator",
        },
        {
            "first_name": "Aspirant",
            "last_name": "9",
            "party": 4,
            "level": "senator",
        },
        {
            "first_name": "Aspirant",
            "last_name": "10",
            "party": 1,
            "level": "women_rep",
        },
        {
            "first_name": "Aspirant",
            "last_name": "11",
            "party": 2,
            "level": "women_rep",
        },
        {
            "first_name": "Aspirant",
            "last_name": "11",
            "party": 1,
            "level": "mp",
        },
        {
            "first_name": "Aspirant",
            "last_name": "12",
            "party": 3,
            "level": "mp",
        },
        {
            "first_name": "Aspirant",
            "last_name": "13",
            "party": 4,
            "level": "mp",
        },
        {
            "first_name": "Aspirant",
            "last_name": "13",
            "party": 1,
            "level": "mca",
        },
        {
            "first_name": "Aspirant",
            "last_name": "14",
            "party": 2,
            "level": "mca",
        },
        {
            "first_name": "Aspirant",
            "last_name": "15",
            "party": 3,
            "level": "mca",
        },
        {
            "first_name": "Aspirant",
            "last_name": "16",
            "party": 4,
            "level": "mca",
        },
    ]

    user = User.objects.get(id=1)  # Replace with the ID of the superuser

    polling_center = user.polling_center
    ward = polling_center.ward
    constituency = polling_center.ward.constituency
    county = polling_center.ward.constituency.county

    for aspirant in data:
        party = Party.objects.get(id=aspirant["party"])

        try:
            aspirant_obj = Aspirant.objects.get(
                first_name=aspirant["first_name"],
                last_name=aspirant["last_name"],
                party=party,
                level=aspirant["level"],
            )
        except Aspirant.DoesNotExist:
            aspirant_obj = Aspirant(
                first_name=aspirant["first_name"],
                last_name=aspirant["last_name"],
                party=party,
                level=aspirant["level"],
            )
            if aspirant["level"] == "governor":
                aspirant_obj.county = county
            elif aspirant["level"] == "senator":
                aspirant_obj.county = county
            elif aspirant["level"] == "women_rep":
                aspirant_obj.county = county
            elif aspirant["level"] == "mp":
                aspirant_obj.constituency = constituency
            elif aspirant["level"] == "mca":
                aspirant_obj.ward = ward

            aspirant_obj.save()


def create_polling_station_results():
    """
    Create fake polling station results.
    """
    aspirants = Aspirant.objects.all()

    user = User.objects.get(id=1)  # Replace with the ID of the superuser
    polling_center = user.polling_center
    polling_stations = PollingStation.objects.filter(polling_center=polling_center)

    for polling_station in tqdm(
        polling_stations, desc="Creating dummy polling station pres results"
    ):
        for aspirant in aspirants:
            if aspirant.level == "president":
                try:
                    pres_results = PollingStationPresidentialResults.objects.get(
                        polling_station=polling_station,
                        presidential_candidate=aspirant,
                    )
                except PollingStationPresidentialResults.DoesNotExist:
                    print("does not exist")
                    pres_results = PollingStationPresidentialResults.objects.create(
                        polling_station=polling_station,
                        presidential_candidate=aspirant,
                    )

                    print(pres_results, "pres_results")
                    pres_results.votes = random.randint(0, 10000)
                    pres_results.save()

            if aspirant.level == "governor":
                try:
                    governor_results = PollingStationGovernorResults.objects.get(
                        polling_station=polling_station,
                        governor_candidate=aspirant,
                    )
                except PollingStationGovernorResults.DoesNotExist:
                    governor_results = PollingStationGovernorResults.objects.create(
                        polling_station=polling_station,
                        governor_candidate=aspirant,
                        votes=0,
                    )
                    governor_results.votes = random.randint(0, 10000)
                    governor_results.save()

            # elif aspirant.level == "governor":
            #     PollingStationGovernorResults.objects.get_or_create(
            #         polling_station=polling_station,
            #         aspirant=aspirant,
            #         votes=random.randint(0, 10000),
            #     )
            # elif aspirant.level == "senator":
            #     PollingStationSenatorResults.objects.get_or_create(
            #         polling_station=polling_station,
            #         aspirant=aspirant,
            #         votes=random.randint(0, 10000),
            #     )
            # elif aspirant.level == "women_rep":
            #     PollingStationWomenRepResults.objects.get_or_create(
            #         polling_station=polling_station,
            #         aspirant=aspirant,
            #         votes=random.randint(0, 10000),
            #     )
            # elif aspirant.level == "mp":
            #     PollingStationMpResults.objects.get_or_create(
            #         polling_station=polling_station,
            #         aspirant=aspirant,
            #         votes=random.randint(0, 10000),
            #     )
            # elif aspirant.level == "mca":
            #     PollingStationMpResults.objects.get_or_create(
            #         polling_station=polling_station,
            #         aspirant=aspirant,
            #         votes=random.randint(0, 10000),
            #     )


if __name__ == "__main__":
    # Create parties

    update_superuser_details()
    create_parties()
    create_aspirants()

    create_polling_station_results()
