import * as Location from "expo-location";

import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import {
    IPollingCenterFeature,
    Location as LocationType,
    Region as RegionType,
} from "./types/Location";
import MapView, {Marker, PROVIDER_GOOGLE} from "react-native-maps";
import {Navigation, RefreshCw} from "lucide-react-native";
import React, {useEffect, useRef, useState} from "react";
import {windowHeight, windowWidth} from "@/app/(utils)/screenDimensions";

import LocationEditDrawer from "./components/LocationEditDrawer";
import LocationItem from "./components/PollingCenterItem";
import LocationPin from "./components/LocationPin";
import Slider from "@react-native-community/slider";
import {StatusBar} from "expo-status-bar";
import {apiBaseURL} from "@/app/(utils)/apiBaseURL";
import {updateLocation} from "./(utils)/LocationService";

const {height} = Dimensions.get("window");
const INITIAL_REGION = {
    latitude: -1.28949,
    longitude: 36.820599,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
}; // centers on Parliament Road where our comrades were shot

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function LocationsScreen() {
    const [locations, setLocations] = useState<IPollingCenterFeature[] | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedLocation, setSelectedLocation] =
        useState<IPollingCenterFeature | null>(null);
    const [userLocationFound, setUserLocationFound] = useState(false);

    const [editingLocation, setEditingLocation] =
        useState<IPollingCenterFeature | null>(null);
    const [region, setRegion] = useState<RegionType>(INITIAL_REGION);
    const [userLocation, setUserLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);

    const [searchDistance, setSearchDistance] = useState(2000); // Default search distance in meters
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const [hasLocationPermission2, setHasLocationPermission2] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");

    const mapRef = useRef<MapView>(null);

    // Animation values
    const listHeight = useSharedValue(height * 0.45);
    const isDragging = useSharedValue(false);

    // Fetch locations
    useEffect(() => {
        requestLocationPermission();
    }, []);

    // Fetch locations
    useEffect(() => {
        if (userLocationFound) {
            let data = {
                username: "testuser",
                email: "testemail@test.com",
                latitude: userLocation?.latitude || null,
                longitude: userLocation?.longitude || null,
            };
            fetch(
                `${apiBaseURL}/api/stations/ward/polling-centers/${searchDistance}/pins/`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data),
                },
            )
                .then((response) => response.json())
                .then((data) => {
                    console.log(JSON.stringify(data), "data from ward server");

                    if (data.error) {
                        console.log(
                            "Error fetching data from ward server:",
                            data.error,
                        );
                        setError(data.error);
                        setLoading(false);
                        setRefreshing(false);
                    }
                    // Process the data as needed
                    if (data.features && data.features.length > 0) {
                        if (locations !== null) {
                            // Filter out features that already exist based on unique key (name + code)
                            const existingKeys = new Set(
                                locations.map((loc) => loc.id),
                            );
                            const newFeatures = data.features.filter(
                                (feature: IPollingCenterFeature) =>
                                    !existingKeys.has(feature.id),
                            );
                            setLocations([...locations, ...newFeatures]);
                        } else {
                            setLocations(data.features);
                        }

                        setError(null);
                    }

                    setLoading(false);
                    setRefreshing(false);
                });
        }
    }, [userLocationFound, refreshing, searchDistance]);

    const requestLocationPermission = async () => {
        if (Platform.OS === "web") {
            // Handle web differently
            try {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const {latitude, longitude} = position.coords;
                        setUserLocation({latitude, longitude});
                        setUserLocationFound(true);
                        setRegion({
                            latitude,
                            longitude,
                            latitudeDelta: 0.0922,
                            longitudeDelta: 0.0421,
                        });
                    },
                    (error) => console.log("Error getting location:", error),
                    {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
                );
            } catch (error) {
                console.log("Error requesting location permission:", error);
            }
            return;
        }

        try {
            const {status} = await Location.requestForegroundPermissionsAsync();

            setHasLocationPermission2(status === "granted");
            if (status === "granted") {
                const location = await Location.getCurrentPositionAsync({});
                const {latitude, longitude} = location.coords;

                setUserLocation({latitude, longitude});
                setUserLocationFound(true);

                setRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                });
            }
        } catch (error) {
            console.log("Error requesting location permission:", error);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        // fetchLocations();
    };

    const handleLocationSelect = (location: IPollingCenterFeature) => {
        setSelectedLocation(location);

        // Animate to the selected location
        mapRef.current?.animateToRegion(
            {
                latitude: location?.geometry.coordinates[1],
                longitude: location?.geometry.coordinates[0],
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            },
            500,
        );
    };

    const handleEditLocation = (location: IPollingCenterFeature) => {
        setEditingLocation(location);
        setIsDrawerVisible(true);
    };

    const handleSaveLocation = async (updatedLocation: LocationType) => {
        try {
            const savedLocation = await updateLocation(updatedLocation);

            // Update locations list
            setLocations((prevLocations) =>
                prevLocations.map((loc) =>
                    loc.id === savedLocation.id ? savedLocation : loc,
                ),
            );

            // Update selected location if it's the one being edited
            if (selectedLocation?.id === savedLocation.id) {
                setSelectedLocation(savedLocation);
            }

            return Promise.resolve();
        } catch (error) {
            console.error("Error saving location:", error);
            return Promise.reject(error);
        }
    };

    const handleUpdateCoordinates = (latitude: number, longitude: number) => {
        if (editingLocation) {
            // Create a new object to trigger re-render
            setEditingLocation({
                ...editingLocation,
                latitude,
                longitude,
            });

            // Move map to new location
            mapRef.current?.animateToRegion(
                {
                    latitude,
                    longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                },
                500,
            );
        }
    };

    const handleMarkerDragEnd = (e: any, locationId: string) => {
        const {latitude, longitude} = e.nativeEvent.coordinate;

        // Update location in the state
        setLocations((prevLocations) =>
            prevLocations.map((loc) =>
                loc.id === locationId ? {...loc, latitude, longitude} : loc,
            ),
        );

        // Update selected location if it's the one being dragged
        if (selectedLocation?.id === locationId) {
            setSelectedLocation((prev) =>
                prev ? {...prev, latitude, longitude} : null,
            );
        }

        // Update editing location if it's the one being dragged
        if (editingLocation?.id === locationId) {
            setEditingLocation((prev) =>
                prev ? {...prev, latitude, longitude} : null,
            );
        }
    };

    const goToUserLocation = () => {
        if (userLocation) {
            mapRef.current?.animateToRegion(
                {
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                },
                500,
            );
        }
    };

    // Animated styles for the list container
    const listAnimatedStyle = useAnimatedStyle(() => {
        return {
            height: isDragging.value
                ? listHeight.value
                : withSpring(listHeight.value, {damping: 20}),
        };
    });

    // Handle list drag gesture
    const handleListDrag = (e: any) => {
        const newHeight = Math.max(
            height * 0.2, // Min height
            Math.min(height * 0.8, e.nativeEvent.locationY), // Max height
        );

        listHeight.value = newHeight;
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading locations...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Map View */}
            <View style={styles.mapContainer}>
                <View
                    style={{
                        position: "absolute",
                        top: 24,
                        left: 0,
                        right: 0,
                        alignItems: "center",
                        zIndex: 20,
                        pointerEvents: "box-none",
                    }}
                >
                    <View
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 16,
                            paddingHorizontal: 20,
                            paddingVertical: 12,
                            shadowColor: "#000",
                            shadowOffset: {width: 0, height: 2},
                            shadowOpacity: 0.12,
                            shadowRadius: 8,
                            elevation: 4,
                            flexDirection: "row",
                            alignItems: "center",
                            minWidth: 220,
                        }}
                    >
                        <Text
                            style={{
                                fontWeight: "600",
                                color: "#1E293B",
                                marginRight: 12,
                            }}
                        >
                            Search Radius
                        </Text>
                        <Text
                            style={{
                                fontWeight: "500",
                                color: "#3B82F6",
                                marginRight: 8,
                            }}
                        >
                            {(searchDistance / 1000).toFixed(1)} km
                        </Text>
                    </View>
                    <View
                        style={{
                            width: 240,
                            marginTop: 8,
                            backgroundColor: "#F1F5F9",
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                        }}
                    >
                        <View style={{flexDirection: "row", alignItems: "center"}}>
                            <Text style={{color: "#64748B", fontSize: 12, width: 32}}>
                                0.5
                            </Text>
                            <Slider
                                style={{flex: 1, marginHorizontal: 8}}
                                minimumValue={500}
                                maximumValue={10000}
                                step={100}
                                value={searchDistance}
                                minimumTrackTintColor="#3B82F6"
                                maximumTrackTintColor="#CBD5E1"
                                thumbTintColor="#3B82F6"
                                onValueChange={setSearchDistance}
                                onSlidingComplete={() => {
                                    // Trigger a refresh when the radius is changed
                                    setRefreshing(true);
                                }}
                            />
                            <Text
                                style={{
                                    color: "#64748B",
                                    fontSize: 12,
                                    width: 32,
                                    textAlign: "right",
                                }}
                            >
                                10
                            </Text>
                        </View>
                        <Text
                            style={{
                                color: "#94A3B8",
                                fontSize: 11,
                                textAlign: "center",
                                marginTop: 2,
                            }}
                        >
                            Drag to adjust radius (km)
                        </Text>
                    </View>
                </View>

                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={Platform.OS === "ios" ? undefined : PROVIDER_GOOGLE}
                    initialRegion={region}
                    showsUserLocation={hasLocationPermission2}
                    showsMyLocationButton={false}
                    mapType="standard"
                >
                    {locations !== null &&
                        locations !== undefined &&
                        locations.map((location) => (
                            <Marker
                                key={location.id}
                                coordinate={{
                                    latitude: location?.geometry.coordinates[1],
                                    longitude: location?.geometry.coordinates[0],
                                }}
                                // onPress={() => handleLocationSelect(location)}
                                // draggable={editingLocation?.id === location.id}
                                // onDragEnd={(e) =>
                                //     handleMarkerDragEnd(e, location.properties.code)
                                // }
                            >
                                <LocationPin
                                    location={location}
                                    selected={
                                        selectedLocation?.properties.name ===
                                        location.properties.name
                                    }
                                />
                            </Marker>
                        ))}
                </MapView>

                {/* Map Controls */}
                <View style={styles.mapControls}>
                    <TouchableOpacity
                        style={styles.mapControlButton}
                        onPress={goToUserLocation}
                    >
                        <Navigation size={20} color="#3B82F6" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.mapControlButton}
                        onPress={handleRefresh}
                    >
                        <RefreshCw size={20} color="#3B82F6" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar
                <TouchableOpacity style={styles.searchBar}>
                    <Search size={20} color="#64748B" />
                    <Text style={styles.searchPlaceholder}>Search locations...</Text>
                </TouchableOpacity> */}
            </View>

            {/* List Container */}
            <Animated.View style={[styles.listContainer, listAnimatedStyle]}>
                {/* Drag Handle */}
                <View style={styles.dragHandleContainer}>
                    <TouchableOpacity
                        style={styles.dragHandle}
                        onPanResponderMove={handleListDrag}
                    />
                </View>

                <Text style={styles.listTitle}>Locations</Text>

                <Text
                    style={{
                        marginLeft: 16,
                    }}
                >
                    {locations && locations.length > 0
                        ? `Found ${locations.length} locations`
                        : "No locations found"}
                </Text>

                {error ? (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>{error}</Text>
                    </View>
                ) : (
                    <FlatList
                        data={locations}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({item}) => (
                            <LocationItem
                                location={item}
                                onPress={() => handleLocationSelect(item)}
                                onEdit={() => handleEditLocation(item)}
                            />
                        )}
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </Animated.View>

            {/* Edit Drawer */}
            {isDrawerVisible && (
                <View style={styles.drawerContainer}>
                    <LocationEditDrawer
                        location={editingLocation}
                        GOOGLE_MAPS_API_KEY={GOOGLE_MAPS_API_KEY}
                        visible={isDrawerVisible}
                        onClose={() => {
                            setIsDrawerVisible(false);
                            setEditingLocation(null);
                        }}
                        onSave={handleSaveLocation}
                        onUpdateCoordinates={handleUpdateCoordinates}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: windowWidth,
        backgroundColor: "#FFFFFF",
    },
    loadingContainer: {
        flex: 1,
        width: windowWidth,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#64748B",
    },
    mapContainer: {
        flex: 1,
        position: "relative",
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    mapControls: {
        position: "absolute",
        right: 16,
        bottom: 24,
        alignItems: "center",
    },
    mapControlButton: {
        backgroundColor: "#FFFFFF",
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    searchBar: {
        position: "absolute",
        top: 60,
        left: 16,
        right: 16,
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    searchPlaceholder: {
        marginLeft: 12,
        fontSize: 16,
        color: "#94A3B8",
    },
    listContainer: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: -4},
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
        zIndex: 10,
        height: height * 0.45,
    },
    dragHandleContainer: {
        alignItems: "center",
        paddingVertical: 8,
    },
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: "#CBD5E1",
        borderRadius: 2.5,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1E293B",
        marginHorizontal: 16,
        marginVertical: 12,
    },
    listContent: {
        paddingBottom: 24,
    },
    drawerContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 0.95 * windowHeight,
        zIndex: 20,
    },
});
