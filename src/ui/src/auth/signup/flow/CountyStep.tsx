import {GeoJSON} from "react-leaflet";
import type {ICountyBoundary} from "../../../types/boundaries";
import L, {LatLngBounds} from "leaflet";
import React, {useEffect, useState} from "react";

import BoundaryMap from "../BoundaryMap";
import CountiesLoadingScreen from "../LoadingScreen";
import SelectorShell from "../SelectorShell";
import type {SignupFlow} from "../useSignupFlow";

interface CountyStepProps {
    flow: SignupFlow;
}

export default function CountyStep({flow}: CountyStepProps) {
    const [counties, setCounties] = useState<ICountyBoundary[] | null>(null);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [bounds, setBounds] = useState<LatLngBounds | null>(null);

    useEffect(() => {
        if (counties === null || counties.length <= 0) {
            fetch("/api/stations/counties/boundaries/", {
                method: "GET",
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.features.length > 0) {
                        setCounties(data.features);
                    }
                    try {
                        if (data.features.length > 0) {
                            const mapBounds = L.geoJSON(data.features).getBounds();
                            setBounds(mapBounds.isValid() ? mapBounds : null);
                        }
                    } catch (err) {
                        // bounds computation failed — map stays null
                    }
                });
        }
    }, [counties]);

    if (counties === null || counties.length === 0) {
        return <CountiesLoadingScreen />;
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
