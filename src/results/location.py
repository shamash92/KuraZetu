"""Where an upload was made, graded against the station it names."""

import math
from dataclasses import dataclass

from django.contrib.gis.geos import Point

CENTRE_MATCH = "centre_match"
WARD_FALLBACK = "ward_fallback"
LOCATION_MISMATCH = "location_mismatch"
LOCATION_UNKNOWN = "location_unknown"

GRADES = [
    (CENTRE_MATCH, "Centre match"),
    (WARD_FALLBACK, "Ward fallback"),
    (LOCATION_MISMATCH, "Location mismatch"),
    (LOCATION_UNKNOWN, "Location unknown"),
]
COUNTABLE = {CENTRE_MATCH, WARD_FALLBACK}

# A fix less precise than this cannot tell the school from its neighbours.
MAX_ACCURACY_M = 100
# Agents and observers usually work indoors, where a fix is less precise.
ACCURACY_ALLOWANCE_ROLES = {"party_agent", "observer"}

MESSAGES = {
    LOCATION_UNKNOWN: (
        "This upload has no precise location, so it cannot support a result. "
        "Step outside or wait for a better location, then upload again."
    ),
    LOCATION_MISMATCH: (
        "This upload was not made at the polling centre, so it cannot support "
        "a result."
    ),
}

EARTH_RADIUS_M = 6_371_008.8


@dataclass(frozen=True)
class Fix:
    latitude: float
    longitude: float
    accuracy_m: float

    @property
    def point(self):
        return Point(self.longitude, self.latitude, srid=4326)


@dataclass(frozen=True)
class Grade:
    grade: str
    # Metres from the centre's pin; None without a fix or a pin.
    distance_m: float | None

    @property
    def countable(self):
        return self.grade in COUNTABLE

    @property
    def message(self):
        return MESSAGES.get(self.grade)


def grade_location(fix, account, station):
    """Grade a device fix (or None) for an account's upload at a station."""
    if fix is None or fix.accuracy_m > MAX_ACCURACY_M:
        return Grade(LOCATION_UNKNOWN, _distance_to(fix, station))

    centre = station.polling_center
    distance = _distance_to(fix, station)
    boundary = centre.ward.boundary
    checks_ward = not centre.is_outside_ward_boundary and boundary is not None
    # A centre inside its ward counts only from inside the ward, even near
    # its pin.
    if checks_ward and not boundary.contains(fix.point):
        return Grade(LOCATION_MISMATCH, distance)

    if centre.is_verified and distance is not None:
        allowed = centre.radius * 1000
        # An outside-ward centre escapes the ward check, so it gets no slack.
        if (
            not centre.is_outside_ward_boundary
            and account.role in ACCURACY_ALLOWANCE_ROLES
        ):
            allowed += min(fix.accuracy_m, MAX_ACCURACY_M)
        if distance <= allowed:
            return Grade(CENTRE_MATCH, distance)

    if checks_ward:
        return Grade(WARD_FALLBACK, distance)
    return Grade(LOCATION_MISMATCH, distance)


def _distance_to(fix, station):
    pin = station.polling_center.pin_location
    # A pin at (0, 0) is a placeholder for an unlocated centre, not a place.
    if fix is None or pin is None or (abs(pin.x) < 1e-6 and abs(pin.y) < 1e-6):
        return None
    return _great_circle_m(fix.latitude, fix.longitude, pin.y, pin.x)


def _great_circle_m(lat1, lng1, lat2, lng2):
    """Haversine distance in metres."""
    lat1_r, lat2_r = math.radians(lat1), math.radians(lat2)
    d_lat = lat2_r - lat1_r
    d_lng = math.radians(lng2 - lng1)
    h = (
        math.sin(d_lat / 2) ** 2
        + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(d_lng / 2) ** 2
    )
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(h))
