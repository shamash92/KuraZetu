import React, {useRef, useState} from "react";
import {
    MapContainer,
    Marker,
    TileLayer,
    useMapEvents,
    Polyline,
    Tooltip,
    Circle,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {Button} from "../@/components/ui/button";
import {Card, CardContent} from "../@/components/ui/card";
import L from "leaflet";

type PinEditComponentProps = {
    initialPosition: {lat: number; lng: number};
    onSave: (lat: number, lng: number) => Promise<void>;
};

// Haversine formula to calculate distance between two points
function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Convert to meters
}

function formatDistance(distanceInMeters: number): string {
    if (distanceInMeters < 1000) {
        return `${distanceInMeters.toFixed(1)}m`;
    } else {
        return `${(distanceInMeters / 1000).toFixed(2)}km`;
    }
}

function CenterMarker({position}: {position: {lat: number; lng: number}}) {
    // Custom marker icon (optional)
    const icon = L.icon({
        iconUrl:
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
        // shadowSize: [41, 41],
        // shadowAnchor: [12, 41],

        iconSize: [25, 41],
        iconAnchor: [12, 41],
    });

    return (
        <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-[400] -translate-x-1/2 -translate-y-full"
            style={{marginTop: "15px"}}
        >
            <img
                src={icon.options.iconUrl as string}
                alt="marker"
                width={25}
                height={41}
            />
        </div>
    );
}

function MapEvents({
    setCenter,
    initialPosition,
}: {
    setCenter: (c: {lat: number; lng: number}) => void;
    initialPosition: {lat: number; lng: number};
}) {
    const map = useMapEvents({
        dragend() {
            const center = map.getCenter();
            setCenter({lat: center.lat, lng: center.lng});

            const distance = calculateDistance(
                initialPosition.lat,
                initialPosition.lng,
                center.lat,
                center.lng,
            );

            // Dynamically adjust zoom based on distance, but only on drag
            let newZoom =
                distance > 1000
                    ? 15
                    : distance > 300
                    ? 16
                    : distance > 200
                    ? 17
                    : distance > 100
                    ? 18
                    : 19;

            // Only set zoom if it actually needs to change and avoid infinite loop
            if (map.getZoom() !== newZoom && newZoom !== 19) {
                map.setZoom(newZoom);
            }
        },
    });
    return null;
}

export const PinEditComponent: React.FC<PinEditComponentProps> = ({
    initialPosition,
    onSave,
}) => {
    const [center, setCenter] = useState(initialPosition);
    const [saving, setSaving] = useState(false);
    const mapRef = useRef<L.Map | null>(null);

    // Calculate distance between initial position and current center
    const distance = calculateDistance(
        initialPosition.lat,
        initialPosition.lng,
        center.lat,
        center.lng,
    );

    // Only show line if there's a meaningful distance (more than 1 meter)
    const showDistanceLine = distance > 1;

    return (
        <Card className="w-full mx-auto shadow-lg md:mt-2">
            <CardContent className="flex flex-col ">
                <div className="font-mono text-sm text-center md:mb-1">
                    Lat: <span className="font-bold">{center.lat.toFixed(6)}</span>,
                    Lng: <span className="font-bold">{center.lng.toFixed(6)}</span>
                    {showDistanceLine && (
                        <span className="ml-2 font-semibold text-orange-600">
                            Distance: {formatDistance(distance)}
                        </span>
                    )}
                </div>
                <div className="relative w-full overflow-hidden border rounded-md h-[50vh]">
                    <p>Distance: {distance}</p>
                    <MapContainer
                        center={initialPosition}
                        zoom={19}
                        minZoom={14}
                        scrollWheelZoom={true}
                        style={{height: "100%", width: "100%"}}
                        className="z-0"
                    >
                        <TileLayer
                            url="http://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                            attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a> | &copy; <span title="KuraZetu Trademark">KuraZetu™</span>'
                        />
                        <MapEvents
                            setCenter={setCenter}
                            initialPosition={initialPosition}
                        />

                        {/* Fixed marker at initial position */}
                        <Marker
                            icon={L.icon({
                                iconUrl:
                                    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                            })}
                            position={[initialPosition.lat, initialPosition.lng]}
                        />

                        {/* 100m radius circle around the original pin */}
                        <Circle
                            center={initialPosition}
                            radius={50}
                            pathOptions={{
                                color: "black",
                                fillColor: "#2563eb",
                                fillOpacity: 0.1,
                                weight: 2,
                            }}
                        />

                        {/* 100m radius circle around the center */}
                        {distance > 1 && (
                            <Circle
                                center={center}
                                radius={50}
                                pathOptions={{
                                    color: "red",
                                    fillColor: "#2563eb",
                                    fillOpacity: 0.1,
                                    weight: 2,
                                }}
                            />
                        )}

                        {/* Dotted line between markers when there's distance */}
                        {showDistanceLine && (
                            <Polyline
                                positions={[
                                    [initialPosition.lat, initialPosition.lng],
                                    [center.lat, center.lng],
                                ]}
                                pathOptions={{
                                    color: "#ff6b35",
                                    weight: 3,
                                    opacity: 0.8,
                                    dashArray: "10, 10", // Creates dotted line
                                }}
                            >
                                <Tooltip
                                    permanent
                                    direction="top"
                                    position={{
                                        lat: (initialPosition.lat + center.lat) / 2,
                                        lng: (initialPosition.lng + center.lng) / 2,
                                    }}
                                    className="distance-tooltip"
                                >
                                    <div className="px-2 py-1 text-xs font-semibold bg-white rounded shadow">
                                        {formatDistance(distance)}
                                    </div>
                                </Tooltip>
                            </Polyline>
                        )}
                    </MapContainer>
                    <CenterMarker position={center} />
                </div>

                {center.lat !== initialPosition.lat ||
                center.lng !== initialPosition.lng ? (
                    <div className="mt-2 text-sm text-red-500">
                        <p>
                            The pin has been moved from its original position. Please
                            review the changes before saving.
                        </p>

                        <Button
                            className="mt-2 text-white bg-blue-600 w-full hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                            disabled={saving}
                            onClick={async () => {
                                setSaving(true);
                                try {
                                    await onSave(center.lat, center.lng);
                                } finally {
                                    setSaving(false);
                                }
                            }}
                        >
                            {saving ? "Saving..." : "Save"}
                        </Button>
                    </div>
                ) : (
                    <div className="mt-2 text-sm text-green-500">
                        <p>The pin is at the original position.</p>
                        <p className="mt-1 text-center text-md">
                            Start dragging the map to move the pin to the correct
                            position.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default PinEditComponent;
