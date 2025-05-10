import {FlatList, StyleSheet, TouchableOpacity} from "react-native";
import MapView, {Geojson, GeojsonProps} from "react-native-maps";
import {Text, View} from "react-native";
import {useEffect, useState} from "react";
import {windowHeight, windowWidth} from "../(utils)/screenDimensions";

import React from "react";
import {useBottomTabBarHeight} from "@react-navigation/bottom-tabs";

function MapUpdates() {
    const [counties, setCounties] = useState<GeojsonProps["geojson"] | null>(null);
    const [selectedCounty, setSelectedCounty] = useState<number | null>(null);

    const [constituencies, setConstituencies] = useState<
        GeojsonProps["geojson"] | null
    >(null);

    const [selectedConstituency, setSelectedConstituency] = useState<number | null>(
        null,
    );

    const [wards, setWards] = useState<GeojsonProps["geojson"] | null>(null);

    const [selectedWard, setSelectedWard] = useState<string | null>(null);

    const [mapRegion, setMapRegion] = useState({
        latitude: 0.0,
        longitude: 37.7,
        latitudeDelta: 8.0,
        longitudeDelta: 8.0,
    });

    const tabBarHeight = useBottomTabBarHeight();

    const handleCountyPress = (countyId: number) => {
        setSelectedCounty(countyId);
        // gwt the county bounds to zoom in
        const county = counties?.features.find(
            (f) => f.properties?.number === countyId,
        );

        console.log(county, "selected county");
        if (county) {
            const coordinates = county.geometry.coordinates[0];
            const center = coordinates.reduce(
                (acc, coord) => {
                    acc.latitude += coord[1];
                    acc.longitude += coord[0];
                    return acc;
                },
                {latitude: 0, longitude: 0},
            );
            center.latitude /= coordinates.length;
            center.longitude /= coordinates.length;

            const bounds = {
                latitude: center.latitude,
                longitude: center.longitude,

                latitudeDelta: Math.abs(coordinates[0][1] - coordinates[2][1]) * 7,
                longitudeDelta: Math.abs(coordinates[0][0] - coordinates[2][0]) * 7,
            };
            console.log(bounds, "bounds");
            // set the map region to the county bounds

            setMapRegion({...mapRegion, ...bounds});
        }
    };

    const handleConstituencyPress = (constituencyId: number) => {
        setSelectedConstituency(constituencyId);
        // gwt the constituency bounds to zoom in
        const constituency = constituencies?.features.find(
            (f) => f.properties?.number === constituencyId,
        );

        console.log(constituency, "selected constituency");
        if (constituency) {
            const coordinates = constituency.geometry.coordinates[0];
            const center = coordinates.reduce(
                (acc, coord) => {
                    acc.latitude += coord[1];
                    acc.longitude += coord[0];
                    return acc;
                },
                {latitude: 0, longitude: 0},
            );
            center.latitude /= coordinates.length;
            center.longitude /= coordinates.length;

            const bounds = {
                latitude: center.latitude,
                longitude: center.longitude,

                latitudeDelta: Math.abs(coordinates[0][1] - coordinates[2][1]) * 100,
                longitudeDelta: Math.abs(coordinates[0][0] - coordinates[2][0]) * 100,
            };
            console.log(bounds, "const bounds");
            // set the map region to the county bounds

            setMapRegion({...mapRegion, ...bounds});
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                fetch("http://10.0.2.2:8000/api/stations/counties/boundaries/")
                    .then((res) => res.json())
                    .then((data) => {
                        // console.log(data, "data");
                        if (data && data.features && data.features.length > 0) {
                            // setCounties(data);
                            const validFeatures = data.features.filter(
                                (f) =>
                                    f.geometry &&
                                    Array.isArray(f.geometry.coordinates) &&
                                    f.geometry.coordinates.length > 0,
                            );

                            // console.log(validFeatures, "validFeatures");
                            console.log(validFeatures?.length, "validFeatures");

                            // check if geojson is valid
                            const isValidGeoJSON =
                                validFeatures.length > 0 &&
                                validFeatures.every(
                                    (feature) =>
                                        feature.type === "Feature" &&
                                        feature.geometry &&
                                        feature.geometry.type &&
                                        feature.geometry.coordinates,
                                );
                            // console.log(isValidGeoJSON, "isValidGeoJSON");

                            setCounties({
                                type: "FeatureCollection",
                                features: validFeatures,
                            });

                            // console.log(
                            //     JSON.stringify({
                            //         type: "FeatureCollection",
                            //         features: validFeatures,
                            //     }),
                            //     "counties",
                            // );
                        } else {
                            console.error(
                                "Invalid GeoJSON data or empty features array:",
                                data,
                            );
                        }
                    });
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    const fetchConstituencies = async (countyNumber: number) => {
        console.log("getting constituencies data");

        fetch(
            `http://10.0.2.2:8000/api/stations/county/${countyNumber}/constituencies/boundaries/`,
            {
                method: "GET",
            },
        )
            .then((res) => res.json())
            .then((data) => {
                // console.log(data, "constituencies data");
                setConstituencies(data);
            });
    };

    const fetchWards = async (constID: number) => {
        fetch(
            `http://10.0.2.2:8000/api/stations/constituencies/${constID}/wards/boundaries/`,
            {
                method: "GET",
            },
        )
            .then((res) => res.json())
            .then((data) => {
                // console.log(data, "ward data");
                setWards(data);
            });
    };

    async function handleSelectedCountySelect(countyId: number) {
        await fetchConstituencies(countyId);
    }

    async function handleSelectedConstituencySelect(constID: number) {
        await fetchWards(constID);
    }

    return (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#fff",
            }}
        >
            <MapView
                style={{width: windowWidth, height: 0.5 * windowHeight}}
                showsUserLocation={true}
                showsMyLocationButton={true}
                showsCompass={true}
                zoomEnabled
                zoomControlEnabled
                toolbarEnabled
                zoomTapEnabled
                mapType="hybrid"
                region={mapRegion}
            >
                {counties !== null &&
                    constituencies === null &&
                    counties.features.map((feature, index) => (
                        <Geojson
                            key={feature.properties?.number}
                            geojson={{
                                type: "FeatureCollection",
                                features: [feature],
                            }}
                            strokeColor="black"
                            fillColor={
                                feature.properties?.number === selectedCounty
                                    ? "blue"
                                    : "rgba(0, 0, 255, 0.2)"
                            }
                            strokeWidth={2}
                            color="red"
                        />
                    ))}

                {constituencies !== null &&
                    wards === null &&
                    constituencies.features.map((feature, index) => (
                        <Geojson
                            key={feature.properties?.number}
                            geojson={{
                                type: "FeatureCollection",
                                features: [feature],
                            }}
                            strokeColor="black"
                            fillColor={
                                feature.properties?.number === selectedConstituency
                                    ? "blue"
                                    : "rgba(0, 0, 255, 0.2)"
                            }
                            strokeWidth={2}
                            color="red"
                        />
                    ))}

                {wards !== null &&
                    wards.features.map((feature, index) => (
                        <Geojson
                            key={feature.id}
                            geojson={{
                                type: "FeatureCollection",
                                features: [feature],
                            }}
                            strokeColor="black"
                            fillColor={
                                feature.properties?.number === selectedWard
                                    ? "blue"
                                    : "rgba(0, 0, 255, 0.2)"
                            }
                            strokeWidth={2}
                            color="red"
                        />
                    ))}
            </MapView>
            {selectedCounty && selectedConstituency === null && (
                <TouchableOpacity
                    style={{
                        position: "absolute",
                        zIndex: 9999999999999,
                        bottom: tabBarHeight + 10,
                        padding: 15,
                        backgroundColor: "#007BFF",
                        borderRadius: 5,
                    }}
                    onPress={() => {
                        console.log("Proceeding with county:", selectedCounty);
                        handleSelectedCountySelect(selectedCounty);
                    }}
                >
                    <Text style={{color: "#fff", fontSize: 16, textAlign: "center"}}>
                        Proceed to Constituency
                    </Text>
                </TouchableOpacity>
            )}

            {selectedCounty && selectedConstituency && selectedWard === null && (
                <TouchableOpacity
                    style={{
                        position: "absolute",
                        zIndex: 9999999999999,
                        bottom: tabBarHeight + 10,
                        padding: 15,
                        backgroundColor: "#007BFF",
                        borderRadius: 5,
                    }}
                    onPress={() => {
                        console.log("Proceeding with county:", selectedConstituency);
                        handleSelectedConstituencySelect(selectedConstituency);
                    }}
                >
                    <Text style={{color: "#fff", fontSize: 16, textAlign: "center"}}>
                        Proceed to wards
                    </Text>
                </TouchableOpacity>
            )}

            {counties !== null && constituencies === null && (
                <FlatList
                    style={{
                        flex: 6,
                        width: windowWidth,
                        backgroundColor: "#fff",
                    }}
                    data={counties?.features || []}
                    keyExtractor={(item) => item.properties?.number}
                    renderItem={({item}) => (
                        <TouchableOpacity
                            style={[
                                styles.countyItem,
                                selectedCounty === item.properties?.number &&
                                    styles.selectedCountyItem,
                            ]}
                            onPress={() => handleCountyPress(item.properties?.number)}
                        >
                            <View style={{flexDirection: "row", alignItems: "center"}}>
                                <Text style={styles.countyText}>
                                    {item.properties?.name || "Unnamed County"}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}

            {constituencies !== null && wards === null && (
                <FlatList
                    style={{
                        flex: 6,
                        width: windowWidth,
                        backgroundColor: "#fff",
                    }}
                    data={constituencies?.features || []}
                    keyExtractor={(item) =>
                        item.properties?.id || Math.random().toString()
                    }
                    renderItem={({item}) => (
                        <TouchableOpacity
                            style={[
                                styles.countyItem,
                                selectedConstituency === item.properties?.number &&
                                    styles.selectedCountyItem,
                            ]}
                            onPress={() =>
                                handleConstituencyPress(item.properties?.number)
                            }
                        >
                            <View style={{flexDirection: "row", alignItems: "center"}}>
                                <Text style={styles.countyText}>
                                    {item.properties?.name || "Unnamed Constituency"}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}

            {wards !== null && (
                <FlatList
                    style={{
                        flex: 6,
                        width: windowWidth,
                        backgroundColor: "#fff",
                    }}
                    data={wards?.features || []}
                    keyExtractor={(item) =>
                        item.properties?.number || Math.random().toString()
                    }
                    renderItem={({item}) => (
                        <TouchableOpacity
                            style={[
                                styles.countyItem,
                                selectedWard === item.properties?.number &&
                                    styles.selectedCountyItem,
                            ]}
                            onPress={() => setSelectedWard(item.properties?.number)}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Text style={styles.countyText}>
                                    {item.properties?.name || "Unnamed Ward"}
                                </Text>
                                <Text
                                    style={{
                                        ...styles.countyText,
                                        fontSize: 12,
                                        color: "#888",
                                    }}
                                >
                                    Ward code:{" "}
                                    {item.properties?.number || "Unnamed Ward"}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    countyItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
    },
    selectedCountyItem: {
        backgroundColor: "#e0f7fa",
    },
    countyText: {
        fontSize: 16,
    },
});

export default MapUpdates;
