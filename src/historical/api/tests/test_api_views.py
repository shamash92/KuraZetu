import pytest
from django.urls import reverse
from rest_framework import status

from historical.models import (
    PresidentialResults,
    GovernorResults,
    SenatorResults,
    WomenRepResults,
    MPResults,
    MCAResults,
    Aspirant2017,
)
from stations.models import County, Constituency, Ward
from results.models import Party


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient

    return APIClient()


@pytest.fixture
def test_data(db):
    party = Party.objects.create(name="Test Party", short_name="TP")
    county = County.objects.create(name="Test County", number=1)
    constituency = Constituency.objects.create(
        name="Test Constituency", number=1, county=county
    )
    ward = Ward.objects.create(name="Test Ward", number=1, constituency=constituency)

    aspirant = Aspirant2017.objects.create(
        first_name="John",
        last_name="Doe",
        surname="Smith",
        level="president",
        party=party,
        year=2017,
    )

    return {
        "party": party,
        "county": county,
        "constituency": constituency,
        "ward": ward,
        "aspirant": aspirant,
    }


def test_presidential_results_by_county_and_year(api_client, test_data):
    # Create test presidential result
    PresidentialResults.objects.create(
        county=test_data["county"],
        aspirant=test_data["aspirant"],
        registered_voters=1000,
        aspirant_votes=500,
        total_valid_votes=800,
        rejected_ballots=50,
    )

    url = reverse(
        "presidential-results-by-county", kwargs={"year": 2017, "county_number": 1}
    )
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]["county_number"] == 1
    assert response.data[0]["aspirant"] == "John Doe Smith"
    assert response.data[0]["aspirant_votes"] == 500


def test_presidential_results_empty(api_client, test_data):
    url = reverse(
        "presidential-results-by-county", kwargs={"year": 2017, "county_number": 999}
    )
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 0


def test_governor_results_by_county_and_year(api_client, test_data):
    # Create test governor result
    GovernorResults.objects.create(
        county=test_data["county"],
        aspirant=test_data["aspirant"],
        running_mate=test_data["aspirant"],  # Same aspirant for simplicity
        aspirant_votes=300,
    )

    url = reverse(
        "governor-results-by-county", kwargs={"year": 2017, "county_number": 1}
    )
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]["county_number"] == 1
    assert response.data[0]["aspirant_votes"] == 300


def test_senator_results_by_county_and_year(api_client, test_data):
    # Create test senator result
    SenatorResults.objects.create(
        county=test_data["county"], aspirant=test_data["aspirant"], aspirant_votes=200
    )

    url = reverse(
        "senator-results-by-county", kwargs={"year": 2017, "county_number": 1}
    )
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]["county_number"] == 1
    assert response.data[0]["aspirant_votes"] == 200


def test_women_rep_results_by_county_and_year(api_client, test_data):
    # Create test women rep result
    WomenRepResults.objects.create(
        county=test_data["county"], aspirant=test_data["aspirant"], aspirant_votes=150
    )

    url = reverse(
        "women-rep-results-by-county", kwargs={"year": 2017, "county_number": 1}
    )
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]["county_number"] == 1
    assert response.data[0]["aspirant_votes"] == 150


def test_mp_results_by_constituency_and_year(api_client, test_data):
    # Create test MP result
    MPResults.objects.create(
        constituency=test_data["constituency"],
        aspirant=test_data["aspirant"],
        aspirant_votes=100,
    )

    url = reverse(
        "mp-results-by-constituency", kwargs={"year": 2017, "constituency_number": 1}
    )
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]["constituency_number"] == 1
    assert response.data[0]["aspirant_votes"] == 100


def test_mca_results_by_ward_and_year(api_client, test_data):
    # Create test MCA result
    MCAResults.objects.create(
        ward=test_data["ward"], aspirant=test_data["aspirant"], aspirant_votes=50
    )

    url = reverse("mca-results-by-ward", kwargs={"year": 2017, "ward_number": 1})
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]["ward_number"] == 1
    assert response.data[0]["aspirant_votes"] == 50


def test_different_year_filtering(api_client, test_data):
    # Create result for 2017
    PresidentialResults.objects.create(
        county=test_data["county"],
        aspirant=test_data["aspirant"],
        registered_voters=1000,
        aspirant_votes=500,
        total_valid_votes=800,
        rejected_ballots=50,
    )

    # Query for 2022
    url = reverse(
        "presidential-results-by-county", kwargs={"year": 2022, "county_number": 1}
    )
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 0
