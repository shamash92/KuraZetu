import json
import runpy

from django.contrib.gis.geos import Point, Polygon

import pytest

from stations.models import Constituency, County, PollingCenter, Ward
from stations.scripts.save_polling_center_pin_locations import (
    save_polling_center_pin_locations,
    save_polling_stations_pin_locations,
)


@pytest.mark.django_db
@pytest.mark.parametrize("source", ["boundaries", "schools"])
def test_import_leaves_unknown_locations_empty_and_reports_missing_pins(
    tmp_path, source
):
    county = County.objects.create(name="County", number=1)
    constituency = Constituency.objects.create(
        name="Constituency", number=1, county=county
    )
    ward = Ward.objects.create(
        name="Ward",
        number=1,
        constituency=constituency,
        boundary=Polygon(((33, -2), (36, -2), (36, 2), (33, 2), (33, -2))),
    )
    coordinates = [[0, 0], [35, 0], [35, 1]]
    centres = []
    features = []
    for index, location in enumerate(coordinates):
        name = f"CENTRE {index}"
        centres.append(
            PollingCenter.objects.create(code=str(index), name=name, ward=ward)
        )
        properties = (
            {
                "county": county.name,
                "constituency": constituency.name,
                "ward": ward.name,
                "name": name,
            }
            if source == "boundaries"
            else {
                "County": county.name,
                "Ward": ward.name,
                "SCHOOL_NAME": name,
                "LEVEL": "",
            }
        )
        features.append(
            {
                "type": "Feature",
                "properties": properties,
                "geometry": {"type": "Point", "coordinates": location},
            }
        )
    geojson = tmp_path / "locations.geojson"
    geojson.write_text(json.dumps({"type": "FeatureCollection", "features": features}))
    load = (
        save_polling_center_pin_locations
        if source == "boundaries"
        else save_polling_stations_pin_locations
    )

    load(geojson)
    # Repeating an import must also leave the unknown centre unverified.
    load(geojson)

    for centre, location in zip(centres, coordinates):
        centre.refresh_from_db()
        if location == [0, 0]:
            assert centre.pin_location is None
            assert centre.boundary is None
            assert not centre.is_verified
        else:
            assert centre.pin_location == Point(location, srid=4326)
            assert centre.boundary is not None
            assert centre.is_verified

    runpy.run_module("stations.scripts.polling_center_pin_errors_parse")

    for centre in centres:
        centre.refresh_from_db()
    assert centres[0].pin_location_error == "Pin location not registered in database"
    assert centres[0].pin_location is None
    assert centres[0].boundary is None
    assert not centres[0].is_verified
    assert all(centre.pin_location_error is None for centre in centres[1:])
