from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

import pytest
from rest_framework.test import APIClient

from results.models import (
    Aspirant,
    Party,
    PollingStationGovernorResults,
    PollingStationMCAResults,
    PollingStationMpResults,
    PollingStationPresidentialExtras,
    PollingStationPresidentialResults,
    PollingStationSenatorResults,
    PollingStationWomenRepResults,
)
from stations.models import Constituency, County, PollingCenter, PollingStation, Ward

User = get_user_model()


pytestmark = pytest.mark.django_db


# create fixtures for party, aspirant, polling station, and results


@pytest.fixture
def user():
    return User.objects.create_user(
        phone_number="+254700000000", password="testpassword"
    )


@pytest.fixture
def party():
    return Party.objects.create(
        name="Test Party",
        short_name="TP",
        party_colour_hex="#123456",
    )


@pytest.fixture
def aspirant(party):
    return Aspirant.objects.create(
        first_name="John",
        last_name="Doe",
        party=party,
        level="governor",
    )


@pytest.fixture
def county():
    return County.objects.create(
        name="Test County",
        number=1,
    )


@pytest.fixture
def constituency(county):
    return Constituency.objects.create(
        name="Test Constituency",
        county=county,
        number=1,
    )


@pytest.fixture
def ward(constituency):
    return Ward.objects.create(
        name="Test Ward",
        constituency=constituency,
        number=1,
    )


@pytest.fixture
def polling_center(ward):
    return PollingCenter.objects.create(
        name="Test Polling Center",
        code="099",
        ward=ward,
    )


@pytest.fixture
def polling_station(polling_center):
    return PollingStation.objects.create(
        polling_center=polling_center,
        code="989898901",
        registered_voters=1000,
    )


class TestPartyModel:
    def test_create_party(self):
        party = Party.objects.create(
            name="Test Party",
            short_name="TP",
            party_colour_hex="#123456",
        )
        assert party.name == "Test Party"
        assert party.short_name == "TP"
        assert party.party_colour_hex == "#123456"

    def test_short_name_uppercase(self):
        party = Party.objects.create(
            name="Lowercase Party",
            short_name="lp",
        )
        assert party.short_name == "LP"

    def test_str_representation(self):
        party = Party.objects.create(name="Test Party", short_name="TP")
        assert str(party) == "Test Party"


class TestAspirantModel:
    def test_create_aspirant(
        self,
        user,
        party,
        county,
    ):
        aspirant = Aspirant.objects.create(
            first_name="John",
            last_name="Doe",
            party=party,
            level="governor",
            county=county,
            verified_by=user,
        )
        assert aspirant.first_name == "John"
        assert aspirant.last_name == "Doe"
        assert aspirant.party == party
        assert aspirant.level == "governor"
        assert aspirant.county == county

    def test_clean_governor_with_invalid_county(self, party):
        aspirant = Aspirant(
            first_name="John",
            last_name="Doe",
            party=party,
            level="governor",
        )
        with pytest.raises(
            ValidationError, match="Governor must be associated with a county"
        ):
            aspirant.clean()

    def test_clean_president_with_invalid_location(self, party, county):
        aspirant = Aspirant(
            first_name="John",
            last_name="Doe",
            party=party,
            level="president",
            county=county,
        )
        with pytest.raises(
            ValidationError, match="President should not be associated with any county"
        ):
            aspirant.clean()

    def test_clean_women_rep_with_invalid_location(self, party, ward):
        aspirant = Aspirant(
            first_name="John",
            last_name="Doe",
            party=party,
            level="women_rep",
            ward=ward,
        )
        with pytest.raises(
            ValidationError,
            match="Women Representative must be associated with a county only but not a constituency or ward.",
        ):
            aspirant.clean()

    def test_clean_mp_with_invalid_location(self, party, county):
        aspirant = Aspirant(
            first_name="John",
            last_name="Doe",
            party=party,
            level="mp",
            county=county,
        )
        with pytest.raises(
            ValidationError,
            match="Member of Parliament must be associated with a constituency but not a county only or ward",
        ):
            aspirant.clean()

    def test_clean_mca_with_invalid_location(self, party, county, constituency):
        aspirant = Aspirant(
            first_name="John",
            last_name="Doe",
            party=party,
            level="mca",
            county=county,
        )

        aspirant2 = Aspirant(
            first_name="Jane",
            last_name="Doe",
            party=party,
            level="mca",
            constituency=constituency,
        )

        with pytest.raises(
            ValidationError,
            match="Member of County Assembly must be associated with a ward only",
        ):
            aspirant.clean()

        with pytest.raises(
            ValidationError,
            match="Member of County Assembly must be associated with a ward only",
        ):
            aspirant2.clean()

    def test_str_representation(self, party, county):
        aspirant = Aspirant.objects.create(
            first_name="John",
            last_name="Doe",
            party=party,
            level="governor",
            county=county,
        )
        assert str(aspirant) == "governor - John Doe - Test Party"


