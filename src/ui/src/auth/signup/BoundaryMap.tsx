import {MapContainer, TileLayer, useMap} from "react-leaflet";
import React, {useEffect} from "react";

import type {LatLngBounds} from "leaflet";

const googleBasemapUrls = {
    satellite: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    street: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
} as const;

interface BoundaryMapProps {
    bounds: LatLngBounds | null;
    basemap?: keyof typeof googleBasemapUrls;
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
    basemap = "street",
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

                <TileLayer
                    url={googleBasemapUrls[basemap]}
                    attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
                />

                {children}
            </MapContainer>

            {errorMessage && <div className="geo-toast">{errorMessage}</div>}
        </div>
    );
}
