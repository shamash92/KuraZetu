import {MapContainer, TileLayer, useMap} from "react-leaflet";
import React, {useEffect} from "react";

import type {LatLngBounds} from "leaflet";

interface BoundaryMapProps {
    bounds: LatLngBounds | null;
    tileProvider: "Google" | "OpenStreetMap";
    errorMessage?: string | null;
    children?: React.ReactNode;
}

// Fits the map within the bounds whenever they change. Timing is sensitive —
// do not inline the fit into a parent effect.
function FitBoundsMap({bounds}: {bounds: LatLngBounds | null}) {
    const map = useMap();

    useEffect(() => {
        if (bounds && map) {
            map.fitBounds(bounds, {padding: [10, 10]});
        }
    }, [bounds, map]);

    return null;
}

export default function BoundaryMap({
    bounds,
    tileProvider,
    errorMessage,
    children,
}: BoundaryMapProps) {
    if (!bounds) {
        return (
            <div className="geo-map">
                <div className="geo-map-loading">loading map …</div>
            </div>
        );
    }

    return (
        <div className="geo-map">
            <MapContainer
                center={[0, 37]}
                zoom={7}
                style={{height: "100%", width: "100%"}}
                bounds={bounds}
                maxBounds={bounds}
            >
                <FitBoundsMap bounds={bounds} />

                {tileProvider === "Google" ? (
                    <TileLayer
                        url="http://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                        attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
                    />
                ) : (
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                )}

                {children}
            </MapContainer>

            {errorMessage && <div className="geo-toast">{errorMessage}</div>}
        </div>
    );
}
