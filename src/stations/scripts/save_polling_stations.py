import json
import os
import sys

from django.contrib.gis.geos import Point

from tqdm import tqdm

# Set the settings module
# Add the root project directory to Python path
CURRENT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
sys.path.append(PROJECT_ROOT)

# print("PROJECT_ROOT:", PROJECT_ROOT)
# print("CURRENT_DIR:", CURRENT_DIR)


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "CommunityTally.settings")
import django

django.setup()

# TODO: import the models and other project django-related files here.
from stations.models import PollingCenter, PollingStation, Ward

"""
# Polling stations
import os
from stations.scripts.save_polling_stations import save_polling_stations_and_streams

src_dir = os.getcwd()
geojson_file = os.path.join(
    src_dir, "stations/scripts", "cleaned_polling_station_data.json"
)
save_polling_stations_and_streams(geojson_file)
"""


def save_polling_stations_and_streams(geojson_file_path):
    # read geojson file
    with open(geojson_file_path, "r") as f:
        data = json.load(f)

        # Traverse the nested structure
        for county in data:
            # print(f"County: {county['county_name']}")

            for constituency in tqdm(
                county["constituencies"], desc=f"Processing for {county['county_name']}"
            ):
                # print(f"    -Constituency: {constituency["constituency_name"]}")

                for ward in constituency["wards"]:
                    # print(f"        -Ward: {ward["ward_name"]}")

                    ward_code = ward["ward_code"]
                    ward_name = ward["ward_name"]

                    ward_code_int = int(ward_code)

                    try:
                        ward_obj = Ward.objects.get(
                            number=ward_code_int,
                        )
                    except Exception as e:
                        print(
                            f"        Ward with code {ward_code_int}-{ward_name}-{constituency['constituency_name']}-{county['county_name']} not found. Error: {e}"
                        )
                        continue

                    for reg_center in ward["reg_centers"]:
                        reg_center_code = reg_center["reg_centre_code"]
                        reg_center_name = reg_center["reg_centre_name"]

                        try:
                            reg_center_obj = PollingCenter.objects.get(
                                code=reg_center_code,
                                ward=ward_obj,
                            )
                        except Exception as e:
                            reg_center_obj = PollingCenter.objects.create(
                                code=reg_center_code,
                                name=reg_center_name,
                                ward=ward_obj,
                            )
                            continue

                        for polling_station in reg_center["polling_station_streams"]:
                            stream_code = polling_station["stream_code"]
                            registered_voters = polling_station["registered_voters"]

                            try:
                                polling_station_obj = PollingStation.objects.get(
                                    code=stream_code, polling_center=reg_center_obj
                                )

                            except Exception as e:
                                PollingStation.objects.create(
                                    code=stream_code,
                                    polling_center=reg_center_obj,
                                    registered_voters=registered_voters,
                                )

                            continue

        return 0


def save_polling_stations_pin_locations(geojson_file_path):
    # read geojson file
    with open(geojson_file_path, "r") as f:
        # assign data to a variable
        data = f.read()
        # convert data to a json object
        data = json.loads(data)
        # iterate through all features
        for feature in data["features"]:
            try:
                ward_name = feature["properties"]["Ward"].strip()

            except:
                ward_name = None

            school_name = feature["properties"]["SCHOOL_NAME"].strip()

            try:
                school_level = feature["properties"]["LEVEL"].lower().strip()
            except:
                school_level = None

            try:
                school_status = feature["properties"]["Status"].lower().strip()
            except:
                school_status = None

            print(f"======={school_name}=======")

            try:
                ward = Ward.objects.get(name__iexact=ward_name)
                constituency = ward.constituency
            except Exception as e:
                print(
                    feature["properties"]["Ward"],
                    "ward not  found",
                    school_name,
                    e,
                )
                continue

            # get ward if exists
            try:
                school_obj = School.objects.get(name__iexact=school_name)
            except Exception as e:
                # print(school_name, "are we here yet")
                # print("ward does not exist")

                school_obj = School.objects.create(
                    name=school_name,
                    constituency=constituency,
                    level=school_level,
                    status=school_status,
                )

            point_coordinates = feature["geometry"]["coordinates"]
            # print(type(polygon_array), "type(polygon_array)")
            # print(polygon_array, "polygon_array")
            if (
                point_coordinates[0] == 0.0
                or point_coordinates[1] == 0.0
                or constituency == None
            ):
                is_verified = False
            else:
                is_verified = True

            point = Point(point_coordinates)
            # print(multipolygon, "multipolygon")

            try:
                school_obj.pin_location = point
                school_obj.is_verified = is_verified
                school_obj.level = school_level
                school_obj.status = school_status

                school_obj.save()
            except Exception as e:
                print(e)

        return 0


if __name__ == "__main__":
    # path to the geojson file
    file_path = os.path.dirname(__file__)
    # get the current working directory

    geojson_file_path = os.path.join(file_path, "cleaned_polling_station_data.json")
    # print(geojson_file_path, "geojson_file_path")
    # save polling stations and streams
    save_polling_stations_and_streams(geojson_file_path)
    # save polling stations pin locations
    # save_polling_stations_pin_locations(geojson_file_path)
