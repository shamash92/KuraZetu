import {FlatList, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import MapView, {Geojson, GeojsonProps, Marker} from "react-native-maps";
import {statusBarHeight, windowHeight, windowWidth} from "../(utils)/screenDimensions";
import {useEffect, useMemo, useState} from "react";

import {ICountyFeature} from "../types";
import {Ionicons} from "@expo/vector-icons";
import LottieComponent from "@/components/lottieLoading";
import React from "react";
import {apiBaseURL} from "../(utils)/apiBaseURL";
import {router} from "expo-router";

function MapUpdates() {
    const [counties, setCounties] = useState<ICountyFeature[] | null>(null);
    const [selectedCounty, setSelectedCounty] = useState<number | null>(null);
    const [selectedCountyName, setSelectedCountyName] = useState<string | null>(null);

    const [constituencies, setConstituencies] = useState<
        GeojsonProps["geojson"] | null
    >(null);

    const [selectedConstituency, setSelectedConstituency] = useState<number | null>(
        null,
    );
    const [selectedConstituencyName, setSelectedConstituencyName] = useState<
        string | null
    >(null);

    const [wards, setWards] = useState<GeojsonProps["geojson"] | null>(null);
    const [selectedWard, setSelectedWard] = useState<number | null>(null);
    const [selectedWardName, setSelectedWardName] = useState<string | null>(null);

    const [pollingCenters, setPollingCenters] = useState<
        GeojsonProps["geojson"] | null
    >(null);
    const [selectedPollingCenter, setSelectedPollingCenter] = useState<string | null>(
        null,
    );

    const [mapRegion, setMapRegion] = useState({
        latitude: 0.0,
        longitude: 37.7,
        latitudeDelta: 8.0,
        longitudeDelta: 8.0,
    });

    const handleCountyPress = (countyId: number) => {
        setSelectedCounty(countyId);
        // gwt the county bounds to zoom in
        const county = counties?.find((f) => f.properties?.number === countyId);

        console.log(county, "selected county");
        if (county) {
            setSelectedCountyName(county.properties?.name);
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
            setSelectedConstituencyName(constituency.properties?.name);
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
            // console.log(bounds, "const bounds");
            // set the map region to the county bounds

            setMapRegion({...mapRegion, ...bounds});
        }
    };

    const handleWardPress = (wardId: number) => {
        setSelectedWard(wardId);
        // gwt the ward bounds to zoom in
        const ward = wards?.features.find((f) => f.properties?.number === wardId);

        console.log(ward, "selected ward");
        if (ward) {
            setSelectedWardName(ward.properties?.name);
            const coordinates = ward.geometry.coordinates[0];
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

                latitudeDelta: Math.abs(coordinates[0][1] - coordinates[2][1]) * 30,
                longitudeDelta: Math.abs(coordinates[0][0] - coordinates[2][0]) * 30,
            };
            // console.log(bounds, "ward bounds");
            // set the map region to the county bounds

            setMapRegion({...mapRegion, ...bounds});
        }
    };

    const handlePollingCenterPress = (pollingCenterId: string) => {
        setSelectedPollingCenter(pollingCenterId);

        const pollingCenter = pollingCenters?.features.find(
            (f) => f.properties?.code === pollingCenterId,
        );

        // console.log(pollingCenter, "selected polling center");
        if (pollingCenter && pollingCenter.geometry !== null) {
            const coordinates = pollingCenter.geometry.coordinates;
            const center = {
                latitude: Array.isArray(coordinates) ? coordinates[1] : 0,
                longitude: Array.isArray(coordinates) ? coordinates[0] : 0,
            };

            let bounds = {
                latitude: center.latitude,
                longitude: center.longitude,
                latitudeDelta: 0.002,
                longitudeDelta: 0.002,
            };
            // console.log(bounds, "polling center bounds");
            // set the map region to the county bounds

            setMapRegion({...mapRegion, ...bounds});
        }
    };

    function handleFinish() {
        console.log("Finishing with polling center:", selectedPollingCenter);
        console.log(selectedConstituency, "selected constituency");
        console.log(selectedCounty, "selected county");
        console.log(selectedWard, "selected ward");

        // redirect
        router.replace(
            `/auth/signUpForm?ward=${selectedWard}&pollingCenter=${selectedPollingCenter}`,
        );

        // Handle the finish action here
        // For example, you can navigate to another screen or show a success message
    }

    useEffect(() => {
        console.log("useEffect counties");

        console.log(apiBaseURL, "api base url in useEffect");

        const fetchData = async () => {
            try {
                fetch(`${apiBaseURL}/api/stations/counties/boundaries/`)
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
                            console.log(validFeatures?.length, "valid Counties");

                            setCounties(validFeatures);

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
    }, [apiBaseURL]);

    const fetchConstituencies = async (countyNumber: number) => {
        console.log("getting constituencies data");

        fetch(
            `${apiBaseURL}/api/stations/county/${countyNumber}/constituencies/boundaries/`,
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
            `${apiBaseURL}/api/stations/constituencies/${constID}/wards/boundaries/`,
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

    const fetchPollingCenters = async (wardNumber: number) => {
        fetch(`${apiBaseURL}/api/stations/wards/${wardNumber}/polling-centers/pins/`, {
            method: "GET",
        })
            .then((res) => res.json())
            .then((data) => {
                // console.log(data, "polling centers data");
                setPollingCenters(data);
            });
    };

    async function handleSelectedCountySelect(countyId: number) {
        await fetchConstituencies(countyId);
    }

    async function handleSelectedConstituencySelect(constID: number) {
        await fetchWards(constID);
    }
    async function handleSelectedWardSelect(wardId: number) {
        await fetchPollingCenters(wardId);
    }

    const [mapReady, setMapReady] = useState(false);

    let finCountiesData = useMemo(() => {
        // I spent my Father's whole day debugging failed build because of this. lack of memo creates some NUllPointer and crashes the app
        if (counties && counties.length > 0) {
            return counties.filter(
                (f) =>
                    f.geometry &&
                    Array.isArray(f.geometry.coordinates) &&
                    f.geometry.coordinates.length > 0,
            );
        }
        return [];
    }, [counties]);

    // console.log(finCountiesData, "final counties data");

    return counties !== null ? (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#fff",
            }}
        >
            {/* <Text style={{}}>Map Status: {mapReady ? "✅ Ready" : "⏳ Loading"}</Text> */}

            <MapView
                style={{
                    width: windowWidth,
                    height: 0.5 * windowHeight,
                    marginTop: statusBarHeight,
                }}
                // loadingEnabled // enable this at your own peril
                // I spent my Father's whole day debugging failed build because of this. lack of memo creates some NUllPointer and crashes the app

                // showsCompass={true}
                zoomEnabled
                zoomControlEnabled
                toolbarEnabled
                mapType={pollingCenters === null ? "standard" : "hybrid"}
                region={mapRegion}
                onMapReady={() => {
                    setTimeout(() => {
                        setMapReady(true);
                    }, 100); // ensure it’s fully mounted
                }}
            >
                {/* {mapReady &&
                    (finCountiesData !== null || finCountiesData !== undefined) &&
                    constituencies === null &&
                    finCountiesData.map((feature, index) => (
                        <Geojson
                            key={index}
                            geojson={{
                                type: "FeatureCollection",
                                features: [feature],
                            }}
                            strokeColor="black"
                            fillColor={
                                feature.properties?.number === selectedCounty
                                    ? "#fc5c9c"
                                    : "rgba(252, 92, 156, .2)"
                            }
                            strokeWidth={2}
                            color="red"
                        />
                    ))} */}

                {mapReady &&
                    counties !== null &&
                    constituencies === null &&
                    counties.map((feature, index) => (
                        <Geojson
                            key={index}
                            geojson={{
                                type: "FeatureCollection",
                                features: [feature],
                            }}
                            strokeColor="black"
                            fillColor={
                                feature.properties?.number === selectedCounty
                                    ? "#fc5c9c"
                                    : "rgba(252, 92, 156, .2)"
                            }
                            strokeWidth={2}
                            color="red"
                        />
                    ))}

                {mapReady &&
                    constituencies !== null &&
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
                                    ? "#fc5c9c"
                                    : "rgba(252, 92, 156, .2)"
                            }
                            strokeWidth={2}
                            color="red"
                        />
                    ))}

                {mapReady &&
                    wards !== null &&
                    pollingCenters === null &&
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
                                    ? "#fc5c9c"
                                    : "rgba(252, 92, 156, .2)"
                            }
                            strokeWidth={2}
                            color="red"
                        />
                    ))}

                {mapReady &&
                    pollingCenters !== null &&
                    pollingCenters.features.map((feature) => {
                        return feature.geometry !== null ? (
                            <Marker
                                key={feature.id}
                                coordinate={{
                                    latitude: Array.isArray(
                                        feature.geometry.coordinates,
                                    )
                                        ? feature.geometry.coordinates[1]
                                        : 0,
                                    longitude: Array.isArray(
                                        feature.geometry.coordinates,
                                    )
                                        ? feature.geometry.coordinates[0]
                                        : 0,
                                }}
                                title={
                                    feature.properties?.name || "Unnamed Polling Center"
                                }
                                description={`Code: ${feature.properties?.code}`}
                                pinColor={
                                    feature.properties?.is_verified
                                        ? "green"
                                        : feature.properties?.pin_location_error !==
                                          null
                                        ? "gold"
                                        : "red"
                                }
                                onPress={() =>
                                    handlePollingCenterPress(feature.properties?.code)
                                }
                            />
                        ) : null;
                    })}
            </MapView>

            {/* Flat Lists */}
            <>
                {counties !== null && constituencies === null && (
                    <FlatList
                        style={{
                            flex: 6,
                            width: windowWidth,
                            backgroundColor: "#fff",
                        }}
                        data={counties ? counties : []}
                        keyExtractor={(item) => item?.properties.number.toString()}
                        ListHeaderComponent={
                            selectedCounty === null ? (
                                <View
                                    style={{
                                        backgroundColor: "#f0f4fa",
                                        justifyContent: "center",
                                        flexDirection: "row",
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            backgroundColor: "#f0f4fa",
                                            paddingVertical: 10,
                                        }}
                                    >
                                        Select your home County
                                    </Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: "#fc5185",
                                        paddingVertical: 12,
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: 8,
                                        marginHorizontal: 4,
                                        marginVertical: 8,
                                        elevation: 2,
                                    }}
                                    onPress={() => {
                                        console.log(
                                            "Proceeding with county:",
                                            selectedCountyName,
                                        );
                                        handleSelectedCountySelect(selectedCounty);
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            padding: 10,
                                            color: "#fff",
                                            textAlign: "center",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        Proceed to {selectedCountyName} Constituencies
                                    </Text>
                                    <Ionicons
                                        name="arrow-forward"
                                        size={24}
                                        color="#fff"
                                        style={{marginLeft: 8}}
                                    />
                                </TouchableOpacity>
                            )
                        }
                        renderItem={({item}) => (
                            <TouchableOpacity
                                style={{
                                    paddingVertical: 16,
                                    paddingHorizontal: 20,
                                    marginVertical: 4,
                                    marginHorizontal: 16,
                                    // borderRadius: 12,
                                    backgroundColor:
                                        selectedCounty === item.properties?.number
                                            ? "#fccde2"
                                            : "#f5f6fa",
                                    shadowColor: "#000",
                                    shadowOffset: {width: 0, height: 2},
                                    shadowOpacity: 0.08,
                                    shadowRadius: 6,
                                    elevation:
                                        selectedCounty === item.properties?.number
                                            ? 4
                                            : 1,
                                    justifyContent: "center",
                                }}
                                onPress={() =>
                                    handleCountyPress(item.properties?.number)
                                }
                            >
                                <Text
                                    style={{
                                        fontSize: 17,
                                        fontWeight: "600",
                                        color:
                                            selectedCounty === item.properties?.number
                                                ? "black"
                                                : "#222",
                                        letterSpacing: 0.2,
                                    }}
                                >
                                    {item.properties?.name || "Unnamed County"}
                                </Text>
                            </TouchableOpacity>
                        )}
                        stickyHeaderIndices={[0]}
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
                        stickyHeaderIndices={[0]}
                        ListHeaderComponent={
                            selectedConstituency === null ? (
                                <View
                                    style={{
                                        backgroundColor: "#f0f4fa",
                                        justifyContent: "center",
                                        flexDirection: "row",
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            backgroundColor: "#f0f4fa",
                                            paddingVertical: 10,
                                        }}
                                    >
                                        Select your home constituency
                                    </Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: "#fc5185",
                                        paddingVertical: 12,
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: 8,
                                        marginHorizontal: 4,
                                        marginVertical: 8,
                                        elevation: 2,
                                    }}
                                    onPress={() => {
                                        console.log(
                                            "Proceeding with constituency:",
                                            selectedConstituencyName,
                                        );
                                        handleSelectedConstituencySelect(
                                            selectedConstituency,
                                        );
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            padding: 10,
                                            color: "#fff",
                                            textAlign: "center",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        Proceed to {selectedConstituencyName} Wards
                                    </Text>
                                    <Ionicons
                                        name="arrow-forward"
                                        size={24}
                                        color="#fff"
                                        style={{marginLeft: 8}}
                                    />
                                </TouchableOpacity>
                            )
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
                                <View
                                    style={{flexDirection: "row", alignItems: "center"}}
                                >
                                    <Text style={styles.countyText}>
                                        {item.properties?.name ||
                                            "Unnamed Constituency"}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                )}

                {wards !== null && pollingCenters === null && (
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
                        stickyHeaderIndices={[0]}
                        ListHeaderComponent={
                            selectedWard === null ? (
                                <View
                                    style={{
                                        backgroundColor: "#f0f4fa",
                                        justifyContent: "center",
                                        flexDirection: "row",
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            backgroundColor: "#f0f4fa",
                                            paddingVertical: 10,
                                        }}
                                    >
                                        Select your home ward
                                    </Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: "#fc5185",
                                        paddingVertical: 12,
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "space-evenly",
                                        borderRadius: 8,
                                        marginHorizontal: 4,
                                        marginVertical: 8,
                                        elevation: 2,
                                    }}
                                    onPress={() => {
                                        console.log(
                                            "Proceeding with ward:",
                                            selectedWardName,
                                        );
                                        handleSelectedWardSelect(selectedWard);
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            paddingVertical: 10,
                                            color: "#fff",
                                            textAlign: "center",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        Proceed to {selectedWardName} Polling Centers
                                    </Text>
                                    <Ionicons
                                        name="arrow-forward"
                                        size={24}
                                        color="#fff"
                                    />
                                </TouchableOpacity>
                            )
                        }
                        renderItem={({item}) => (
                            <TouchableOpacity
                                style={[
                                    styles.countyItem,
                                    selectedWard === item.properties?.number &&
                                        styles.selectedCountyItem,
                                ]}
                                onPress={() => handleWardPress(item.properties?.number)}
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

                {pollingCenters !== null && (
                    <FlatList
                        style={{
                            flex: 6,
                            width: windowWidth,
                            backgroundColor: "#fff",
                        }}
                        data={pollingCenters?.features || []}
                        keyExtractor={(item) => item.properties?.code}
                        stickyHeaderIndices={[0]}
                        ListHeaderComponent={
                            selectedPollingCenter === null ? (
                                <View
                                    style={{
                                        backgroundColor: "#f0f4fa",
                                        justifyContent: "center",
                                        flexDirection: "row",
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            backgroundColor: "#f0f4fa",
                                            paddingVertical: 10,
                                        }}
                                    >
                                        Select your polling center
                                    </Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: "#fc5185",
                                        paddingVertical: 12,
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: 8,
                                        marginHorizontal: 4,
                                        marginVertical: 8,
                                        elevation: 2,
                                    }}
                                    onPress={() => {
                                        console.log(
                                            "Proceeding with polling center:",
                                            selectedPollingCenter,
                                        );
                                        handleFinish();
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            padding: 10,
                                            color: "#fff",
                                            textAlign: "center",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        Click to Finish
                                    </Text>
                                    <Ionicons
                                        name="arrow-forward"
                                        size={24}
                                        color="#fff"
                                        style={{marginLeft: 8}}
                                    />
                                </TouchableOpacity>
                            )
                        }
                        renderItem={({item}) => (
                            <TouchableOpacity
                                style={[
                                    styles.countyItem,
                                    selectedPollingCenter === item.properties?.code &&
                                        styles.selectedCountyItem,
                                ]}
                                onPress={() =>
                                    handlePollingCenterPress(item.properties?.code)
                                }
                            >
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <View style={{flexDirection: "column"}}>
                                        <Text style={styles.countyText}>
                                            {item.properties?.name ||
                                                "Unnamed Polling Center"}
                                        </Text>
                                        {item.properties?.pin_location_error && (
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    color:
                                                        item.properties
                                                            .pin_location_error ===
                                                        "Pin location not inside the ward boundary"
                                                            ? "#f3cf7a"
                                                            : "red",
                                                    marginTop: 5,
                                                }}
                                            >
                                                {item.properties?.pin_location_error}
                                            </Text>
                                        )}
                                    </View>

                                    <Text
                                        style={{
                                            ...styles.countyText,
                                            fontSize: 12,
                                            color: "#888",
                                        }}
                                    >
                                        Center code:{" "}
                                        {item.properties?.code ||
                                            "Unnamed Polling Center"}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </>
        </View>
    ) : (
        <View
            style={{
                flex: 1,
                justifyContent: "flex-start",
                alignItems: "center",
                backgroundColor: "#f0f4fa",
            }}
        >
            <View>
                <LottieComponent
                    name="maps-loading"
                    backgroundColor="#f0f4fa"
                    width={windowWidth}
                />
            </View>
            <View
                style={{
                    paddingHorizontal: 32,
                    paddingTop: 12,
                    alignItems: "center",
                    width: 0.8 * windowWidth,
                    // borderColor: "#007BFF",
                    // borderWidth: 2,
                }}
            >
                <Text
                    style={{
                        fontSize: 20,
                        fontWeight: "bold",
                        color: "#222",
                        marginBottom: 8,
                    }}
                >
                    Loading Map Data...
                </Text>
                <Text style={{fontSize: 15, color: "#555", textAlign: "center"}}>
                    Please wait while we fetch the latest boundaries and polling
                    centers.
                </Text>
            </View>
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
