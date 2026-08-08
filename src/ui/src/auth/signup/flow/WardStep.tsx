import {GeoJSON} from "react-leaflet";
import type {IWardBoundary} from "../../../types/boundaries";
import L, {LatLngBounds} from "leaflet";
import React, {useEffect, useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";

import BoundaryMap from "../BoundaryMap";
import CountiesLoadingScreen from "../LoadingScreen";
import SelectorShell from "../SelectorShell";
import type {SignupFlow} from "../useSignupFlow";
import {wardBoundariesUrl} from "../../../api/apiUrls";
import {boundaryKeys} from "../../../api/queryKeys";
import {querySettings} from "../../../api/querySettings";

interface WardStepProps {
    flow: SignupFlow;
}

interface WardBoundaryResponse {
    features: IWardBoundary[];
}

export default function WardStep({flow}: WardStepProps) {
    const [activeId, setActiveId] = useState<number | null>(null);

    useEffect(() => {
        if (!flow.constituency) {
            flow.resetToStep("constituency");
        }
    }, []);

    const constituencyNumber = flow.constituency?.number;

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

        // No constituency means the effect above is already sending us back a step.
        enabled: constituencyNumber !== undefined,

        ...querySettings.boundaries,
    });

    // Read straight off `data` rather than defaulting to `[]`, so the
    // reference is stable between renders and the memo below is not rebuilt
    // every time.
    const wards = wardsQuery.data?.features;

    const bounds = useMemo<LatLngBounds | null>(() => {
        if (!wards || wards.length === 0) return null;
        try {
            const mapBounds = L.geoJSON(wards).getBounds();
            return mapBounds.isValid() ? mapBounds : null;
        } catch {
            // Bounds computation failed — the map renders without them.
            return null;
        }
    }, [wards]);

    if (!flow.constituency) {
        return null;
    }

    if (wardsQuery.isPending) {
        return <CountiesLoadingScreen />;
    }

    if (wardsQuery.isError) {
        return (
            <div className="welcome">
                <h2>Could not load wards</h2>
                <p className="lede">{wardsQuery.error.message}</p>
                <button
                    type="button"
                    className="geo-back"
                    onClick={() => wardsQuery.refetch()}
                >
                    Try again
                </button>
            </div>
        );
    }

    // A successful response with nothing in it is empty, not broken.
    if (!wards || wards.length === 0) {
        return (
            <div className="welcome">
                <h2>No wards available</h2>
                <p className="lede">
                    {flow.constituency.name} has no ward boundaries loaded. If you are
                    running this locally, check that the data scripts have been
                    executed.
                </p>
                <button type="button" className="geo-back" onClick={flow.back}>
                    Back
                </button>
            </div>
        );
    }

    const items = wards.map((w) => ({
        id: w.properties.number,
        label: w.properties.name,
    }));

    const mapElement = (
        <BoundaryMap bounds={bounds} tileProvider="OpenStreetMap">
            {wards.map((ward) => (
                <GeoJSON
                    key={ward.id}
                    data={ward}
                    style={() => ({
                        fillColor:
                            activeId === ward.properties.number ? "blue" : "gray",
                        fillOpacity: 0.5,
                        color: "black",
                        weight: 1,
                    })}
                />
            ))}
        </BoundaryMap>
    );

    return (
        <SelectorShell
            accentWord="Ward"
            variant="ward"
            step={3}
            items={items}
            activeId={activeId}
            onPick={(id) => setActiveId(id as number)}
            onSelect={(id) => {
                const ward = wards.find((w) => w.properties.number === id);
                if (ward) {
                    flow.selectWard({
                        number: ward.properties.number,
                        name: ward.properties.name,
                    });
                }
            }}
            onBack={flow.back}
            map={mapElement}
        />
    );
}
