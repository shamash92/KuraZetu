# 05. PinVerify (hybrid auto + game)

The PinVerify game is expensive (real users walking to real stations). The
goal of the hybrid flow is to fix only the coords that automation cannot,
and to do that as quickly as possible.

Existing inputs the platform already has:

- `src/stations/scripts/polling_centers.geojson` — scraped IEBC coordinates.
- `src/stations/scripts/schools.geojson` — open Kenyan schools dataset.
- `src/stations/scripts/wards.geojson` — ward boundary polygons.
- `src/stations/scripts/polling_center_pin_errors_parse.py` — already flags
  pins outside ward boundary.
- `PollingCenterVerification` rows from user submissions.

```{mermaid}
flowchart TD
    A[Scraped coord per<br/>polling center] --> B{Inside ward boundary?<br/>polling_center_pin_errors_parse.py}
    B -->|"no"| C[Flag pin_location_error]
    B -->|"yes"| D{Open schools match<br/>within 500 m + fuzzy name &gt; 85}
    D -->|"hit"| D1[Auto-set pin_location<br/>verified_source = kemis_schools]
    D -->|"miss"| E{OSM Overpass match<br/>amenity = school / community /<br/>place_of_worship}
    E -->|"hit"| E1[Auto-set pin_location<br/>verified_source = osm]
    E -->|"miss"| F{Ward centroid distance<br/>&lt; 2 sigma from verified peers}
    F -->|"yes"| F1[Provisional pin,<br/>marked low confidence]
    F -->|"no"| G[Queue for PinVerify game]
    G --> H[Users walk to site,<br/>drop pin in NATIVE app]
    H --> I[(PollingCenterVerification rows)]
    I --> J{DBSCAN cluster<br/>eps = 25 m, min = 3}
    J -->|"cluster found"| K[Freeze cluster centroid<br/>verified_source = community]
    J -->|"outliers only"| L[Keep collecting,<br/>map shows pin disputed]

    style D1 fill:#cfc
    style E1 fill:#cfc
    style K fill:#cfc
    style L fill:#fda
```

## New scripts to add under `src/stations/scripts/`

| Script | Job | Frequency |
|---|---|---|
| `match_schools_to_centers.py` | Fuzzy-match center name to `schools.geojson` POI within 500 m, set pin if `score >= 85` | one-shot + on data refresh |
| `osm_overpass_fallback.py` | For unresolved centers, Overpass query for amenity within 500 m | batch, rate-limited |
| `cluster_user_pins.py` | DBSCAN over `PollingCenterVerification` per center, freeze centroid on cluster | Celery beat, nightly |
| `ward_centroid_outliers.py` | Detect stations whose scraped coord falls outside `2 sigma` of verified ward peers, push into game queue first | nightly |

## Other open datasets worth considering

- **Kenya Master Facility List (KMFL)** at `kmhfl.health.go.ke` — health
  facilities sometimes used as polling stations.
- **OSM Kenya extract** (Geofabrik) — single file, all amenities; preferred
  over Overpass for batch jobs.
- **GeoNames Kenya** — populated places for ward centroid sanity.
- **Archive.org IEBC GIS** — historical KML snapshots that sometimes hold
  better coords than newer PDF scrapes.

## What this does not do

- Does not OCR the form 34A or any photo. The PinVerify game still asks the
  user to drop a pin; automation only narrows where humans are needed.
- Does not replace the existing `polling_center_pin_errors_parse.py`. The
  ward-boundary check stays the first filter; automation runs after it.
