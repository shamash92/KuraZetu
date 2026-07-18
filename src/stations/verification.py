"""Polling-center verification helpers for masking, clustering, and consensus."""

from statistics import median

from django.conf import settings
from django.contrib.gis.geos import Point

# Thin space (U+2009) — masks the middle of a handle while staying readable.
_THIN = " "


def mask_handle(user) -> str:
    """Public, privacy-preserving handle for a contributor.

    "Njoki Mwangi" -> "@n   m". Falls back to the last phone digits, then to
    "Anonymous neighbour" when there is no user at all.
    """
    if user is None:
        return "Anonymous neighbour"

    first = (getattr(user, "first_name", "") or "").strip()
    last = (getattr(user, "last_name", "") or "").strip()
    if first and last:
        return f"@{first[0].lower()}{_THIN * 3}{last[0].lower()}"
    if first:
        return f"@{first[0].lower()}{_THIN * 3}"
    phone = str(getattr(user, "phone_number", "") or "")
    if phone:
        return f"@{_THIN * 2}{phone[-3:]}"
    return "Anonymous neighbour"


# ── Clustering / consensus ──────────────────────────────────────────────

# Rough metres-per-degree near the equator (Kenya); good enough for the
# small radii we cluster within.
_M_PER_DEG = 111_320.0


def _haversine_m(p1: Point, p2: Point) -> float:
    """Approx. planar distance in metres between two lon/lat Points."""
    import math

    dlat = (p2.y - p1.y) * _M_PER_DEG
    dlng = (p2.x - p1.x) * _M_PER_DEG * math.cos(math.radians((p1.y + p2.y) / 2))
    return math.hypot(dlat, dlng)


def cluster_centroid(points):
    """Robust centre of a set of Points: the (median lng, median lat).

    The median ignores far-off outliers, so one bad pin can't drag the centre.
    """
    if not points:
        return None
    return Point(median(p.x for p in points), median(p.y for p in points))


def recompute_consensus(polling_center):
    """Re-evaluate a center's suggestions and auto-verify on agreement.

    - Flags suggestions outside ``CONSENSUS_RADIUS_M`` of the cluster centroid
      (or outside the ward) as outliers; they never count.
    - When at least ``CONSENSUS_THRESHOLD`` in-cluster suggestions agree, sets
      the center's pin/boundary to the cluster centroid and marks it verified.

    Returns a dict summary for the API response.
    """
    radius_m = settings.CONSENSUS_RADIUS_M
    threshold = settings.CONSENSUS_THRESHOLD

    qs = polling_center.verifications.filter(
        pin_location__isnull=False,
        is_upvote=False,
    )
    suggestions = list(qs)
    if not suggestions:
        return {"verified": False, "agree": 0, "needed": threshold, "outliers": 0}

    ward_boundary = (
        polling_center.ward.boundary if polling_center.ward_id else None
    )

    centroid = cluster_centroid([s.pin_location for s in suggestions])

    agree, outliers = [], []
    for s in suggestions:
        in_ward = ward_boundary is None or ward_boundary.contains(s.pin_location)
        near = _haversine_m(s.pin_location, centroid) <= radius_m
        is_outlier = not (in_ward and near)
        if s.is_outlier != is_outlier:
            s.is_outlier = is_outlier
            s.save(update_fields=["is_outlier"])
        (outliers if is_outlier else agree).append(s)

    # Recompute the centroid from the in-cluster pins only for a tighter centre.
    if agree:
        centroid = cluster_centroid([s.pin_location for s in agree])

    verified = False
    if len(agree) >= threshold and not polling_center.is_verified:
        polling_center.pin_location = centroid
        polling_center.boundary = None  # forces re-buffer in save()
        polling_center.is_verified = True
        polling_center.save()
        verified = True

    return {
        "verified": verified or polling_center.is_verified,
        "agree": len(agree),
        "needed": threshold,
        "outliers": len(outliers),
    }
