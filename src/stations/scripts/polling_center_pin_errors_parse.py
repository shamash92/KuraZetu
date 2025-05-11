import os
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

from stations.models import PollingCenter

# TODO: Run this script in the background either once a pin location changes or every midnight


print("\033[92mStart of processing...\033[0m")

# Iterate over all PollingCenter objects
polling_centers_qs = PollingCenter.objects.all()

for polling_center in tqdm(
    polling_centers_qs, desc="Processing polling centers pin locations"
):
    # print(f"Processing {polling_center.name}...")
    error_message = None

    # TODO: This is a temporary fix since re-running the save_polling_center_pin_locations.py script makes is_verified=True by default.
    #  Delete this once the mobile app is up and running

    # Check if pin_location is at (0, 0) and clean it up to null

    polling_center.is_verified = False  # this is to fix the issue of is_verified being set to True when the pin_locations are processed in the previous script
    polling_center.save()
    if (
        polling_center.pin_location
        and polling_center.pin_location.x == 0
        and polling_center.pin_location.y == 0
    ):
        polling_center.pin_location = None
        polling_center.pin_location_error = None
        polling_center.is_verified = False
        polling_center.save()
        continue

    if (
        polling_center.pin_location_error is not None
        and polling_center.pin_location is None
    ):
        polling_center.is_verified = False
        polling_center.pin_location_error = None
        polling_center.save()
        continue

    if polling_center.pin_location_error:
        polling_center.is_verified = False
        polling_center.save()
        continue

    # Check if pin_location is null. second check is to make sure we do not update the center if we have already saved the message the first time.
    if polling_center.ward.boundary is None:
        error_message = "Ward boundary not found in database"

    elif (
        polling_center.pin_location is None
        and polling_center.pin_location_error is None
    ):
        error_message = "Pin location not registered in database"

    elif (
        polling_center.pin_location is not None
        and polling_center.pin_location_error is None
    ):
        # Check if pin_location is inside the ward boundary
        pin_location_point = Point(
            polling_center.pin_location.x, polling_center.pin_location.y
        )
        if not polling_center.ward.boundary.contains(pin_location_point):
            error_message = "Pin location not inside the ward boundary"

    # Update the pin_location_error field if there's an error
    if error_message:
        # print(f"     Error: {error_message}")
        polling_center.pin_location_error = error_message
        PollingCenter.is_verified = False
        polling_center.save()

print("\033[92mProcessing complete.\033[0m")
