import {GeoJSON} from "react-leaflet";
import type {IWardBoundary} from "../../../types/boundaries";
import L, {LatLngBounds} from "leaflet";
import React, {useEffect, useState} from "react";

import BoundaryMap from "../BoundaryMap";
import SelectorShell from "../SelectorShell";
import type {SignupFlow} from "../useSignupFlow";

interface WardStepProps {
    flow: SignupFlow;
}

export default function WardStep({flow}: WardStepProps) {
    const [wards, setWards] = useState<IWardBoundary[] | null>(null);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [bounds, setBounds] = useState<LatLngBounds | null>(null);

    useEffect(() => {
        if (!flow.constituency) {
            flow.resetToStep("constituency");
        }
    }, []);

    useEffect(() => {
        if (!flow.constituency) return;

        fetch(
            `/api/stations/constituencies/${flow.constituency.number}/wards/boundaries/`,
            {method: "GET"},
        )
            .then((res) => res.json())
            .then((data) => {
                setWards(data.features);
                try {
                    if (data.features.length > 0) {
                        const mapBounds = L.geoJSON(data.features).getBounds();
                        setBounds(mapBounds.isValid() ? mapBounds : null);
                    }
                } catch {}
            });
    }, [flow.constituency?.number]);

    if (!flow.constituency) {
        return null;
    }

    const items = (wards ?? []).map((w) => ({
        id: w.properties.number,
        label: w.properties.name,
    }));

    const mapElement = (
        <BoundaryMap bounds={bounds} tileProvider="OpenStreetMap">
            {(wards ?? []).map((ward) => (
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
                const ward = (wards ?? []).find((w) => w.properties.number === id);
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
