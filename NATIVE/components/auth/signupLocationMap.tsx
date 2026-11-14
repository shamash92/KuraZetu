import React, {useState} from "react";
import {StyleSheet, Text, View} from "react-native";
import MapView, {Geojson, Marker} from "react-native-maps";
import type {Region} from "react-native-maps";
import {windowHeight, windowWidth} from "@/app/_utils/device/screenDimensions";
import {perk} from "@/app/_utils/colors";

export function SignupLocationMap({
    step, mapRegion, mapFeatures, data, selectedId, selectedPollingCenter,
    onPollingCenterPress: handlePollingCenterPress,
}: {
    step: "county" | "constituency" | "ward" | "centre";
    mapRegion: Region;
    mapFeatures: Array<any>;
    data: Array<any>;
    selectedId: number | string | null;
    selectedPollingCenter: string | null;
    onPollingCenterPress: (id: string) => void;
}) {
    const [mapReady, setMapReady] = useState(false);
    return (
        <View style={styles.mapWrap}>
            <MapView
                style={styles.map}
                region={mapRegion}
                onMapReady={() => setMapReady(true)}
                mapType={step === "centre" ? "hybrid" : "standard"}
            >
                {mapReady &&
                    mapFeatures.map((feature, index) => (
                        <Geojson
                            key={feature.id ?? index}
                            geojson={{
                                type: "FeatureCollection",
                                features: [feature],
                            }}
                            strokeColor={perk.ink}
                            fillColor={
                                feature.properties?.number === selectedId
                                    ? perk.lime
                                    : "rgba(196,255,94,0.18)"
                            }
                            strokeWidth={
                                feature.properties?.number === selectedId ? 2 : 1
                            }
                        />
                    ))}
                {mapReady &&
                    step === "centre" &&
                    data.map((feature) =>
                        feature.geometry ? (
                            <Marker
                                key={feature.id ?? feature.properties?.code}
                                coordinate={{
                                    latitude: feature.geometry.coordinates[1],
                                    longitude: feature.geometry.coordinates[0],
                                }}
                                pinColor={
                                    feature.properties?.code ===
                                    selectedPollingCenter
                                        ? perk.limeDeep
                                        : feature.properties?.pin_location_error
                                          ? perk.copper
                                          : perk.coralDeep
                                }
                                onPress={() =>
                                    handlePollingCenterPress(
                                        feature.properties?.code,
                                    )
                                }
                            />
                        ) : null,
                    )}
            </MapView>
            <View style={styles.mapCredit}>
                <Text style={styles.mapCreditText}>© OPENSTREETMAP · KURAZETU</Text>
            </View>
        </View>

    );
}

const styles = StyleSheet.create({
    mapWrap: {
        height: Math.min(windowHeight * 0.29, 245),
        overflow: "hidden",
        backgroundColor: "#0e2024",
    },
    map: {width: windowWidth, height: "100%"},
    mapCredit: {
        position: "absolute",
        bottom: 8,
        left: 11,
        backgroundColor: "rgba(13,13,13,0.45)",
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 3,
    },
    mapCreditText: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 8,
        letterSpacing: 1.1,
        color: "rgba(255,255,255,0.72)",
        fontWeight: "700",
    },
});
