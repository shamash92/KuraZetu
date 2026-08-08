import {Marker, Popup, Tooltip} from "react-leaflet";
import type {IPollingCenterLocation, IWardBoundary} from "../../../types/boundaries";
import L, {LatLng, LatLngBounds} from "leaflet";
import React, {useEffect, useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";

import BoundaryMap from "../BoundaryMap";
import CountiesLoadingScreen from "../LoadingScreen";
import SelectorShell from "../SelectorShell";
import type {SignupFlow} from "../useSignupFlow";
import {pollingCenterPinsUrl, wardBoundariesUrl} from "../../../api/apiUrls";
import {boundaryKeys} from "../../../api/queryKeys";
import {querySettings} from "../../../api/querySettings";

interface PollingStepProps {
    flow: SignupFlow;
}

interface PollingCenterResponse {
    features: IPollingCenterLocation[];
}

interface WardBoundaryResponse {
    features: IWardBoundary[];
}

export default function PollingStep({flow}: PollingStepProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    // Where the user has zoomed to. `null` means "no pin picked", and the map
    // falls back to the ward's own bounds below.
    const [zoomBounds, setZoomBounds] = useState<LatLngBounds | null>(null);
    const [tileProvider, setTileProvider] = useState<"Google" | "OpenStreetMap">(
        "OpenStreetMap",
    );
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!flow.ward) {
            flow.resetToStep("ward");
        }
    }, []);

    const wardNumber = flow.ward?.number;
    const constituencyNumber = flow.constituency?.number;

    const pollingCentersQuery = useQuery({
        queryKey: boundaryKeys.pollingCenters(wardNumber!),

        queryFn: async ({signal}): Promise<PollingCenterResponse> => {
            const response = await fetch(pollingCenterPinsUrl(wardNumber!), {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    Accept: "application/json",
                },
                signal,
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw Object.assign(
                    new Error(data?.error ?? "Could not load polling centres"),
                    {
                        status: response.status,
                        payload: data,
                    },
                );
            }

            return data;
        },

        // No ward means the effect above is already sending us back a step.
        enabled: wardNumber !== undefined,

        ...querySettings.boundaries,
    });

    // Same key the ward step used, so arriving here from that step reads the
    // response out of the cache instead of refetching it. Only one ward's
    // geometry is wanted, for resetting the zoom when a centre has no pin.
    const wardsQuery = useQuery({
        queryKey: boundaryKeys.wards(constituencyNumber!),

        queryFn: async ({signal}): Promise<WardBoundaryResponse> => {
            const response = await fetch(wardBoundariesUrl(constituencyNumber!), {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    Accept: "application/json",
                },
                signal,
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw Object.assign(new Error(data?.error ?? "Could not load wards"), {
                    status: response.status,
                    payload: data,
                });
            }

            return data;
        },

        enabled: constituencyNumber !== undefined,

        ...querySettings.boundaries,
    });

    // Read straight off `data` rather than defaulting to `[]`, so the
    // reference is stable between renders and the memos below are not rebuilt
    // every time.
    const pollingCenters = pollingCentersQuery.data?.features;
    const wards = wardsQuery.data?.features;

    const wardBounds = useMemo<LatLngBounds | null>(() => {
        const ward = wards?.find((w) => w.properties.number === wardNumber);
        if (!ward) return null;
        try {
            const mapBounds = L.geoJSON(ward.geometry).getBounds();
            return mapBounds.isValid() ? mapBounds : null;
        } catch {
            // Bounds computation failed — the map renders without them.
            return null;
        }
    }, [wards, wardNumber]);

    if (!flow.ward) {
        return null;
    }

    if (pollingCentersQuery.isPending) {
        return <CountiesLoadingScreen />;
    }

    if (pollingCentersQuery.isError) {
        return (
            <div className="welcome">
                <h2>Could not load polling centres</h2>
                <p className="lede">{pollingCentersQuery.error.message}</p>
                <button
                    type="button"
                    className="geo-back"
                    onClick={() => pollingCentersQuery.refetch()}
                >
                    Try again
                </button>
            </div>
        );
    }

    // A successful response with nothing in it is empty, not broken.
    if (!pollingCenters || pollingCenters.length === 0) {
        return (
            <div className="welcome">
                <h2>No polling centres available</h2>
                <p className="lede">
                    {flow.ward.name} has no polling centres loaded. If you are running
                    this locally, check that the data scripts have been executed.
                </p>
                <button type="button" className="geo-back" onClick={flow.back}>
                    Back
                </button>
            </div>
        );
    }

    // A failed ward-bounds read only costs the zoom reset, so it does not get
    // its own error screen.
    const bounds = zoomBounds ?? wardBounds;

    const handlePollingCenterZoom = (pollingCenter: IPollingCenterLocation) => {
        const geometry = pollingCenter.geometry;
        setErrorMessage(pollingCenter.properties.pin_location_error);

        if (geometry !== null && geometry.coordinates[0] !== 0) {
            setTileProvider("Google");
            const latLng = new LatLng(geometry.coordinates[1], geometry.coordinates[0]);
            const mapBounds = L.latLngBounds(latLng, latLng);
            setZoomBounds(mapBounds.isValid() ? mapBounds : null);
        } else {
            // Reset zoom and bounds back to the ward if pin location is not present
            setTileProvider("OpenStreetMap");
            setZoomBounds(null);
        }
    };

    const items = pollingCenters.map((pc) => ({
        id: pc.properties.code,
        label: pc.properties.name,
    }));

    const mapElement = (
        <BoundaryMap
            bounds={bounds}
            tileProvider={tileProvider}
            errorMessage={errorMessage}
        >
            {pollingCenters.map((pollingCenter) => {
                return pollingCenter.geometry !== null ? (
                    <Marker
                        key={pollingCenter.id}
                        position={[
                            pollingCenter.geometry.coordinates[1],
                            pollingCenter.geometry.coordinates[0],
                        ]}
                        icon={L.icon({
                            iconUrl: pollingCenter.properties.is_verified
                                ? "https://kurazetu.s3.eu-west-1.amazonaws.com/static/pins/verified.png"
                                : pollingCenter.properties.pin_location_error
                                  ? "https://cdn-icons-png.flaticon.com/512/684/684908.png"
                                  : "https://kurazetu.s3.eu-west-1.amazonaws.com/static/pins/unverified.png",
                            iconSize: [25, 25],
                            iconAnchor: [12, 41],
                            popupAnchor: [0, -41],
                        })}
                        eventHandlers={{
                            click: () => {
                                setActiveId(pollingCenter.properties.code);
                            },
                        }}
                    >
                        <Popup>
                            <p>{pollingCenter.properties.name}</p>
                            <p>{pollingCenter.properties.code}</p>
                        </Popup>

                        {tileProvider === "Google" && (
                            <Tooltip permanent>
                                <p className="text-xs text-gray-700">
                                    {pollingCenter.properties.name}
                                </p>
                            </Tooltip>
                        )}
                    </Marker>
                ) : null;
            })}
        </BoundaryMap>
    );

    return (
        <SelectorShell
            accentWord="Polling Center"
            variant="polling"
            step={4}
            items={items}
            activeId={activeId}
            onPick={(id) => {
                const code = id as string;
                setActiveId(code);
                const pollingCenter = pollingCenters.find(
                    (pc) => pc.properties.code === code,
                );
                if (pollingCenter) {
                    handlePollingCenterZoom(pollingCenter);
                }
            }}
            onSelect={(id) => {
                const code = id as string;
                const pollingCenter = pollingCenters.find(
                    (pc) => pc.properties.code === code,
                );
                if (pollingCenter) {
                    flow.selectPollingCenter({
                        code: pollingCenter.properties.code,
                        name: pollingCenter.properties.name,
                    });
                }
            }}
            onBack={flow.back}
            map={mapElement}
        />
    );
}
