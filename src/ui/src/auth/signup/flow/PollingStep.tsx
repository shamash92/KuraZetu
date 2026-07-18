import {Marker, Popup, Tooltip} from "react-leaflet";
import type {IPollingCenterLocation} from "../../../types/boundaries";
import L, {LatLng, LatLngBounds} from "leaflet";
import React, {useEffect, useState} from "react";

import BoundaryMap from "../BoundaryMap";
import SelectorShell from "../SelectorShell";
import type {SignupFlow} from "../useSignupFlow";

interface PollingStepProps {
    flow: SignupFlow;
}

export default function PollingStep({flow}: PollingStepProps) {
    const [pollingCenters, setPollingCenters] = useState<
        IPollingCenterLocation[] | null
    >(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [bounds, setBounds] = useState<LatLngBounds | null>(null);
    const [wardBounds, setWardBounds] = useState<LatLngBounds | null>(null);
    const [tileProvider, setTileProvider] = useState<"Google" | "OpenStreetMap">(
        "OpenStreetMap",
    );
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!flow.ward) {
            flow.resetToStep("ward");
        }
    }, []);

    useEffect(() => {
        if (!flow.ward) return;

        fetch(`/api/stations/wards/${flow.ward.number}/polling-centers/pins/`, {
            method: "GET",
        })
            .then((res) => res.json())
            .then((data) => {
                setPollingCenters(data.features);
            });
    }, [flow.ward?.number]);

    // Compute ward bounds once ward data is set (for zoom reset)
    useEffect(() => {
        if (!flow.ward) return;
        // Fetch the ward geometry to compute wardBounds for reset-on-error
        fetch(
            `/api/stations/constituencies/${flow.constituency?.number}/wards/boundaries/`,
            {method: "GET"},
        )
            .then((res) => res.json())
            .then((data) => {
                const wardFeature = data.features.find(
                    (w: {properties: {number: number}}) =>
                        w.properties.number === flow.ward?.number,
                );
                if (wardFeature) {
                    try {
                        const mapBounds = L.geoJSON(wardFeature.geometry).getBounds();
                        if (mapBounds.isValid()) {
                            setBounds(mapBounds);
                            setWardBounds(mapBounds);
                        }
                    } catch {}
                }
            });
    }, [flow.ward?.number]);

    if (!flow.ward) {
        return null;
    }

    const handlePollingCenterZoom = (pollingCenter: IPollingCenterLocation) => {
        const geometry = pollingCenter.geometry;
        const errorMsg = pollingCenter.properties.pin_location_error;
        setErrorMessage(errorMsg);

        if (geometry !== null && geometry.coordinates[0] !== 0) {
            setTileProvider("Google");
            const latLng = new LatLng(geometry.coordinates[1], geometry.coordinates[0]);
            const mapBounds = L.latLngBounds(latLng, latLng);
            setBounds(mapBounds.isValid() ? mapBounds : null);
        } else {
            // Reset zoom and bounds back to the ward if pin location is not present
            setTileProvider("OpenStreetMap");
            setBounds(wardBounds);
        }
    };

    const items = (pollingCenters ?? []).map((pc) => ({
        id: pc.properties.code,
        label: pc.properties.name,
    }));

    const mapElement = (
        <BoundaryMap
            bounds={bounds}
            tileProvider={tileProvider}
            errorMessage={errorMessage}
        >
            {(pollingCenters ?? []).map((pollingCenter) => {
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
                const pollingCenter = (pollingCenters ?? []).find(
                    (pc) => pc.properties.code === code,
                );
                if (pollingCenter) {
                    handlePollingCenterZoom(pollingCenter);
                }
            }}
            onSelect={(id) => {
                const code = id as string;
                const pollingCenter = (pollingCenters ?? []).find(
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
