import {GeoJSON} from "react-leaflet";
import type {IConstituencyBoundary} from "../../../types/boundaries";
import L, {LatLngBounds} from "leaflet";
import React, {useEffect, useState} from "react";

import BoundaryMap from "../BoundaryMap";
import SelectorShell from "../SelectorShell";
import type {SignupFlow} from "../useSignupFlow";

interface ConstituencyStepProps {
    flow: SignupFlow;
}

export default function ConstituencyStep({flow}: ConstituencyStepProps) {
    const [constituencies, setConstituencies] = useState<
        IConstituencyBoundary[] | null
    >(null);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [bounds, setBounds] = useState<LatLngBounds | null>(null);

    useEffect(() => {
        if (!flow.county) {
            flow.resetToStep("county");
        }
    }, []);

    useEffect(() => {
        if (!flow.county) return;

        fetch(`/api/stations/county/${flow.county.number}/constituencies/boundaries/`, {
            method: "GET",
        })
            .then((res) => res.json())
            .then((data) => {
                setConstituencies(data.features);
                try {
                    if (data.features.length > 0) {
                        const mapBounds = L.geoJSON(data.features).getBounds();
                        setBounds(mapBounds.isValid() ? mapBounds : null);
                    }
                } catch {}
            });
    }, [flow.county?.number]);

    if (!flow.county) {
        return null;
    }

    const items = (constituencies ?? []).map((c) => ({
        id: c.properties.number,
        label: c.properties.name,
    }));

    const mapElement = (
        <BoundaryMap bounds={bounds} tileProvider="OpenStreetMap">
            {(constituencies ?? []).map((constituency) => (
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
                const constituency = (constituencies ?? []).find(
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