class TestPollingStationGovernorResultsModel:
    def test_create_governor_results(self):
        party = Party.objects.create(name="Test Party", short_name="TP")
        county = County.objects.create(name="Test County", number=1)
        constituency = Constituency.objects.create(
            name="Test Constituency", county=county, number=1
        )
        ward = Ward.objects.create(
            name="Test Ward", constituency=constituency, number=1
        )
        polling_center = PollingCenter.objects.create(
            name="Test Polling Center",
            code="099",
            ward=ward,
        )
        polling_station = PollingStation.objects.create(
            polling_center=polling_center,
            code="989898901",
            registered_voters=1000,
        )
        aspirant = Aspirant.objects.create(
            first_name="John",
            last_name="Doe",
            party=party,
            level="governor",
            county=county,
        )
        results = PollingStationGovernorResults.objects.create(
            polling_station=polling_station,
            governor_candidate=aspirant,
            votes=100,
        )
        assert results.polling_station == polling_station
        assert results.governor_candidate == aspirant
        assert results.votes == 100

    def test_clean_invalid_governor_candidate(self):
        party = Party.objects.create(name="Test Party", short_name="TP")
        county = County.objects.create(name="Test County", number=1)
        constituency = Constituency.objects.create(
            name="Test Constituency", county=county, number=1
        )
        ward = Ward.objects.create(
            name="Test Ward", constituency=constituency, number=1
        )
        polling_center = PollingCenter.objects.create(
            name="Test Polling Center",
            code="099",
            ward=ward,
        )

        with pytest.raises(
            ValidationError,
            match="Governor must be associated with a county but not a constituency or ward.",
        ):
            aspirant = Aspirant.objects.create(
                first_name="John",
                last_name="Doe",
                party=party,
                level="governor",
                constituency=constituency,
            )

    def test_str_representation_gov_results(self):
        party = Party.objects.create(name="Test Party", short_name="TP")
        county = County.objects.create(name="Test County", number=1)
        constituency = Constituency.objects.create(
            name="Test Constituency", county=county, number=1
        )
        ward = Ward.objects.create(
            name="Test Ward", constituency=constituency, number=1
        )
        polling_center = PollingCenter.objects.create(
            name="Test Polling Center",
            code="099",
            ward=ward,
        )
        polling_station = PollingStation.objects.create(
            polling_center=polling_center,
            code="989898901",
            registered_voters=1000,
        )
        aspirant = Aspirant.objects.create(
            first_name="John",
            last_name="Doe",
            party=party,
            level="governor",
            county=county,
        )
        results = PollingStationGovernorResults.objects.create(
            polling_station=polling_station,
            governor_candidate=aspirant,
            votes=100,
        )
        assert str(results) == f"{polling_station} - {aspirant} - 100"


