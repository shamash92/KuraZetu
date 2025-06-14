import type React from "react";

import {useState, useRef, useEffect} from "react";
import {motion} from "framer-motion";
import {MapPin, ZoomIn, ZoomOut} from "lucide-react";
import {Button} from "../@/components/ui/button";
import {MapContainer, Marker, Popup, TileLayer} from "react-leaflet";
import L from "leaflet";
import {IPollingCenterFeature} from "./types";
import {GeoJSON, Tooltip} from "react-leaflet";

interface MapComponentProps {
    location: IPollingCenterFeature;
    onPinDrag: (lat: number, lng: number) => void;
    isEditing: boolean;
    suggestedLocation?: IPollingCenterFeature | null;
    partiallyVerifiedLocations?: IPollingCenterFeature[] | null;
}

export default function MapComponent({
    location,
    onPinDrag,
    isEditing,
    suggestedLocation,
    partiallyVerifiedLocations,
}: MapComponentProps) {
    const [pinPosition, setPinPosition] = useState({x: 50, y: 50}); // Percentage position
    const [zoom, setZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const mapRef = useRef<HTMLDivElement>(null);

    // Reset pin position when location changes
    useEffect(() => {
        setPinPosition({x: 50, y: 50});
        setZoom(1);
    }, [location, suggestedLocation]);

    const handleZoomIn = () => {
        setZoom((prev) => Math.min(prev + 0.2, 2));
    };

    const handleZoomOut = () => {
        setZoom((prev) => Math.max(prev - 0.2, 0.5));
    };

    return (
        <div className="relative w-full h-full overflow-hidden bg-gray-800">
            {/* Map Background */}
            <MapContainer
                attributionControl={true}
                center={[
                    suggestedLocation
                        ? suggestedLocation.properties.pin_location.coordinates[1]
                        : location.properties.pin_location.coordinates[1],
                    suggestedLocation
                        ? suggestedLocation.properties.pin_location.coordinates[0]
                        : location.properties.pin_location.coordinates[0],
                ]}
                zoom={18 * zoom}
                // scrollWheelZoom={isEditing}
                style={{width: "100%", height: "100%", zIndex: 1}}
                ref={mapRef as any}
                zoomControl
                touchZoom
                minZoom={16}
                maxZoom={22}
            >
                <TileLayer
                    url="http://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                    attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a> | &copy; <span title="KuraZetu Trademark">KuraZetu™</span>'
                />

                {partiallyVerifiedLocations &&
                    partiallyVerifiedLocations.map((loc) => (
                        <GeoJSON
                            key={loc.id}
                            data={loc}
                            style={() => ({
                                fillColor: "yellow",
                                fillOpacity: 0.3,
                                color: "rgba(255,255,0,0.5)",
                                weight: 1,
                                dashArray: "4 4",
                            })}
                        >
                            <Tooltip permanent>
                                Partially Verified Location
                                <br />
                                {loc.properties.name}
                            </Tooltip>
                        </GeoJSON>
                    ))}

                {suggestedLocation && (
                    <GeoJSON
                        // key={suggestedLocation.id}
                        data={suggestedLocation}
                        style={() => ({
                            fillColor: "blue",
                            fillOpacity: 0.3,
                            color: "rgba(255,0,0,0.5)",
                            weight: 1,
                            dashArray: "4 4",
                        })}
                    >
                        <Tooltip>
                            Suggested Location
                            <br />
                            {suggestedLocation.properties.name}
                        </Tooltip>
                    </GeoJSON>
                )}

                <GeoJSON
                    key={location.id}
                    data={location}
                    style={() => ({
                        fillColor: "gray",
                        fillOpacity: 0.5,
                        color: "black",
                        weight: 1,
                    })}
                />
                <Marker
                    position={[
                        location.properties.pin_location.coordinates[1] +
                            (50 - pinPosition.y) * 0.01,
                        location.properties.pin_location.coordinates[0] +
                            (pinPosition.x - 50) * 0.01,
                    ]}
                    draggable={isEditing}
                    eventHandlers={
                        isEditing
                            ? {
                                  dragend: (e) => {
                                      const marker = e.target;
                                      const {lat, lng} = marker.getLatLng();
                                      onPinDrag(lat, lng);
                                  },
                              }
                            : undefined
                    }
                    icon={
                        new L.Icon({
                            iconUrl: isEditing
                                ? "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-red.png"
                                : "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                            iconSize: [32, 48],
                            iconAnchor: [16, 48],
                            popupAnchor: [0, -48],
                            shadowUrl:
                                "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
                        })
                    }
                >
                    <Popup>
                        <strong>{location.properties.name}</strong>
                        <br />
                        {location.properties.code}
                    </Popup>
                </Marker>
            </MapContainer>

            {/* Zoom Controls */}
            <div className="absolute flex flex-col gap-2 top-4 right-4">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleZoomIn}
                    className="bg-white/90"
                >
                    <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleZoomOut}
                    className="bg-white/90"
                >
                    <ZoomOut className="w-4 h-4" />
                </Button>
            </div>

            {/* Coordinates Display */}
            <div className="absolute px-3 py-2 text-xs text-white rounded bottom-4 right-4 bg-black/70">
                Zoom: {(zoom * 100).toFixed(0)}%
            </div>

            {/* Editing Instructions */}
            {isEditing && (
                <motion.div
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    className="absolute px-4 py-2 text-white bg-red-500 rounded-lg shadow-lg bottom-4 left-4"
                >
                    <p className="text-sm font-medium">
                        Drag the pin to correct location
                    </p>
                </motion.div>
            )}
        </div>
    );
}
