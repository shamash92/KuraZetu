import {GeoJSON} from "react-leaflet";
import type {ICountyBoundary} from "../../../types/boundaries";
import L, {LatLngBounds} from "leaflet";
import React, {useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";

import BoundaryMap from "../BoundaryMap";
import CountiesLoadingScreen from "../LoadingScreen";
import SelectorShell from "../SelectorShell";
import type {SignupFlow} from "../useSignupFlow";
import {COUNTY_BOUNDARIES_URL} from "../../../api/apiUrls";
import {boundaryKeys} from "../../../api/queryKeys";
import {querySettings} from "../../../api/querySettings";

interface CountyStepProps {
    flow: SignupFlow;
}

interface CountyBoundaryResponse {
    features: ICountyBoundary[];
}

export default function CountyStep({flow}: CountyStepProps) {
    const [activeId, setActiveId] = useState<number | null>(null);

    const countiesQuery = useQuery({
        queryKey: boundaryKeys.counties(),

        queryFn: async ({signal}): Promise<CountyBoundaryResponse> => {
            const response = await fetch(COUNTY_BOUNDARIES_URL, {
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
                    new Error(data?.error ?? "Could not load county boundaries"),
                    {
                        status: response.status,
                        payload: data,
                    },
                );
            }

            return data;
        },

        ...querySettings.boundaries,
    });

    // Read straight off `data` rather than defaulting to `[]`, so the
    // reference is stable between renders and the memo below is not rebuilt
    // every time.
    const counties = countiesQuery.data?.features;

    const bounds = useMemo<LatLngBounds | null>(() => {
        if (!counties || counties.length === 0) return null;
        try {
            const mapBounds = L.geoJSON(counties).getBounds();
            return mapBounds.isValid() ? mapBounds : null;
        } catch {
            // Bounds computation failed — the map renders without them.
            return null;
        }
    }, [counties]);

    if (countiesQuery.isPending) {
        return <CountiesLoadingScreen />;
    }

    if (countiesQuery.isError) {
        return (
            <div className="welcome">
                <h2>Could not load counties</h2>
                <p className="lede">{countiesQuery.error.message}</p>
                <button
                    type="button"
                    className="geo-back"
                    onClick={() => countiesQuery.refetch()}
                >
                    Try again
                </button>
            </div>
        );
    }

    // A successful response with nothing in it is empty, not broken.
    if (!counties || counties.length === 0) {
        return (
            <div className="welcome">
                <h2>No counties available</h2>
                <p className="lede">
                    County boundaries have not been loaded yet. If you are running
                    this locally, check that the data scripts have been executed.
                </p>
            </div>
        );
    }

    const items = counties.map((c) => ({
        id: c.properties.number,
        label: c.properties.name,
    }));

    const mapElement = (
        <BoundaryMap bounds={bounds} tileProvider="OpenStreetMap">
            {counties.map((county) => (
                <GeoJSON
                    key={county.id}
                    data={county}
                    style={() => ({
                        fillColor:
                            activeId === county.properties.number ? "blue" : "gray",
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
            accentWord="County"
            variant="county"
            step={1}
            items={items}
            activeId={activeId}
            onPick={(id) => setActiveId(id as number)}
            onSelect={(id) => {
                const county = counties.find((c) => c.properties.number === id);
                if (county) {
                    flow.selectCounty({
                        number: county.properties.number,
                        name: county.properties.name,
                    });
                }
            }}
            onBack={flow.back}
            map={mapElement}
        />
    );
}
