"""The six races, and who stands in each at a polling station."""

from dataclasses import dataclass

from results.models import (
    Aspirant,
    PollingStationGovernorResults,
    PollingStationMCAResults,
    PollingStationMpResults,
    PollingStationPresidentialResults,
    PollingStationSenatorResults,
    PollingStationWomenRepResults,
)


@dataclass(frozen=True)
class Race:
    # The Aspirant.level value.
    key: str
    results_model: type
    # The field on results_model that points at the aspirant.
    candidate_field: str
    # The area a candidate stands in: national, county, constituency or ward.
    scope: str


RACES = {
    race.key: race
    for race in (
        Race(
            "president",
            PollingStationPresidentialResults,
            "presidential_candidate",
            "national",
        ),
        Race("governor", PollingStationGovernorResults, "governor_candidate", "county"),
        Race("senator", PollingStationSenatorResults, "senator_candidate", "county"),
        Race(
            "women_rep",
            PollingStationWomenRepResults,
            "woman_rep_candidate",
            "county",
        ),
        Race("mp", PollingStationMpResults, "mp_candidate", "constituency"),
        Race("mca", PollingStationMCAResults, "mca_candidate", "ward"),
    )
}

# The native app says "womanRep" and URLs say "women-rep".
_ALIASES = {"womanRep": "women_rep", "women-rep": "women_rep"}


def race_from(name: str) -> Race | None:
    """The race for any spelling the clients use, or None."""
    return RACES.get(_ALIASES.get(name, name))


def candidates_for(station, race: Race):
    """The aspirants a tally at this station must cover for this race."""
    ward = station.polling_center.ward
    area = {
        "national": {},
        "county": {"county": ward.constituency.county},
        "constituency": {"constituency": ward.constituency},
        "ward": {"ward": ward},
    }[race.scope]
    return Aspirant.objects.filter(level=race.key, **area)
