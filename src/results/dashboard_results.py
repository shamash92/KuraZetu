"""The public tally, grouped within an explicitly assigned dashboard scope."""

from collections import Counter

from django.db.models import Count, Q, Sum
from django.http import Http404
from django.shortcuts import get_object_or_404

from results.location import COUNTABLE
from results.models import Aspirant, ResultUpload
from results.qr import COUNTS as QR_COUNTS
from results.races import race_from
from stations.models import Constituency, County, PollingCenter, PollingStation, Ward

LEVELS = ("national", "county", "constituency", "ward", "center", "station")
MODELS = dict(
    zip(LEVELS[1:], (County, Constituency, Ward, PollingCenter, PollingStation))
)
PARENT_FIELDS = {
    "constituency": "county",
    "ward": "constituency",
    "center": "ward",
    "station": "polling_center",
}
STATION_PATHS = {
    "county": "polling_center__ward__constituency__county",
    "constituency": "polling_center__ward__constituency",
    "ward": "polling_center__ward",
    "center": "polling_center",
    "station": "pk",
}


def root(dashboard):
    if dashboard.kind != "aspirant":
        return "national", None, race_from("president")
    candidate = dashboard.aspirant
    race = race_from(candidate.level)
    area = None if race.scope == "national" else getattr(candidate, race.scope)
    if race.scope != "national" and area is None:
        raise Http404
    return race.scope, area, race


def within(level, area, root_level, root_area):
    if root_level == "national":
        return True
    if LEVELS.index(level) < LEVELS.index(root_level):
        return False
    while level != root_level:
        area = getattr(area, PARENT_FIELDS[level])
        level = LEVELS[LEVELS.index(level) - 1]
    return area.pk == root_area.pk


def authorized_area(dashboard, level=None, pk=None):
    root_level, root_area, race = root(dashboard)
    level = level or root_level
    if level not in LEVELS:
        raise Http404
    if level == "national":
        area = None
    elif pk is None and level == root_level:
        area = root_area
    else:
        area = get_object_or_404(MODELS[level], pk=pk)
    if not within(level, area, root_level, root_area):
        raise Http404
    return level, area, race


def stations_at(level, area):
    stations = PollingStation.objects.all()
    return (
        stations
        if level == "national"
        else stations.filter(**{STATION_PATHS[level]: area.pk})
    )


def area_label(level, area):
    if level == "national":
        return "National"
    if level == "station":
        return f"{area.polling_center.name} · Station {area.stream_number}"
    return area.name


def descriptor(level, area):
    return {
        "level": level,
        "id": area.pk if area else None,
        "name": area_label(level, area),
    }


def countable_uploads(stations, race):
    return ResultUpload.objects.filter(
        polling_station__in=stations,
        race=race.key,
        is_current=True,
        location_grade__in=COUNTABLE,
        server_qr_result__in=QR_COUNTS,
        form_changed=False,
    )


def typed_uploads(stations, race):
    """Countable current uploads that carry their own figures. An agreement
    holds no tally of its own, so it never makes a station disagree."""
    return countable_uploads(stations, race).filter(agrees_with__isnull=True)


def disagreements(stations, race, group_path=None):
    fields = ["polling_station_id"]
    if group_path and group_path != "polling_station_id":
        fields.append(group_path)
    return (
        typed_uploads(stations, race)
        .values(*fields)
        .annotate(
            variants=Count("votes", distinct=True),
            rejected_variants=Count("rejected_votes", distinct=True),
            disputed_variants=Count("disputed_votes", distinct=True),
        )
        .filter(
            Q(variants__gt=1) | Q(rejected_variants__gt=1) | Q(disputed_variants__gt=1)
        )
    )


