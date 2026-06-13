import {useEffect, useMemo, useRef, useState} from "react";
import {
    Crosshair,
    LocateFixed,
    MapPin,
    Search,
    ZoomIn,
    ZoomOut,
} from "lucide-react";
import {
    Circle,
    GeoJSON,
    MapContainer,
    Marker,
    Polyline,
    Popup,
    TileLayer,
    Tooltip,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import {IGeocodeResult, IPollingCenterFeature} from "./types";

interface MapComponentProps {
    location: IPollingCenterFeature;
    wardNumber?: number | null;
    suggestedLocation?: IPollingCenterFeature | null;
    partiallyVerifiedLocations?: IPollingCenterFeature[] | null;
    highlightedSuggestion?: IPollingCenterFeature | null;
    isReadOnly?: boolean;
    isEditing: boolean;
    draftPosition: LatLng | null;
    onDraftPositionChange: (position: LatLng, isInsideWard: boolean) => void;
}

type LatLng = {lat: number; lng: number};

const SATELLITE_NATIVE_MAX_ZOOM = 20;
const MAP_MAX_ZOOM = 24;
const DEFAULT_PIN_RADIUS_KM = 0.05;
const ORIGINAL_COLOR = "#ff8a4c";
const SUGGESTION_COLOR = "#8b7cff";
const TARGET_COLOR = "#c4ff5e";

function pinIcon(
    kind: "current" | "suggestion" | "candidate" | "outlier" | "user",
) {
    const color =
        kind === "user"
            ? TARGET_COLOR
            : kind === "current"
            ? ORIGINAL_COLOR
            : kind === "candidate"
            ? TARGET_COLOR
            : kind === "outlier"
            ? "#d9764f"
            : SUGGESTION_COLOR;
    const className = [
        "pv-pin-marker",
        kind === "candidate" ? "is-candidate" : "",
        kind === "outlier" ? "is-outlier" : "",
        kind === "user" ? "is-user" : "",
    ]
        .filter(Boolean)
        .join(" ");

    return L.divIcon({
        className: "pv-pin-icon",
        html: `<div class="${className}"><svg viewBox="0 0 28 36" fill="none" aria-hidden="true"><path d="M14 35 C14 24 26 22 26 13 A12 12 0 0 0 2 13 C2 22 14 24 14 35Z" fill="${color}" stroke="#0a0a0a" stroke-width="1.4"/><circle cx="14" cy="13" r="4" fill="#fff"/></svg></div>`,
        iconSize: kind === "candidate" ? [40, 52] : [34, 44],
        iconAnchor: kind === "candidate" ? [20, 52] : [17, 44],
        popupAnchor: kind === "candidate" ? [0, -50] : [0, -42],
    });
}

// ── Robust cluster framing (req #3) ────────────────────────────────────
// median + MAD: points more than k*MAD (floor ~150m) from the median are
// outliers and excluded from the bounds, so one far pin can't zoom us out.
function median(values: number[]): number {
    const s = [...values].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function clusterInliers(points: LatLng[]): LatLng[] {
    if (points.length <= 1) return points;
    const mLat = median(points.map((p) => p.lat));
    const mLng = median(points.map((p) => p.lng));
    const dists = points.map((p) => Math.hypot(p.lat - mLat, p.lng - mLng));
    const mad = median(dists.map((d) => Math.abs(d - median(dists))));
    // ~150m in degrees ≈ 0.00135; use it as a floor so tight clusters keep all.
    const threshold = Math.max(mad * 3, 0.00135);
    const inliers = points.filter(
        (p) => Math.hypot(p.lat - mLat, p.lng - mLng) <= threshold,
    );
    return inliers.length ? inliers : points;
}

// Ray-casting point-in-polygon for the ward-guard hint (backend is the gate).
function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        const intersect =
            yi > lat !== yj > lat &&
            lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}

function pointInWard(lng: number, lat: number, boundary: any): boolean {
    if (!boundary) return true; // no polygon → don't block client-side
    const polys =
        boundary.type === "MultiPolygon" ? boundary.coordinates : [boundary.coordinates];
    return polys.some((poly: number[][][]) => pointInRing(lng, lat, poly[0]));
}

// Fits the map to the inlier cluster on first load / location change.
function ClusterFramer({
    inliers,
    trigger,
}: {
    inliers: LatLng[];
    trigger: number;
}) {
    const map = useMap();

    // Log the resulting zoom so we can see how each track frames.
    useEffect(() => {
        const log = () => console.log("[pinverify] zoom:", map.getZoom());
        map.on("zoomend", log);
        return () => {
            map.off("zoomend", log);
        };
    }, [map]);

    useEffect(() => {
        if (!inliers.length) return;
        // The map mounts inside an animated/padded container, so Leaflet may
        // not know its real size yet — recompute before framing, else
        // fitBounds picks the wrong zoom and tiles render grey.
        const frame = () => {
            map.invalidateSize();
            if (inliers.length === 1) {
                map.setView([inliers[0].lat, inliers[0].lng], 18);
                return;
            }
            const bounds = L.latLngBounds(inliers.map((p) => [p.lat, p.lng]));
            map.fitBounds(bounds, {padding: [60, 60], maxZoom: 18});
            console.log("[pinverify] fit to cluster, zoom:", map.getZoom());
        };
        // Defer one tick so layout/animation settles first.
        const id = setTimeout(frame, 120);
        return () => clearTimeout(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trigger]);
    return null;
}

function EditCenterTracker({
    onCenterChange,
}: {
    onCenterChange: (position: LatLng) => void;
}) {
    const map = useMap();

    useEffect(() => {
        const updateCenter = () => {
            const nextCenter = map.getCenter();
            onCenterChange({lat: nextCenter.lat, lng: nextCenter.lng});
        };

        updateCenter();
        map.on("move", updateCenter);
        return () => {
            map.off("move", updateCenter);
        };
    }, [map, onCenterChange]);

    return null;
}

function formatDistance(meters: number): string {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)} km`;
}

export default function MapComponent({
    location,
    wardNumber,
    suggestedLocation,
    partiallyVerifiedLocations,
    highlightedSuggestion,
    isReadOnly = false,
    isEditing,
    draftPosition,
    onDraftPositionChange,
}: MapComponentProps) {
    const mapRef = useRef<L.Map | null>(null);

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<IGeocodeResult[]>([]);
    const [provider, setProvider] = useState<string | null>(null);
    const [candidate, setCandidate] = useState<LatLng | null>(null);
    const [searching, setSearching] = useState(false);

    const wardBoundary = location.properties.ward_boundary ?? null;
    const pinRadiusMeters =
        (location.properties.radius ?? DEFAULT_PIN_RADIUS_KM) * 1000;

    const center: [number, number] = [
        location.properties.pin_location.coordinates[1],
        location.properties.pin_location.coordinates[0],
    ];
    const [editTarget, setEditTarget] = useState<LatLng>({
        lat: center[0],
        lng: center[1],
    });

    // Collect candidate points (original + suggestions) for cluster framing.
    const inliers = useMemo(() => {
        const pts: LatLng[] = [{lat: center[0], lng: center[1]}];
        partiallyVerifiedLocations?.forEach((loc) => {
            pts.push({
                lat: loc.properties.pin_location.coordinates[1],
                lng: loc.properties.pin_location.coordinates[0],
            });
        });
        if (highlightedSuggestion) {
            pts.push({
                lat: highlightedSuggestion.properties.pin_location.coordinates[1],
                lng: highlightedSuggestion.properties.pin_location.coordinates[0],
            });
        }
        return clusterInliers(pts);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.id, partiallyVerifiedLocations, highlightedSuggestion]);

    const [frameTrigger, setFrameTrigger] = useState(0);
    useEffect(() => {
        setFrameTrigger((t) => t + 1);
    }, [location.id, suggestedLocation]);

    useEffect(() => {
        if (!isEditing) {
            setCandidate(null);
        }
    }, [isEditing]);

    useEffect(() => {
        setCandidate(null);
        setQuery("");
        setResults([]);
        setEditTarget({lat: center[0], lng: center[1]});
    }, [location.id]);

    // Debounced geocode search, biased to this ward.
    useEffect(() => {
        if (query.trim().length < 3) {
            setResults([]);
            return;
        }
        setSearching(true);
        const handle = setTimeout(() => {
            const params = new URLSearchParams({q: query});
            if (wardNumber) params.set("ward_number", String(wardNumber));
            fetch(`/api/stations/geocode/?${params.toString()}`, {
                credentials: "include",
            })
                .then((r) => r.json())
                .then((data) => {
                    setResults(data.results || []);
                    setProvider(data.provider || null);
                })
                .catch(() => setResults([]))
                .finally(() => setSearching(false));
        }, 350);
        return () => clearTimeout(handle);
    }, [query, wardNumber]);

    const selectResult = (r: IGeocodeResult) => {
        const inside = pointInWard(r.lng, r.lat, wardBoundary);
        if (!inside) {
            // Still pan there, but warn — the pin can't be saved outside the ward.
            setResults([]);
            setQuery(r.name);
        }
        setCandidate(isEditing ? null : {lat: r.lat, lng: r.lng});
        setResults([]);
        setQuery(r.name);
        const currentZoom = mapRef.current?.getZoom() ?? 18;
        mapRef.current?.setView([r.lat, r.lng], currentZoom);
    };

    const recenterToCluster = () => {
        if (!mapRef.current || !inliers.length) return;
        if (inliers.length === 1) {
            mapRef.current.setView([inliers[0].lat, inliers[0].lng], 18);
        } else {
            mapRef.current.fitBounds(
                L.latLngBounds(inliers.map((p) => [p.lat, p.lng])),
                {padding: [60, 60], maxZoom: 19},
            );
        }
    };

    const candidateOutsideWard =
        candidate && !pointInWard(candidate.lng, candidate.lat, wardBoundary);
    const editTargetInsideWard = pointInWard(
        editTarget.lng,
        editTarget.lat,
        wardBoundary,
    );
    const editDistanceMeters = L.latLng(center).distanceTo(
        L.latLng(editTarget.lat, editTarget.lng),
    );
    const originalUpvotes = location.properties.location_upvotes ?? 0;

    const placePinAtMapCenter = () => {
        const mapCenter = mapRef.current?.getCenter();
        if (!mapCenter) return;
        onDraftPositionChange(
            {lat: mapCenter.lat, lng: mapCenter.lng},
            pointInWard(mapCenter.lng, mapCenter.lat, wardBoundary),
        );
    };

    return (
        <div className="pv-game-map">
            <MapContainer
                attributionControl={true}
                center={center}
                zoom={18}
                style={{width: "100%", height: "100%", zIndex: 1}}
                ref={mapRef as any}
                zoomControl={false}
                touchZoom
                minZoom={14}
                maxZoom={MAP_MAX_ZOOM}
            >
                <TileLayer
                    url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                    attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a> | &copy; <span title="KuraZetu Trademark">KuraZetu™</span>'
                    maxNativeZoom={SATELLITE_NATIVE_MAX_ZOOM}
                    maxZoom={MAP_MAX_ZOOM}
                    keepBuffer={4}
                />

                <ClusterFramer inliers={inliers} trigger={frameTrigger} />
                {isEditing && (
                    <EditCenterTracker onCenterChange={setEditTarget} />
                )}

                {/* Ward boundary outline — you can't pin outside this (req #4) */}
                {wardBoundary && (
                    <GeoJSON
                        key={`ward-${location.id}`}
                        data={wardBoundary}
                        style={() => ({
                            color: "#65a30d",
                            weight: 2,
                            fillOpacity: 0.04,
                            dashArray: "8 6",
                        })}
                    />
                )}

                {/* Existing suggestions — clustered or muted outlier (req #2/#3) */}
                {partiallyVerifiedLocations &&
                    partiallyVerifiedLocations.map((loc) => {
                        const outlier = loc.properties.is_outlier === true;
                        return (
                            <GeoJSON
                                key={loc.id}
                                data={loc}
                                style={() => ({
                                    fillColor: outlier
                                        ? "#d9764f"
                                        : SUGGESTION_COLOR,
                                    fillOpacity: outlier ? 0.12 : 0.22,
                                    color: outlier ? "#d9764f" : SUGGESTION_COLOR,
                                    weight: outlier ? 1 : 2,
                                    dashArray: "7 5",
                                    opacity: outlier ? 0.5 : 1,
                                })}
                            >
                            </GeoJSON>
                        );
                    })}

                {partiallyVerifiedLocations?.map((loc) => {
                    const outlier = loc.properties.is_outlier === true;
                    const author = loc.properties.suggested_by || "Anonymous neighbour";
                    const initials =
                        author.replace(/[@\s]/g, "").slice(0, 2).toUpperCase() || "?";
                    return (
                        <Marker
                            key={`pin-${loc.id}`}
                            position={[
                                loc.properties.pin_location.coordinates[1],
                                loc.properties.pin_location.coordinates[0],
                            ]}
                            icon={pinIcon(outlier ? "outlier" : "suggestion")}
                        >
                            <Tooltip direction="top" offset={[0, -40]}>
                                {outlier
                                    ? "Far from other suggestions"
                                    : "Community suggestion"}
                            </Tooltip>
                            <Popup>
                                <div className="pv-pin-popup-tag">
                                    {outlier
                                        ? "Far from other suggestions"
                                        : "Existing suggestion"}
                                </div>
                                <div className="pv-pin-popup-name">
                                    {loc.properties.name}
                                </div>
                                <div className="pv-pin-popup-by">
                                    <span className="pv-pin-popup-avatar">
                                        {initials}
                                    </span>
                                    <div>
                                        <div className="pv-pin-popup-who">{author}</div>
                                        {loc.properties.suggested_on && (
                                            <div className="pv-pin-popup-when">
                                                {new Date(
                                                    loc.properties.suggested_on,
                                                ).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span
                                    className={`pv-pin-popup-source ${
                                        loc.properties.ai_suggestion ? "is-ai" : ""
                                    }`}
                                >
                                    {loc.properties.ai_suggestion
                                        ? `AI · ${loc.properties.ai_model || "model"}`
                                        : outlier
                                        ? "Not counted toward agreement yet"
                                        : "Citizen · in ward"}
                                </span>
                            </Popup>
                        </Marker>
                    );
                })}

                {suggestedLocation && (
                    <GeoJSON
                        data={suggestedLocation}
                        style={() => ({
                            fillColor: "#2eb1fe",
                            fillOpacity: 0.3,
                            color: "#2eb1fe",
                            weight: 1,
                            dashArray: "4 4",
                        })}
                    >
                        <Tooltip>
                            Your suggestion
                            <br />
                            {suggestedLocation.properties.name}
                        </Tooltip>
                    </GeoJSON>
                )}

                {/* Original center boundary */}
                <GeoJSON
                    key={location.id}
                    data={location}
                    style={() => ({
                        fillColor: ORIGINAL_COLOR,
                        fillOpacity: 0.2,
                        color: ORIGINAL_COLOR,
                        weight: 3,
                    })}
                />

                {/* Original center remains a distinct reference in every mode. */}
                <Marker
                    position={center}
                    icon={pinIcon("current")}
                >
                    <Tooltip
                        permanent
                        direction="top"
                        offset={[0, -42]}
                        className="pv-map-role-label is-original"
                    >
                        Original · {originalUpvotes} yes
                    </Tooltip>
                    <Popup>
                        <strong>{location.properties.name}</strong>
                        <br />
                        {location.properties.code}
                        <br />
                        {originalUpvotes}{" "}
                        {originalUpvotes === 1 ? "confirmation" : "confirmations"}
                    </Popup>
                </Marker>

                {highlightedSuggestion && (
                    <>
                        <Circle
                            center={[
                                highlightedSuggestion.properties.pin_location
                                    .coordinates[1],
                                highlightedSuggestion.properties.pin_location
                                    .coordinates[0],
                            ]}
                            radius={
                                (highlightedSuggestion.properties.radius ??
                                    DEFAULT_PIN_RADIUS_KM) * 1000
                            }
                            pathOptions={{
                                color: "#c4ff5e",
                                fillColor: "#c4ff5e",
                                fillOpacity: 0.24,
                                opacity: 0.95,
                                weight: 4,
                            }}
                        />
                        <Marker
                            position={[
                                highlightedSuggestion.properties.pin_location
                                    .coordinates[1],
                                highlightedSuggestion.properties.pin_location
                                    .coordinates[0],
                            ]}
                            icon={pinIcon("user")}
                        >
                            <Tooltip permanent direction="top" offset={[0, -44]}>
                                Your suggestion
                            </Tooltip>
                        </Marker>
                    </>
                )}

                {/* The map center is the only edit target; pan, then confirm placement. */}
                {isEditing && (
                    <>
                        <Circle
                            center={[editTarget.lat, editTarget.lng]}
                            radius={pinRadiusMeters}
                            pathOptions={{
                                color: editTargetInsideWard
                                    ? TARGET_COLOR
                                    : "#ff785a",
                                fillColor: editTargetInsideWard
                                    ? TARGET_COLOR
                                    : "#ff785a",
                                fillOpacity: 0.16,
                                opacity: 0.95,
                                weight: 3,
                            }}
                        />
                        {!location.properties.is_unlocated &&
                            editDistanceMeters > 1 && (
                                <Polyline
                                    positions={[
                                        center,
                                        [editTarget.lat, editTarget.lng],
                                    ]}
                                    pathOptions={{
                                        color: TARGET_COLOR,
                                        weight: 3,
                                        dashArray: "8 7",
                                        opacity: 0.95,
                                    }}
                                >
                                    <Tooltip
                                        permanent
                                        direction="top"
                                        className="pv-map-distance-label"
                                    >
                                        {formatDistance(editDistanceMeters)} from original
                                    </Tooltip>
                                </Polyline>
                            )}
                        {draftPosition && (
                            <Marker
                                position={[draftPosition.lat, draftPosition.lng]}
                                icon={pinIcon("candidate")}
                            >
                                <Tooltip direction="top" offset={[0, -46]}>
                                    Selected location
                                </Tooltip>
                            </Marker>
                        )}
                    </>
                )}

                {!isEditing && candidate && (
                    <Marker
                        position={[candidate.lat, candidate.lng]}
                        icon={pinIcon("candidate")}
                    >
                        <Popup>
                            {candidateOutsideWard
                                ? "Outside the ward — can't be saved here"
                                : "Search result"}
                        </Popup>
                    </Marker>
                )}
            </MapContainer>

            {/* Search bar (req #1) */}
            {!isReadOnly && (
                <div className="pv-map-search">
                    <div className="pv-map-search-box">
                        <Search size={16} />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={`Search ${location.properties.ward} ward…`}
                        />
                        {provider && (
                            <span className="pv-map-provider">
                                {provider === "google"
                                    ? "Google"
                                    : "OSM · Nominatim"}
                            </span>
                        )}
                    </div>
                    {(results.length > 0 || searching) && (
                        <div className="pv-map-results">
                            {searching && results.length === 0 && (
                                <div className="pv-map-searching">
                                    Searching...
                                </div>
                            )}
                            {results.map((r, i) => (
                                <button
                                    key={i}
                                    onClick={() => selectResult(r)}
                                    className="pv-map-result"
                                    type="button"
                                >
                                    <MapPin size={14} />
                                    <strong>{r.name}</strong>
                                    <span>{r.type}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {isEditing && (
                <div className="pv-map-center-placement">
                    <span className="pv-map-center-crosshair" aria-hidden="true">
                        <Crosshair size={24} />
                    </span>
                    <button type="button" onClick={placePinAtMapCenter}>
                        <LocateFixed size={15} />
                        Put pin here
                    </button>
                </div>
            )}

            <div className="pv-map-legend" aria-label="Map pin legend">
                <span>
                    <i className="is-original" />
                    Original · {originalUpvotes} yes
                </span>
                {(partiallyVerifiedLocations?.length ?? 0) > 0 && (
                    <span>
                        <i className="is-suggestion" />
                        Community suggestion
                        {partiallyVerifiedLocations!.length === 1
                            ? ""
                            : `s · ${partiallyVerifiedLocations!.length}`}
                    </span>
                )}
                {isEditing && (
                    <span>
                        <i className="is-target" />
                        Placement target
                    </span>
                )}
            </div>

            {/* Zoom + recenter controls */}
            <div className="pv-map-zoom">
                <button
                    aria-label="Zoom in"
                    onClick={() => mapRef.current?.zoomIn()}
                    type="button"
                >
                    <ZoomIn size={16} />
                </button>
                <button
                    aria-label="Zoom out"
                    onClick={() => mapRef.current?.zoomOut()}
                    type="button"
                >
                    <ZoomOut size={16} />
                </button>
            </div>

            {/* Recenter-to-cluster (req #3) */}
            <button
                onClick={recenterToCluster}
                className="pv-map-recenter"
                type="button"
            >
                <Crosshair size={14} />
                Recenter to cluster
            </button>

            <div className="pv-map-ward-label">
                {highlightedSuggestion
                    ? `Your suggestion · ${location.properties.ward} ward`
                    : isEditing
                    ? `Editing pin · ${location.properties.ward} ward`
                    : `Ward · ${location.properties.ward}`}
            </div>
        </div>
    );
}
