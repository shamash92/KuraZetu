import json
import os
import sys

from django.contrib.gis.geos import Point
from django.db.models import Q

from tqdm import tqdm

# Set the settings module
# Add the root project directory to Python path
CURRENT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
sys.path.append(PROJECT_ROOT)


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "CommunityTally.settings")
import django

django.setup()


from stations.models import PollingCenter, PollingStation, Ward


def save_polling_center_pin_locations(geojson_file_path):
    # read geojson file
    with open(geojson_file_path, "r") as f:
        data = json.load(f)

        # Traverse the nested structure
        count = 0
        verified_count = 0
        for polling_center in tqdm(data["features"], desc="Processing Polling Centers"):
            count += 1
            x = {
                "type": "Feature",
                "properties": {
                    "county": "BARINGO",
                    "ward": "BARTABWA",
                    "constituency": "BARINGO  NORTH",
                    "name": "ATIAR PRIMARY SCHOOL",
                },
                "geometry": {"type": "Point", "coordinates": [35.789758, 0.79837]},
            }
            properties = polling_center["properties"]
            county_name = properties["county"].strip()
            ward_name = properties["ward"].strip()
            const_name = properties["constituency"].strip()
            polling_center_name = properties["name"].strip()
            point_coordinates = polling_center["geometry"]["coordinates"]
            point = Point(point_coordinates)

            polling_centers = PollingCenter.objects.filter(
                Q(name__icontains=polling_center_name)
                | Q(name__in={polling_center_name}),
                Q(ward__name__icontains=ward_name) | Q(ward__name__in={ward_name}),
                Q(ward__constituency__name__icontains=const_name)
                | Q(ward__constituency__name__in={const_name}),
                Q(ward__constituency__county__name__icontains=county_name)
                | Q(ward__constituency__county__name__in={county_name}),
            )
            if polling_centers.count() == 1:
                # print(
                #     f" {polling_center_name} >>> {ward_name}>{const_name}>{county_name} found."
                # )

                polling_center_obj = polling_centers.first()
                verified_count += 1

            if polling_centers.count() > 1:
                # print(
                #     f" {polling_center_name} >>> {ward_name}>{const_name}>{county_name} has more than one polling center."
                # )
                our_polling_centers = polling_centers.filter(name=polling_center_name)

                if our_polling_centers.count() == 1:
                    # print(f" Found you !!!!")
                    polling_center_obj = our_polling_centers.first()
                else:
                    print("multiple not found")

                    continue
            if polling_centers.count() == 0:
                # print(
                #     f" {polling_center_name} >>> {ward_name}>{const_name}>{county_name} not found."
                # )
                continue

            verified_count += 1
            # update the polling center with the pin location
            point_coordinates = polling_center["geometry"]["coordinates"]
            point = Point(point_coordinates)

            if not polling_center_obj.is_verified:
                try:
                    polling_center_obj.pin_location = point
                    polling_center_obj.is_verified = True  # this is a temporary fix just to filter the saved centers, it wil be removed later once a better solution is found.
                    # Also, the function of the is_verified is to actually have the community verify the location and name etc of teh station and verify the streams. So this will def be removed later
                    polling_center_obj.save()
                except Exception as e:
                    print(f"Error saving polling center {polling_center_obj}: {e}")
                    continue

        print(
            f"Total Polling Centers: {count}, Verified Polling Centers: {verified_count}: {round((verified_count/count*100),2)}%"
        )
        return 0


def save_polling_stations_pin_locations(geojson_file_path):
    # read geojson file
    with open(geojson_file_path, "r") as f:
        # assign data to a variable
        data = f.read()
        # convert data to a json object
        data = json.loads(data)

        total = 0
        verified = 0
        multiple = 0
        not_found = 0
        no_ward = 0
        solved_multiple = 0
        multiple_poll = 0
        not_found_poll = 0
        found_poll = 0
        solved_stations = 0
        # iterate through all features
        for feature in tqdm(data["features"], desc="processing schools"):
            total += 1

            try:
                ward_name = feature["properties"]["Ward"].strip()

            except:
                ward_name = None

            school_name = feature["properties"]["SCHOOL_NAME"].upper().strip()

            try:
                county = feature["properties"]["County"].strip()
            except:
                print(f" {county}- {school_name}: county is not found")
                county = None

            if not ward_name:
                print("skipping as there is no ward")
                no_ward += 1
                continue

            ward_qs = Ward.objects.filter(
                name__icontains=ward_name,
            )

            if county:
                try:
                    ward_qs = ward_qs.filter(
                        constituency__county__name__icontains=county,
                    )
                except:
                    continue

            if ward_qs.count() == 0:
                not_found += 1

                continue

            if ward_qs.count() > 1:
                multiple += 1

                try:
                    ward_obj = ward_qs.get(name=ward_name)
                    # print(f"{ward_qs} <<< solved to >> {ward_obj}")
                    solved_multiple += 1
                except:
                    # print(f"{ward_qs} <<< unsolvable wards")
                    continue

            if ward_qs.count() == 1:
                # print("holy grail")
                ward_obj = ward_qs.first()
                verified += 1

            # get polling station if exists
            # NOTE: the schools.geojson file has stripped away the names primary and secondary and they are part of the metadata, wo we can extract the school level and add to the name to make match

            school_level = feature["properties"]["LEVEL"].upper().strip()

            if school_level:
                school_name_concat = school_name + " " + school_level + " SCHOOL"
            else:
                school_name_concat = school_name

            polling_center_qs = PollingCenter.objects.filter(
                name__icontains=school_name_concat, ward=ward_obj
            )

            if polling_center_qs.count() == 0:
                not_found_poll += 1
                continue

            if polling_center_qs.count() > 1:
                multiple_poll += 1
                print(
                    f"{polling_center_qs} found many times for query: {school_name_concat}"
                )

                try:
                    polling_station_obj = polling_center_qs.get(name=school_name_concat)
                    solved_stations += 1
                    # print(
                    #     f"{polling_center_qs} solved to >>>>>>>>>>>>>>>>>> {polling_station_obj} using {school_name_concat}"
                    # )
                except:
                    pass

            if polling_center_qs.count() == 1:
                found_poll += 1
                polling_station_obj = polling_center_qs.first()

            # update the polling station with the pin location
            if not polling_station_obj.is_verified:
                point_coordinates = feature["geometry"]["coordinates"]
                point = Point(point_coordinates)
                try:
                    polling_station_obj.pin_location = point
                    polling_station_obj.is_verified = True  # this is a temporary fix just to filter the saved centers, it wil be removed later once a better solution is found.
                    # Also, the function of the is_verified is to actually have the community verify the location and name etc of teh station and verify the streams. So this will def be removed later
                    polling_station_obj.save()
                except Exception as e:
                    print(f"Error saving polling station {polling_station_obj}: {e}")
                    continue

        print(
            f"  verified {verified} | duplicates {multiple} | solved multiple {solved_multiple}| not found {not_found} | no ward: {no_ward} = { ((verified + solved_multiple)/total)*100}%"
        )

        print(
            f"found poll {found_poll} | multiple poll {multiple_poll} | not found: {not_found_poll}: solved stations {solved_stations} : { (found_poll/total)*100 }  %"
        )
        return 0


if __name__ == "__main__":
    file_path = os.path.dirname(__file__)

    geojson_file_path = os.path.join(file_path, "polling_centers.geojson")
    save_polling_center_pin_locations(geojson_file_path)

    schools_geojson_path = os.path.join(file_path, "schools.geojson")
    save_polling_stations_pin_locations(schools_geojson_path)