def tally(candidates, totals, reported, station_count, disagreeing, focus):
    votes = {row["candidate"]: row["votes"] or 0 for row in totals}
    total = sum(votes.values())
    ordered = sorted(
        candidates, key=lambda c: (-votes.get(c.pk, 0), c.first_name, c.last_name, c.pk)
    )
    maximum = max(votes.values(), default=0)
    leaders = [c.pk for c in ordered if maximum > 0 and votes.get(c.pk, 0) == maximum]
    data = [
        {
            "id": c.pk,
            "name": f"{c.first_name} {c.last_name}",
            "party": c.party.name,
            "votes": votes.get(c.pk, 0),
            "share": round(votes.get(c.pk, 0) * 100 / total, 2) if total else 0,
            "focused": c.pk in focus,
        }
        for c in ordered
    ]
    return {
        "candidates": data,
        "votes": total,
        "reported": reported,
        "stations": station_count,
        "disagreements": disagreeing,
        "leader_ids": leaders,
        "status": (
            "No results"
            if not reported
            else (
                "Tied"
                if len(leaders) > 1
                else ("Leading" if leaders else "No counted votes")
            )
        ),
    }


def race_candidates(dashboard, race):
    """Everyone standing in the dashboard's race, and whose figures it follows."""
    candidate_filter = {"level": race.key}
    if race.scope != "national":
        candidate_filter[race.scope] = getattr(dashboard.aspirant, race.scope)
    candidates = list(
        Aspirant.objects.filter(**candidate_filter).select_related("party")
    )
    focus = (
        {dashboard.aspirant_id}
        if dashboard.aspirant_id
        else {c.pk for c in candidates if c.party_id == dashboard.party_id}
    )
    return candidates, focus


def counted_results(race, stations, candidates):
    return race.results_model.objects.filter(
        polling_station__in=stations,
        **{race.candidate_field + "__in": [c.pk for c in candidates]},
    )


def dashboard_payload(dashboard, level=None, pk=None):
    level, area, race = authorized_area(dashboard, level, pk)
    root_level, root_area, _ = root(dashboard)
    stations = stations_at(level, area)
    candidates, focus = race_candidates(dashboard, race)
    results = counted_results(race, stations, candidates)
    totals = [
        {"candidate": row[race.candidate_field], "votes": row["votes"]}
        for row in results.values(race.candidate_field).annotate(votes=Sum("votes"))
    ]
    summary = tally(
        candidates,
        totals,
        results.values("polling_station_id").distinct().count(),
        stations.count(),
        disagreements(stations, race).count(),
        focus,
    )
    children = []
    if level != "station":
        child_level = LEVELS[LEVELS.index(level) + 1]
        areas = MODELS[child_level].objects.all()
        if area is not None:
            areas = areas.filter(**{PARENT_FIELDS[child_level]: area})
        if child_level == "station":
            areas = areas.select_related("polling_center")
        areas = list(areas.order_by("pk"))
        station_group = STATION_PATHS[child_level]
        group = (
            "polling_station_id"
            if child_level == "station"
            else "polling_station__" + station_group + "_id"
        )
        counts = {
            row[station_group]: row["count"]
            for row in stations.values(station_group).annotate(count=Count("pk"))
        }
        reports = {
            row[group]: row["count"]
            for row in results.values(group).annotate(
                count=Count("polling_station_id", distinct=True)
            )
        }
        grouped_totals = {}
        for row in results.values(group, race.candidate_field).annotate(
            votes=Sum("votes")
        ):
            grouped_totals.setdefault(row[group], []).append(
                {"candidate": row[race.candidate_field], "votes": row["votes"]}
            )
        disputed = Counter(row[group] for row in disagreements(stations, race, group))
        children = [
            {
                **descriptor(child_level, child),
                **tally(
                    candidates,
                    grouped_totals.get(child.pk, []),
                    reports.get(child.pk, 0),
                    counts.get(child.pk, 0),
                    disputed[child.pk],
                    focus,
                ),
            }
            for child in areas
        ]
    breadcrumbs = [descriptor(level, area)]
    cursor_level, cursor = level, area
    while cursor_level != root_level:
        cursor = (
            getattr(cursor, PARENT_FIELDS[cursor_level])
            if cursor_level != "county"
            else None
        )
        cursor_level = LEVELS[LEVELS.index(cursor_level) - 1]
        breadcrumbs.insert(0, descriptor(cursor_level, cursor))
    return {
        "dashboard": dashboard.name,
        "race": race.key,
        # Whose figures get their own column: the aspirant, or the party.
        "focus": (
            dashboard.aspirant.full_name
            if dashboard.aspirant_id
            else dashboard.party.name if dashboard.party_id else None
        ),
        "area": descriptor(level, area),
        "breadcrumbs": breadcrumbs,
        "summary": summary,
        "children": children,
    }


