from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

import pytest

from results.models import (
    Aspirant,
    Party,
    PollingStationGovernorResults,
    PollingStationMCAResults,
    PollingStationMpResults,
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
        assert str(aspirant) == "governor - Test Party"


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