class TestPollingStationLevelResultsAPI:
    """Tests for the per-level polling-station results endpoint."""

    def url(self, code, level):
        return f"/api/results/polling-station/{code}/results/{level}/"

    @pytest.fixture(autouse=True)
    def _clear_cache(self):
        # The view caches per (level, station); isolate each test.
        cache.clear()
        yield
        cache.clear()

    @pytest.fixture
    def client(self, user):
        api_client = APIClient()
        api_client.force_authenticate(user=user)
        return api_client

    def test_requires_authentication(self, polling_station):
        response = APIClient().get(self.url(polling_station.code, "governor"))
        assert response.status_code == 401

    def test_returns_normalised_governor_results(
        self, client, party, county, polling_station
    ):
        leader = Aspirant.objects.create(
            first_name="Ann",
            last_name="Leader",
            party=party,
            level="governor",
            county=county,
        )
        runner_up = Aspirant.objects.create(
            first_name="Bob",
            last_name="Runner",
            party=party,
            level="governor",
            county=county,
        )
        PollingStationGovernorResults.objects.create(
            polling_station=polling_station, governor_candidate=leader, votes=300
        )
        PollingStationGovernorResults.objects.create(
            polling_station=polling_station, governor_candidate=runner_up, votes=120
        )

        response = client.get(self.url(polling_station.code, "governor"))

        assert response.status_code == 200
        data = response.data["data"]
        assert len(data) == 2
        # Normalised to a common "candidate" key regardless of office.
        assert set(data[0].keys()) == {"candidate", "votes"}
        assert data[0]["candidate"]["first_name"] in {"Ann", "Bob"}
        # Non-presidential offices carry no extra_data.
        assert response.data["extra_data"] is None

    def test_president_includes_extra_data(self, client, party, polling_station):
        candidate = Aspirant.objects.create(
            first_name="Prez",
            last_name="Idential",
            party=party,
            level="president",
        )
        PollingStationPresidentialResults.objects.create(
            polling_station=polling_station,
            presidential_candidate=candidate,
            votes=200,
        )
        PollingStationPresidentialExtras.objects.create(
            polling_station=polling_station,
            rejected_votes=2,
            disputed_votes=1,
            valid_votes_cast=200,
        )

        response = client.get(self.url(polling_station.code, "president"))

        assert response.status_code == 200
        assert len(response.data["data"]) == 1
        assert response.data["extra_data"] is not None
        assert response.data["extra_data"]["rejected_votes"] == 2
        assert response.data["extra_data"]["valid_votes_cast"] == 200

    def test_woman_rep_alias_is_accepted(self, client, party, county, polling_station):
        candidate = Aspirant.objects.create(
            first_name="Wanjiku",
            last_name="Rep",
            party=party,
            level="women_rep",
            county=county,
        )
        PollingStationWomenRepResults.objects.create(
            polling_station=polling_station,
            woman_rep_candidate=candidate,
            votes=50,
        )

        # The native app sends "womanRep"; it should map to "women_rep".
        response = client.get(self.url(polling_station.code, "womanRep"))

        assert response.status_code == 200
        assert len(response.data["data"]) == 1
        assert response.data["data"][0]["candidate"]["first_name"] == "Wanjiku"

    def test_empty_results_return_empty_list(self, client, polling_station):
        response = client.get(self.url(polling_station.code, "senator"))
        assert response.status_code == 200
        assert response.data["data"] == []
        assert response.data["extra_data"] is None

    def test_invalid_level_returns_400(self, client, polling_station):
        response = client.get(self.url(polling_station.code, "president-for-life"))
        assert response.status_code == 400

    def test_unknown_station_returns_404(self, client):
        response = client.get(self.url("000000000", "governor"))
        assert response.status_code == 404

    def test_response_is_cached_per_level_and_station(
        self, client, party, county, polling_station
    ):
        candidate = Aspirant.objects.create(
            first_name="Cache",
            last_name="Me",
            party=party,
            level="governor",
            county=county,
        )
        PollingStationGovernorResults.objects.create(
            polling_station=polling_station,
            governor_candidate=candidate,
            votes=10,
        )

        cache_key = f"polling_station_results:governor:{polling_station.code}"
        assert cache.get(cache_key) is None

        first = client.get(self.url(polling_station.code, "governor"))
        assert first.status_code == 200
        # Cache is populated after the first request.
        assert cache.get(cache_key) is not None

        # A newly added result is not reflected until the cache expires.
        PollingStationGovernorResults.objects.create(
            polling_station=polling_station,
            governor_candidate=Aspirant.objects.create(
                first_name="Later",
                last_name="Comer",
                party=party,
                level="governor",
                county=county,
            ),
            votes=99,
        )
        second = client.get(self.url(polling_station.code, "governor"))
        assert len(second.data["data"]) == 1