def station_rows(dashboard, level, pk):
    """Every polling station inside one area of the dashboard, with the
    followed candidate's votes and place there, or who leads when the
    dashboard follows no one."""
    level, area, race = authorized_area(dashboard, level, pk)
    if level == "national":
        raise Http404
    stations = list(
        stations_at(level, area).select_related("polling_center").order_by("pk")
    )
    candidates, focus = race_candidates(dashboard, race)
    names = {c.pk: f"{c.first_name} {c.last_name}" for c in candidates}
    votes = {}
    for row in counted_results(race, stations, candidates).values(
        "polling_station_id", race.candidate_field, "votes"
    ):
        votes.setdefault(row["polling_station_id"], {})[row[race.candidate_field]] = (
            row["votes"] or 0
        )
    disputed = {row["polling_station_id"] for row in disagreements(stations, race)}
    rows = []
    for station in stations:
        counts = votes.get(station.pk)
        row = {
            **descriptor("station", station),
            "reported": counts is not None,
            "disagrees": station.pk in disputed,
            "votes": None,
            "position": None,
            "tied": False,
            "leaders": [],
        }
        if counts:
            top = max(counts.values())
            row["leaders"] = [
                names[c] for c, v in counts.items() if top > 0 and v == top
            ]
            mine = max((counts.get(c, 0) for c in focus), default=None)
            if mine is not None:
                row["votes"] = mine
                if any(counts.values()):
                    row["position"] = 1 + sum(v > mine for v in counts.values())
                    row["tied"] = sum(v == mine for v in counts.values()) > 1
        rows.append(row)
    return {"area": descriptor(level, area), "stations": rows}


def station_uploads(dashboard, pk):
    """The figures typed with each upload at one station, for reading only.
    Nothing here names who uploaded, their device, or where they stood."""
    _, station, race = authorized_area(dashboard, "station", pk)
    candidates, _ = race_candidates(dashboard, race)
    uploads = list(typed_uploads([station], race).order_by("created_at", "pk"))
    agreed = Counter(
        countable_uploads([station], race)
        .filter(agrees_with__in=uploads)
        .values_list("agrees_with_id", flat=True)
    )
    rows = [
        {
            "id": str(upload.pk),
            "votes": {str(c.pk): upload.votes.get(str(c.pk)) for c in candidates},
            "rejected": upload.rejected_votes,
            "disputed": upload.disputed_votes,
            "agreed": agreed[upload.pk],
        }
        for upload in uploads
    ]
    return {
        "station": descriptor("station", station),
        "candidates": [
            {"id": c.pk, "name": f"{c.first_name} {c.last_name}"} for c in candidates
        ],
        "uploads": rows,
    }


def evidence_upload(dashboard, upload_id):
    """An upload whose photo this dashboard may see, or 404."""
    upload = (
        ResultUpload.objects.filter(pk=upload_id, agrees_with__isnull=True)
        .select_related("polling_station")
        .first()
    )
    if upload is None:
        raise Http404
    _, station, race = authorized_area(dashboard, "station", upload.polling_station_id)
    if not typed_uploads([station], race).filter(pk=upload.pk).exists():
        raise Http404
    return upload
