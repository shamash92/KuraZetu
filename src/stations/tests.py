from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point, Polygon
from django.urls import reverse

import pytest
from rest_framework.test import APIClient

from stations.models import (
    Constituency,
    County,
    PollingCenter,
    PollingCenterVerification,
    PollingStation,
    Ward,
)

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


def _ward():
    county = County.objects.create(name="Test County", number=1)
    constituency = Constituency.objects.create(
        name="Test Constituency", county=county, number=101
    )
    return Ward.objects.create(
        name="Test Ward",
        constituency=constituency,
        number=1001,
        boundary=Polygon(((36, 0), (37, 0), (37, 1), (36, 1), (36, 0))),
    )


def _client_for(polling_center):
    user = User.objects.create_user(phone_number="+254700000001", password="pw")
    user.polling_center = polling_center
    user.save()
    client = APIClient()
    client.force_authenticate(user)
    return client


@pytest.mark.django_db
def test_level_list_orders_own_then_pinned_then_unlocated_then_verified():
    ward = _ward()
    verified = PollingCenter.objects.create(
        name="Verified", code="001", ward=ward, is_verified=True
    )
    unpinned = PollingCenter.objects.create(name="Unpinned", code="002", ward=ward)
    zero = PollingCenter.objects.create(
        name="Zero", code="003", ward=ward, pin_location=Point(0, 0)
    )
    pinned = PollingCenter.objects.create(
        name="Pinned", code="005", ward=ward, pin_location=Point(36.5, 0.5)
    )
    own = PollingCenter.objects.create(name="Own", code="006", ward=ward)
    PollingCenterVerification.objects.create(
        polling_center=unpinned, pin_location=Point(36.5, 0.5), ai_suggestion=True
    )

    response = _client_for(own).get(reverse("level_polling_centers_api", args=["ward"]))

    assert response.status_code == 200
    results = response.data["results"]
    assert [c["id"] for c in results] == [
        own.id,
        pinned.id,
        unpinned.id,
        zero.id,
        verified.id,
    ]
    assert results[2]["suggestion_count"] == 1
    assert response.data["total_stations_count"] == 5


@pytest.mark.django_db
def test_level_list_needs_the_users_polling_center():
    response = _client_for(None).get(
        reverse("level_polling_centers_api", args=["ward"])
    )

    assert response.status_code == 400


@pytest.mark.django_db
def test_round_shows_ai_suggestions_for_a_center_without_a_pin():
    center = PollingCenter.objects.create(
        name="Takaungu", code="012", ward=_ward(), pin_location=Point(0, 0)
    )
    PollingCenterVerification.objects.create(
        polling_center=center,
        pin_location=Point(36.5, 0.5),
        ai_suggestion=True,
        ai_model="test-model",
    )

    response = _client_for(center).get(
        reverse("polling_center_round_api", args=[center.id])
    )

    assert response.status_code == 200
    assert response.data["data"]["properties"]["is_unlocated"] is True
    suggestions = response.data["partially_verified"]["features"]
    assert len(suggestions) == 1
    assert suggestions[0]["properties"]["ai_model"] == "test-model"


@pytest.mark.django_db
@pytest.mark.parametrize(
    "url_name, args",
    [("level_polling_centers_api", ["ward"]), ("polling_center_round_api", [1])],
)
def test_level_play_needs_login(url_name, args):
    response = APIClient().get(reverse(url_name, args=args))

    assert response.status_code in (401, 403)


@pytest.mark.django_db
def test_round_already_verified_still_shows_other_suggestions():
    center = PollingCenter.objects.create(name="Takaungu", code="012", ward=_ward())
    client = _client_for(center)
    user = User.objects.get(polling_center=center)
    PollingCenterVerification.objects.create(
        polling_center=center, pin_location=Point(36.5, 0.5), verified_by=user
    )
    other = PollingCenterVerification.objects.create(
        polling_center=center, pin_location=Point(36.5002, 0.5), ai_suggestion=True
    )

    response = client.get(reverse("polling_center_round_api", args=[center.id]))

    assert response.data["error"] == "You have already verified this polling center"
    suggestions = response.data["partially_verified"]["features"]
    assert [s["id"] for s in suggestions] == [other.id]
