import {GeoJSON} from "react-leaflet";
import type {IConstituencyBoundary} from "../../../types/boundaries";
import L, {LatLngBounds} from "leaflet";
import React, {useEffect, useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";

import BoundaryMap from "../BoundaryMap";
import CountiesLoadingScreen from "../LoadingScreen";
import SelectorShell from "../SelectorShell";
import type {SignupFlow} from "../useSignupFlow";
import {constituencyBoundariesUrl} from "../../../api/apiUrls";
import {boundaryKeys} from "../../../api/queryKeys";
import {querySettings} from "../../../api/querySettings";

interface ConstituencyStepProps {
    flow: SignupFlow;
}

interface ConstituencyBoundaryResponse {
    features: IConstituencyBoundary[];
}

export default function ConstituencyStep({flow}: ConstituencyStepProps) {
    const [activeId, setActiveId] = useState<number | null>(null);

    useEffect(() => {
        if (!flow.county) {
            flow.resetToStep("county");
        }
    }, []);

    const countyNumber = flow.county?.number;

    const constituenciesQuery = useQuery({
        queryKey: boundaryKeys.constituencies(countyNumber!),

        queryFn: async ({signal}): Promise<ConstituencyBoundaryResponse> => {
            const response = await fetch(constituencyBoundariesUrl(countyNumber!), {
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
                    new Error(data?.error ?? "Could not load constituencies"),
                    {
                        status: response.status,
                        payload: data,
                    },
                );
            }

            return data;
        },

        // No county means the effect above is already sending us back a step.
        enabled: countyNumber !== undefined,

        ...querySettings.boundaries,
    });

    // Read straight off `data` rather than defaulting to `[]`, so the
    // reference is stable between renders and the memo below is not rebuilt
    // every time.
    const constituencies = constituenciesQuery.data?.features;

    const bounds = useMemo<LatLngBounds | null>(() => {
        if (!constituencies || constituencies.length === 0) return null;
        try {
            const mapBounds = L.geoJSON(constituencies).getBounds();
            return mapBounds.isValid() ? mapBounds : null;
        } catch {
            // Bounds computation failed — the map renders without them.
            return null;
        }
    }, [constituencies]);

    if (!flow.county) {
        return null;
    }

    if (constituenciesQuery.isPending) {
        return <CountiesLoadingScreen />;
    }

    if (constituenciesQuery.isError) {
        return (
            <div className="welcome">
                <h2>Could not load constituencies</h2>
                <p className="lede">{constituenciesQuery.error.message}</p>
                <button
                    type="button"
                    className="geo-back"
                    onClick={() => constituenciesQuery.refetch()}
                >
                    Try again
                </button>
            </div>
        );
    }

    // A successful response with nothing in it is empty, not broken.
    if (!constituencies || constituencies.length === 0) {
        return (
            <div className="welcome">
                <h2>No constituencies available</h2>
                <p className="lede">
                    {flow.county.name} has no constituency boundaries loaded. If you are
                    running this locally, check that the data scripts have been
                    executed.
                </p>
                <button type="button" className="geo-back" onClick={flow.back}>
                    Back
                </button>
            </div>
        );
    }

    const items = constituencies.map((c) => ({
        id: c.properties.number,
        label: c.properties.name,
    }));

    const mapElement = (
        <BoundaryMap bounds={bounds} tileProvider="OpenStreetMap">
            {constituencies.map((constituency) => (
                <GeoJSON
                    key={constituency.id}
                    data={constituency}
                    style={() => ({
                        fillColor:
                            activeId === constituency.properties.number
                                ? "blue"
                                : "gray",
                        fillOpacity: 0.5,
                        color: "black",
                        weight: 1,
                    })}
                    onEachFeature={(feature, layer) => {
                        layer
                            .bindPopup(`<p> ${feature.properties.name}</p>`)
                            .openPopup();
                    }}
                />
            ))}
        </BoundaryMap>
    );

    return (
        <SelectorShell
            accentWord="Constituency"
            variant="constituency"
            step={2}
            items={items}
            activeId={activeId}
            onPick={(id) => setActiveId(id as number)}
            onSelect={(id) => {
                const constituency = constituencies.find(
                    (c) => c.properties.number === id,
                );
                if (constituency) {
                    flow.selectConstituency({
                        number: constituency.properties.number,
                        name: constituency.properties.name,
                    });
                }
            }}
            onBack={flow.back}
            map={mapElement}
        />
    );
}
