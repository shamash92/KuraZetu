from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point, Polygon

import pytest

from stations.models import Constituency, County, PollingCenter, PollingStation, Ward

User = get_user_model()


@pytest.mark.django_db
def test_county_creation():
    """Test the creation of a County instance."""

    boundary_polygon = Polygon(((0, 0), (1, 1), (1, 0), (0, 0)))

    county = County.objects.create(
        name="Test County",
        number=1,
        boundary=boundary_polygon,
        is_diaspora=False,
        is_prisons=False,
    )
    assert county.name == "Test County"
    assert county.slug == "test-county"
    assert county.number == 1
    assert county.boundary is not None
    assert not county.is_diaspora
    assert not county.is_prisons


@pytest.mark.django_db
def test_constituency_creation():
    county = County.objects.create(
        name="Test County",
        number=1,
        boundary=Polygon(((0, 0), (1, 1), (1, 0), (0, 0))),
    )
    constituency = Constituency.objects.create(
        name="Test Constituency",
        county=county,
        boundary=Polygon(((0, 0), (1, 1), (1, 0), (0, 0))),
        number=101,
    )
    assert constituency.name == "Test Constituency"
    assert constituency.county == county
    assert constituency.number == 101
    assert constituency.boundary is not None


@pytest.mark.django_db
def test_ward_creation():
    county = County.objects.create(
        name="Test County",
        number=1,
        boundary=Polygon(((0, 0), (1, 1), (1, 0), (0, 0))),
    )
    constituency = Constituency.objects.create(
        name="Test Constituency",
        county=county,
        boundary=Polygon(((0, 0), (1, 1), (1, 0), (0, 0))),
        number=101,
    )
    ward = Ward.objects.create(
        name="Test Ward",
        constituency=constituency,
        boundary=Polygon(((0, 0), (1, 1), (1, 0), (0, 0))),
        number=1001,
    )
    assert ward.name == "Test Ward"
    assert ward.constituency == constituency
    assert ward.number == 1001
    assert ward.boundary is not None


@pytest.mark.django_db
def test_polling_center_creation():
    county = County.objects.create(
        name="Test County",
        number=1,
        boundary=Polygon(((0, 0), (1, 1), (1, 0), (0, 0))),
    )
    constituency = Constituency.objects.create(
        name="Test Constituency",
        county=county,
        boundary=Polygon(((0, 0), (1, 1), (1, 0), (0, 0))),
        number=101,
    )
    ward = Ward.objects.create(
        name="Test Ward",
        constituency=constituency,
        boundary=Polygon(((0, 0), (1, 1), (1, 0), (0, 0))),
        number=1001,
    )
    polling_center = PollingCenter.objects.create(
        code="PC001",
        name="Test Polling Center",
        ward=ward,
        number_of_streams=3,
        pin_location=Point(0.5, 0.5),
        is_verified=True,
    )
    assert polling_center.code == "PC001"
    assert polling_center.name == "Test Polling Center"
    assert polling_center.ward == ward
    assert polling_center.number_of_streams == 3
    assert polling_center.pin_location is not None
    assert polling_center.is_verified


@pytest.mark.django_db
def test_polling_station_creation():
    county = County.objects.create(
        name="Test County",
        number=1,
        boundary=Polygon(((0, 0), (1, 1), (1, 0), (0, 0))),
    )
    constituency = Constituency.objects.create(
        name="Test Constituency",
        county=county,
        boundary=Polygon(((0, 0), (1, 1), (1, 0), (0, 0))),
        number=101,
    )
    ward = Ward.objects.create(
        name="Test Ward",
        constituency=constituency,
        boundary=Polygon(((0, 0), (1, 1), (1, 0), (0, 0))),
        number=1001,
    )
    polling_center = PollingCenter.objects.create(
        code="PC001",
        name="Test Polling Center",
        ward=ward,
        number_of_streams=3,
        pin_location=Point(0.5, 0.5),
        is_verified=True,
    )
    polling_station = PollingStation.objects.create(
        polling_center=polling_center,
        stream_number=1,
        code="PS001",
        registered_voters=500,
        is_verified=True,
    )
    assert polling_station.polling_center == polling_center
    assert polling_station.stream_number == 1
    assert polling_station.code == "PS001"
    assert polling_station.registered_voters == 500
    assert polling_station.is_verified


def _polling_center():
    county = County.objects.create(
        name="Test County",
        number=1,
        boundary=Polygon(((0, 0), (1, 1), (1, 0), (0, 0))),
    )
    constituency = Constituency.objects.create(
        name="Test Constituency",
        county=county,
        boundary=Polygon(((0, 0), (1, 1), (1, 0), (0, 0))),
        number=101,
    )
    ward = Ward.objects.create(
        name="Test Ward",
        constituency=constituency,
        boundary=Polygon(((0, 0), (1, 1), (1, 0), (0, 0))),
        number=1001,
    )
    return PollingCenter.objects.create(
        code="PC001",
        name="Test Polling Center",
        ward=ward,
        pin_location=Point(0.5, 0.5),
    )


@pytest.mark.django_db
def test_polling_center_update_does_not_refetch(django_assert_num_queries):
    """save() diffs against the values captured at load time, not a fresh row."""

    polling_center = _polling_center()
    polling_center = PollingCenter.objects.get(pk=polling_center.pk)
    polling_center.name = "Renamed Polling Center"

    with django_assert_num_queries(1):  # the UPDATE only
        polling_center.save()

    polling_center.refresh_from_db()
    assert polling_center.name == "Renamed Polling Center"


@pytest.mark.django_db
def test_polling_center_pin_change_regenerates_boundary():
    polling_center = _polling_center()
    polling_center = PollingCenter.objects.get(pk=polling_center.pk)
    old_boundary = polling_center.boundary

    polling_center.pin_location = Point(5, 5)
    polling_center.save()

    polling_center.refresh_from_db()
    assert polling_center.boundary != old_boundary
    assert polling_center.boundary.centroid.equals_exact(Point(5, 5), tolerance=0.001)


@pytest.mark.django_db
def test_polling_center_boundary_change_updates_pin():
    polling_center = _polling_center()
    polling_center = PollingCenter.objects.get(pk=polling_center.pk)

    boundary = Polygon(((4, 4), (4, 6), (6, 6), (6, 4), (4, 4)))
    polling_center.boundary = boundary
    polling_center.save()

    polling_center.refresh_from_db()
    assert polling_center.boundary.equals(boundary)
    assert polling_center.pin_location.equals(boundary.centroid)


@pytest.mark.django_db
def test_polling_center_unchanged_save_keeps_boundary():
    polling_center = _polling_center()
    polling_center = PollingCenter.objects.get(pk=polling_center.pk)
    boundary = polling_center.boundary

    polling_center.save()

    polling_center.refresh_from_db()
    assert polling_center.boundary.equals(boundary)
