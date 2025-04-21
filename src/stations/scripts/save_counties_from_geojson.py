import json

from django.contrib.gis.geos import MultiPolygon, Polygon

from stations.models import Constituency, County, Ward


def save_counties_from_geojson_file(geojson_file_path):
    # check if diaspora county exists , else create it
    try:
        diaspora_county = County.objects.get(name="Diaspora")
    except County.DoesNotExist:
        diaspora_county = County.objects.create(
            name="Diaspora", number=48, is_diaspora=True
        )

    # read geojson file
    with open(geojson_file_path, "r") as f:
        # assign data to a variable
        data = f.read()
        # convert data to a json object
        data = json.loads(data)
        # iterate through all features
        for feature in data["features"]:
            try:
                county_name = feature["properties"]["COUNTY"]
            except:
                print("\033[91mcounty name not found\033[0m")
                continue
            try:
                county_number = feature["properties"]["COUNTY_ID"]
            except:
                print("\033[91mcounty number not found\033[0m")
                continue

            # get county if exists
            try:
                county = County.objects.get(name__icontains=county_name)
            except County.DoesNotExist:
                print("county does not exist")
                county = County.objects.create(name=county_name, number=county_number)

            if county.name.lower() == "mombasa":
                # Mombasa has a multi polygon
                # get the multipolygon

                from django.contrib.gis.geos import GEOSGeometry

                # If it's a dict, convert to string
                geojson_dict = feature["geometry"]

                geojson_str = json.dumps(geojson_dict)

                # Create geometry
                geometry = GEOSGeometry(geojson_str, srid=4326)  # Use 4326 for WGS84

                # Save to model
                mombasa_county_obj = County.objects.get(number=1)
                mombasa_county_obj.multi_boundary = geometry
                mombasa_county_obj.save()
                print("successfully saved mombasa county")
            else:
                polygon_array = feature["geometry"]["coordinates"][0]

                try:
                    multipolygon = Polygon(polygon_array)
                except Exception as e:
                    print(f"=========={county_name}=======")
                    print(f"=========={e}=======")
                    continue

                try:
                    county.boundary = multipolygon
                    county.save()
                except Exception as e:
                    print(e)

        return 0


def save_constituencies_from_geojson_file(geojson_file_path):
    # check if diaspora county exists , else create it
    try:
        diaspora_constituency_obj = Constituency.objects.get(name="Diaspora")
        county = County.objects.get(name="Diaspora")
    except Constituency.DoesNotExist:
        diaspora_constituency_obj = Constituency.objects.create(
            name="Diaspora",
            number=291,
            is_diaspora=True,
            county=County.objects.get(name="Diaspora"),
        )

    # read geojson file
    with open(geojson_file_path, "r") as f:
        # assign data to a variable
        data = f.read()
        # convert data to a json object
        data = json.loads(data)
        # iterate through all features
        for feature in data["features"]:
            properties = feature["properties"]
            try:
                constituency_name = properties["CONSTITUENCY"].strip().replace("/", "-")
                print(f"\033[92mworking on {constituency_name}\033[0m")
                county_code = properties["COUNTY_CODE"]
                constituency_code = properties["CONST_CODE"]
            except:
                continue

            try:
                county_obj = County.objects.get(number=county_code)
            except County.DoesNotExist:
                print("\033[91mcounty does not exist\033[0m")
                continue

            if "constituency" in constituency_name.lower():
                constituency_name = constituency_name.replace(
                    "Constituency", ""
                ).strip()

            try:
                constituency_obj = Constituency.objects.get(number=constituency_code)
            except:
                constituency_obj = Constituency.objects.create(
                    name=constituency_name, county=county_obj, number=constituency_code
                )

            try:
                polygon_array = feature["geometry"]["coordinates"][0]
                multipolygon = Polygon(polygon_array)

                try:
                    constituency_obj.boundary = multipolygon
                    constituency_obj.save()
                except Exception as e:
                    print(e)
            except Exception as e:
                print(constituency_obj, e, "<<< error")

        return 0


def save_wards_from_geojson_file(geojson_file_path):
    diaspora_data = [
        {"name": "Tanzania", "code": "5000"},
        {"name": "Uganda", "code": "5001"},
        {"name": "Rwanda", "code": "5002"},
        {"name": "Burundi", "code": "5003"},
        {"name": "South Africa", "code": "5004"},
        {"name": "South Sudan", "code": "5005"},
        {"name": "Germany", "code": "5006"},
        {"name": "United Kingdom", "code": "5007"},
        {"name": "Qatar", "code": "5008"},
        {"name": "United Arab Emirates", "code": "5009"},
        {"name": "Canada", "code": "5010"},
        {"name": "United States of America", "code": "5011"},
    ]

    for data in diaspora_data:
        try:
            ward_obj = Ward.objects.get(number=int(data["code"]))
            constituency = Constituency.objects.get(name="Diaspora")
        except Ward.DoesNotExist:
            ward_obj = Ward.objects.create(
                name=data["name"],
                number=int(data["code"]),
                constituency=Constituency.objects.get(name="Diaspora"),
            )
    with open(geojson_file_path, "r") as f:
        data = f.read()
        data = json.loads(data)
        for feature in data["features"]:
            properties = feature["properties"]
            ward_name = properties["ward"].strip().replace("/", "-")
            ward_code = properties["wardcode"]
            constituency_name = properties["const"].strip().replace("/", "-")
            constituency_code = properties["constcode"]

            print(f"\033[92mworking on {ward_name}\033[0m")

            try:
                constituency_obj = Constituency.objects.get(number=constituency_code)
            except Exception as e:
                print(
                    "Ward ID",
                    feature["properties"]["id"],
                    "constituency not be found",
                    constituency_name,
                    constituency_code,
                    e,
                )
                continue

            # get ward if exists

            try:
                ward = Ward.objects.get(number=ward_code, constituency=constituency_obj)
            except Exception as e:
                ward = Ward.objects.create(
                    name=ward_name, constituency=constituency_obj, number=ward_code
                )

            try:
                polygon_array = feature["geometry"]["coordinates"][0]
                multipolygon = Polygon(polygon_array)

                try:
                    ward.boundary = multipolygon
                    ward.save()
                except Exception as e:
                    print(e)
            except:
                pass

        return 0


"""
# Counties
import os
from stations.scripts.save_counties_from_geojson import save_counties_from_geojson_file
src_dir = os.getcwd()
geojson_file = os.path.join(src_dir,"stations/scripts", "counties.geojson")
save_counties_from_geojson_file(geojson_file)

# Constituencies
import os
from stations.scripts.save_counties_from_geojson  import save_constituencies_from_geojson_file
src_dir = os.getcwd()
geojson_file = os.path.join(src_dir,"stations/scripts", "constituencies.geojson")
save_constituencies_from_geojson_file(geojson_file)

# Wards
import os
from stations.scripts.save_counties_from_geojson  import save_wards_from_geojson_file
src_dir = os.getcwd()
geojson_file = os.path.join(src_dir,"stations/scripts", "wards.geojson")
save_wards_from_geojson_file(geojson_file)

"""
