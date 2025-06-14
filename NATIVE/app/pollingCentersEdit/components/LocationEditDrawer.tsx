import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {MapPin, Save, X} from "lucide-react-native";
import MapView, {PROVIDER_GOOGLE} from "react-native-maps";
import React, {useEffect, useState} from "react";
import {getStatusColor, getStatusText} from "../(utils)/LocationService";

import {IPollingCenterFeature} from "../types/Location";

interface LocationEditDrawerProps {
    location: IPollingCenterFeature | null;
    visible: boolean;
    onClose: () => void;
    onSave: (location: IPollingCenterFeature) => Promise<void>;
    onUpdateCoordinates: (lat: number, lng: number) => void;
    GOOGLE_MAPS_API_KEY: string;
}
const LocationEditDrawer: React.FC<LocationEditDrawerProps> = ({
    location,
    visible,
    onClose,
    onSave,
    onUpdateCoordinates,
    GOOGLE_MAPS_API_KEY,
}) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [address, setAddress] = useState("");
    const [category, setCategory] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");

    const [suggestions, setSuggestions] = useState<
        {description: string; place_id: string}[]
    >([]);

    useEffect(() => {
        if (location) {
            setTitle(location.properties.name);
            setDescription(location.properties.code);
            setAddress(location.properties.code || "");
            setCategory(location.properties.code || "");
            setLatitude(location.geometry.coordinates[1].toString());
            setLongitude(location.geometry.coordinates[0].toString());
        }
    }, []);

    const handleSave = async () => {
        if (!location) return;

        setIsSaving(true);
        try {
            const updatedLocation: IPollingCenterFeature = {
                ...location,
                title,
                description,
                address,
                category,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
            };

            await onSave(updatedLocation);
            onClose();
        } catch (error) {
            console.error("Error saving location:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCoordinateChange = () => {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (!isNaN(lat) && !isNaN(lng)) {
            onUpdateCoordinates(lat, lng);
        }
    };

    if (!visible || !location) return null;

    const statusColor = getStatusColor(location);
    const statusText = getStatusText(location);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <View
                style={{
                    // flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottomWidth: 1,
                    borderBottomColor: "#F1F5F9",
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                }}
            >
                <Text style={styles.title}>Edit {location.properties.name}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <X size={24} color="#64748B" />
                </TouchableOpacity>
            </View>

            {/* Map */}
            <View
                style={{
                    flex: 7,
                    paddingHorizontal: 20,
                    backgroundColor: "#Fefe",
                }}
            >
                <View
                    style={{
                        flex: 1,
                        borderRadius: 12,
                        overflow: "hidden",
                        marginBottom: 16,
                    }}
                >
                    <View
                        style={{
                            backgroundColor: "#F1F5F9",
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            marginBottom: 8,
                            flexDirection: "row",
                            alignItems: "center",
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 15,
                                color: "#64748B",
                                fontStyle: "italic",
                            }}
                        >
                            💡 Tip: Drag the map to place the pin in the correct place
                        </Text>
                    </View>

                    <View style={{flex: 1}}>
                        {/* <Text>Latitude: {latitude}</Text>
                        <Text>Longitude: {longitude}</Text>
                        <Text>GOOGLE_MAPS_API_KEY: {GOOGLE_MAPS_API_KEY}</Text> */}
                        <MapView
                            key={"x"}
                            provider={PROVIDER_GOOGLE}
                            style={{flex: 1}}
                            mapType="satellite"
                            initialRegion={{
                                latitude: parseFloat(latitude) || 0,
                                longitude: parseFloat(longitude) || 0,
                                latitudeDelta: 0.005,
                                longitudeDelta: 0.005,
                            }}
                            region={{
                                latitude: parseFloat(latitude) || 0,
                                longitude: parseFloat(longitude) || 0,
                                latitudeDelta: 0.005,
                                longitudeDelta: 0.005,
                            }}
                            onRegionChangeComplete={(region) => {
                                setLatitude(region.latitude.toString());
                                setLongitude(region.longitude.toString());
                                onUpdateCoordinates(region.latitude, region.longitude);
                            }}
                        />
                        {/* Geocoder input */}
                        <View
                            style={{
                                position: "absolute",
                                top: 16,
                                left: 16,
                                right: 16,
                                zIndex: 99999,
                            }}
                        >
                            {/* <Text>Suggestions: {JSON.stringify(suggestions)}</Text> */}
                            <TextInput
                                placeholder="Search for a place or address"
                                style={{
                                    backgroundColor: "#fff",
                                    borderRadius: 8,
                                    padding: 10,
                                    borderWidth: 1,
                                    borderColor: "#E2E8F0",
                                    fontSize: 16,
                                }}
                                value={searchQuery ? searchQuery : ""}
                                onChangeText={async (text) => {
                                    setSearchQuery(text);
                                    if (text.length > 2) {
                                        try {
                                            const response = await fetch(
                                                `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
                                                    text,
                                                )}&key=${GOOGLE_MAPS_API_KEY}&components=country:ke`,
                                            );
                                            const data = await response.json();
                                            console.log(data, "data");
                                            setSuggestions(
                                                data.predictions?.map((p: any) => ({
                                                    description: p.description,
                                                    place_id: p.place_id,
                                                })) || [],
                                            );
                                        } catch (err) {
                                            setSuggestions([]);
                                        }
                                    } else {
                                        setSuggestions([]);
                                    }
                                }}
                                returnKeyType="search"
                            />
                            {suggestions && suggestions.length > 0 && (
                                <View
                                    style={{
                                        backgroundColor: "#fff",
                                        borderRadius: 8,
                                        borderWidth: 1,
                                        borderColor: "#E2E8F0",
                                        marginTop: 4,
                                        maxHeight: 180,
                                    }}
                                >
                                    {suggestions.map((item, idx) => (
                                        <TouchableOpacity
                                            key={item.place_id}
                                            style={{
                                                padding: 10,
                                                borderBottomWidth:
                                                    idx === suggestions.length - 1
                                                        ? 0
                                                        : 1,
                                                borderBottomColor: "#E2E8F0",
                                            }}
                                            onPress={async () => {
                                                setSearchQuery(item.description);
                                                setSuggestions([]);
                                                try {
                                                    const resp = await fetch(
                                                        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.place_id}&key=${GOOGLE_MAPS_API_KEY}`,
                                                    );
                                                    const details = await resp.json();
                                                    const loc =
                                                        details.result?.geometry
                                                            ?.location;
                                                    if (loc) {
                                                        setLatitude(loc.lat.toString());
                                                        setLongitude(
                                                            loc.lng.toString(),
                                                        );
                                                        onUpdateCoordinates(
                                                            loc.lat,
                                                            loc.lng,
                                                        );
                                                    }
                                                } catch (err) {}
                                            }}
                                        >
                                            <Text
                                                style={{fontSize: 16, color: "#1E293B"}}
                                            >
                                                {item.description}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                        {/* Centered Pin */}
                        <View
                            pointerEvents="none"
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                marginLeft: -24,
                                marginTop: -48,
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <View
                                style={{
                                    // backgroundColor: "#EF4444",
                                    borderRadius: 24,
                                    padding: 4,
                                    elevation: 4,
                                    // shadowColor: "#fefefe",
                                    shadowOffset: {width: 0, height: 2},
                                    shadowOpacity: 0.1,
                                    shadowRadius: 4,
                                }}
                            >
                                <MapPin size={48} color="orange" style={{}} />
                            </View>
                            {/* Pin shadow */}
                            <View
                                style={{
                                    width: 24,
                                    height: 8,
                                    backgroundColor: "#000",
                                    opacity: 0.15,
                                    borderRadius: 12,
                                    marginTop: -8,
                                }}
                            />
                        </View>
                    </View>
                </View>
                <View style={styles.statusContainer}>
                    <View
                        style={[
                            styles.statusBadge,
                            {backgroundColor: `${statusColor}20`},
                        ]}
                    >
                        <MapPin size={16} color={statusColor} />
                        <Text style={[styles.statusText, {color: statusColor}]}>
                            {statusText}
                        </Text>
                    </View>
                    {location.properties.code && (
                        <Text style={styles.lastUpdated}>
                            Last updated: {location.lastUpdated}
                        </Text>
                    )}
                </View>
            </View>

            <View
                style={{
                    flex: 1,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingHorizontal: 20,
                    borderTopWidth: 1,
                    borderTopColor: "#F1F5F9",
                }}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 12,
                        // marginRight: 8,
                        borderWidth: 1,
                        borderColor: "#E2E8F0",
                        borderRadius: 8,
                    }}
                    onPress={onClose}
                    disabled={isSaving}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        flex: 2,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#3B82F6",
                        paddingVertical: 12,
                        marginLeft: 8,
                        borderRadius: 8,
                    }}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <>
                            <Save size={20} color="#FFFFFF" />
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <View
                style={{
                    flex: 1,
                }}
            ></View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: -3},
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    header: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1E293B",
    },
    closeButton: {
        padding: 4,
    },
    content: {
        flex: 6,
        paddingHorizontal: 20,
        backgroundColor: "#Fefe",
    },
    statusContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        // marginBottom: 20,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        fontSize: 14,
        fontWeight: "500",
        marginLeft: 4,
    },
    lastUpdated: {
        fontSize: 14,
        color: "#94A3B8",
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "500",
        color: "#64748B",
        marginBottom: 8,
    },
    input: {
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: "#1E293B",
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: "top",
    },
    coordinatesContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    dragInstructions: {
        fontSize: 14,
        color: "#64748B",
        fontStyle: "italic",
        textAlign: "center",
        marginTop: 8,
        marginBottom: 20,
    },
    footer: {
        flex: 1,
        flexDirection: "row",
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
    },
    cancelButton: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        marginRight: 8,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 8,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#64748B",
    },
    saveButton: {
        flex: 2,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#3B82F6",
        paddingVertical: 12,
        marginLeft: 8,
        borderRadius: 8,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#FFFFFF",
        marginLeft: 8,
    },
});

export default LocationEditDrawer;
