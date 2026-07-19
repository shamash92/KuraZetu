import {FlatList, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import MapView, {Geojson, GeojsonProps, Marker} from "react-native-maps";
import {statusBarHeight, windowHeight, windowWidth} from "../_utils/screenDimensions";
import {useEffect, useState} from "react";

import {ICountyFeature} from "../types";
import {Ionicons} from "@expo/vector-icons";
import LottieComponent from "@/components/lottieLoading";
import React from "react";
import {apiBaseURL} from "../_utils/apiBaseURL";
import {perk} from "../_utils/colors";
import {Redirect, router, useLocalSearchParams} from "expo-router";

type Step = "county" | "constituency" | "ward" | "centre";

export function MapUpdates({routeStep = "county"}: {routeStep?: Step}) {
    const params = useLocalSearchParams<{
        county?: string;
        countyName?: string;
        constituency?: string;
        constituencyName?: string;
        ward?: string;
        wardName?: string;
    }>();
    const [counties, setCounties] = useState<ICountyFeature[] | null>(null);
    const [countyLoadError, setCountyLoadError] = useState<string | null>(null);
    const [countyLoadAttempt, setCountyLoadAttempt] = useState(0);
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
    const [mapReady, setMapReady] = useState(false);
    const [mapRegion, setMapRegion] = useState({
        latitude: 0,
        longitude: 37.7,
        latitudeDelta: 8,
        longitudeDelta: 8,
    });

    const step = routeStep;
    const stepNumber = {county: 1, constituency: 2, ward: 3, centre: 4}[step];
    const heading = {
        county: "county",
        constituency: "constituency",
        ward: "ward",
        centre: "polling centre",
    }[step];
    const context =
        step === "constituency"
            ? params.countyName
            : step === "ward"
              ? params.constituencyName
              : step === "centre"
                ? params.wardName
                : null;

    const focusFeature = (feature: any, multiplier: number) => {
        const coordinates = feature?.geometry?.coordinates?.[0];
        if (!Array.isArray(coordinates) || !coordinates.length) return;
        const center = coordinates.reduce(
            (acc: any, coord: number[]) => ({
                latitude: acc.latitude + coord[1],
                longitude: acc.longitude + coord[0],
            }),
            {latitude: 0, longitude: 0},
        );
        center.latitude /= coordinates.length;
        center.longitude /= coordinates.length;
        setMapRegion({
            latitude: center.latitude,
            longitude: center.longitude,
            latitudeDelta: Math.max(
                Math.abs(coordinates[0][1] - coordinates[2][1]) * multiplier,
                0.012,
            ),
            longitudeDelta: Math.max(
                Math.abs(coordinates[0][0] - coordinates[2][0]) * multiplier,
                0.012,
            ),
        });
    };

    const handleCountyPress = (countyId: number) => {
        const county = counties?.find((item) => item.properties?.number === countyId);
        setSelectedCounty(countyId);
        setSelectedCountyName(county?.properties?.name ?? null);
        focusFeature(county, 7);
    };
    const handleConstituencyPress = (id: number) => {
        const constituency = constituencies?.features.find(
            (item: any) => item.properties?.number === id,
        );
        setSelectedConstituency(id);
        setSelectedConstituencyName(constituency?.properties?.name ?? null);
        focusFeature(constituency, 100);
    };
    const handleWardPress = (id: number) => {
        const ward = wards?.features.find(
            (item: any) => item.properties?.number === id,
        );
        setSelectedWard(id);
        setSelectedWardName(ward?.properties?.name ?? null);
        focusFeature(ward, 30);
    };
    const handlePollingCenterPress = (id: string) => {
        const centre = pollingCenters?.features.find(
            (item: any) => item.properties?.code === id,
        );
        setSelectedPollingCenter(id);
        const coordinates = centre?.geometry?.coordinates;
        if (Array.isArray(coordinates))
            // Approximately map zoom level 20: clearly show the selected centre.
            setMapRegion({
                latitude: coordinates[1],
                longitude: coordinates[0],
                latitudeDelta: 0.0005,
                longitudeDelta: 0.0005,
            });
    };

    useEffect(() => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15_000);

        fetch(`${apiBaseURL}/api/stations/counties/boundaries/`, {
            signal: controller.signal,
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }
                return response.json();
            })
            .then((data) =>
                setCounties(
                    (data?.features ?? []).filter(
                        (item: any) =>
                            item.geometry &&
                            Array.isArray(item.geometry.coordinates) &&
                            item.geometry.coordinates.length,
                    ),
                ),
            )
            .catch(() => {
                if (!controller.signal.aborted) {
                    setCountyLoadError("Could not load map data. Check your connection and try again.");
                } else {
                    setCountyLoadError("Loading map data took too long. Please try again.");
                }
            })
            .finally(() => clearTimeout(timeout));

        return () => {
            clearTimeout(timeout);
            controller.abort();
        };
    }, [countyLoadAttempt]);

    useEffect(() => {
        if (step === "constituency" && params.county) {
            fetchConstituencies(Number(params.county));
        }
        if (step === "ward" && params.constituency) {
            fetchWards(Number(params.constituency));
        }
        if (step === "centre" && params.ward) {
            fetchPollingCenters(Number(params.ward));
        }
    }, [step, params.county, params.constituency, params.ward]);

    const fetchConstituencies = (id: number) =>
        fetch(`${apiBaseURL}/api/stations/county/${id}/constituencies/boundaries/`)
            .then((response) => response.json())
            .then(setConstituencies);
    const fetchWards = (id: number) =>
        fetch(`${apiBaseURL}/api/stations/constituencies/${id}/wards/boundaries/`)
            .then((response) => response.json())
            .then(setWards);
    const fetchPollingCenters = (id: number) =>
        fetch(`${apiBaseURL}/api/stations/wards/${id}/polling-centers/pins/`)
            .then((response) => response.json())
            .then(setPollingCenters);

    const finish = () =>
        router.replace(
            `/auth/signUpForm?ward=${params.ward}&pollingCenter=${selectedPollingCenter}`,
        );
    const proceed = () => {
        if (step === "county" && selectedCounty) {
            router.push({
                pathname: "/auth/signup/constituency",
                params: {county: String(selectedCounty), countyName: selectedCountyName ?? ""},
            });
        }
        if (step === "constituency" && selectedConstituency) {
            router.push({
                pathname: "/auth/signup/ward",
                params: {
                    county: params.county ?? "",
                    countyName: params.countyName ?? "",
                    constituency: String(selectedConstituency),
                    constituencyName: selectedConstituencyName ?? "",
                },
            });
        }
        if (step === "ward" && selectedWard) {
            router.push({
                pathname: "/auth/signup/centre",
                params: {
                    ward: String(selectedWard),
                    wardName: selectedWardName ?? "",
                },
            });
        }
        if (step === "centre" && selectedPollingCenter) finish();
    };
    const goBack = () => {
        console.log("Signup location back pressed", {step});
        router.back();
    };

    const data: any[] =
        step === "county"
            ? (counties ?? [])
            : step === "constituency"
              ? (constituencies?.features ?? [])
              : step === "ward"
                ? (wards?.features ?? [])
                : (pollingCenters?.features ?? []);
    const selectedId =
        step === "county"
            ? selectedCounty
            : step === "constituency"
              ? selectedConstituency
              : step === "ward"
                ? selectedWard
                : selectedPollingCenter;
    const selectedName =
        step === "county"
            ? selectedCountyName
            : step === "constituency"
              ? selectedConstituencyName
              : step === "ward"
                ? selectedWardName
                : pollingCenters?.features.find(
                      (item: any) => item.properties?.code === selectedPollingCenter,
                  )?.properties?.name;
    const nextLabel =
        step === "county"
            ? `Proceed to ${selectedName ?? "selected"} constituencies`
            : step === "constituency"
              ? `Proceed to ${selectedName ?? "selected"} wards`
              : step === "ward"
                ? `Proceed to ${selectedName ?? "selected"} centres`
                : `Confirm ${selectedName ?? "selection"}`;
    const mapFeatures: any[] =
        step === "county"
            ? (counties ?? [])
            : step === "constituency"
              ? (constituencies?.features ?? [])
              : step === "ward"
                ? (wards?.features ?? [])
                : [];

    if (counties === null)
        return (
            <Loading
                error={countyLoadError}
                onRetry={() => {
                    setCountyLoadError(null);
                    setCountyLoadAttempt((attempt) => attempt + 1);
                }}
            />
        );

    return (
        <View style={styles.screen}>
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

            <View style={styles.header}>
                {step !== "county" && (
                    <TouchableOpacity
                        accessibilityLabel="Go back"
                        onPress={goBack}
                        style={styles.backButton}
                    >
                        <Ionicons name="chevron-back" size={24} color={perk.ink} />
                    </TouchableOpacity>
                )}
                <View>
                    <Text style={styles.eyebrow}>
                        STEP {stepNumber} OF 5{context ? ` · ${context}` : ""}
                    </Text>
                    <Text style={styles.title}>
                        Select your {step === "centre" ? "" : "home "}
                        <Text style={styles.titleAccent}>{heading}</Text>
                    </Text>
                </View>
            </View>

            {selectedId !== null && (
                <TouchableOpacity
                    onPress={proceed}
                    style={styles.cta}
                    activeOpacity={0.85}
                >
                    <Text style={styles.ctaText}>{nextLabel}</Text>
                    <Ionicons name="arrow-forward" size={19} color={perk.limeInk} />
                </TouchableOpacity>
            )}

            <FlatList
                style={styles.list}
                data={data}
                keyExtractor={(item, index) =>
                    String(
                        item.properties?.number ??
                            item.properties?.code ??
                            item.id ??
                            index,
                    )
                }
                renderItem={({item}) => {
                    const id =
                        step === "centre"
                            ? item.properties?.code
                            : item.properties?.number;
                    const selected = id === selectedId;
                    const error = item.properties?.pin_location_error;
                    return (
                        <TouchableOpacity
                            onPress={() =>
                                step === "county"
                                    ? handleCountyPress(id)
                                    : step === "constituency"
                                      ? handleConstituencyPress(id)
                                      : step === "ward"
                                        ? handleWardPress(id)
                                        : handlePollingCenterPress(id)
                            }
                            style={[styles.row, selected && styles.rowSelected]}
                            activeOpacity={0.75}
                        >
                            <View style={styles.rowCopy}>
                                <Text style={styles.rowName}>
                                    {item.properties?.name ?? `Unnamed ${heading}`}
                                </Text>
                                {error ? (
                                    <Text
                                        style={[
                                            styles.rowNote,
                                            error.includes("outside")
                                                ? styles.warning
                                                : styles.error,
                                        ]}
                                    >
                                        {error}
                                    </Text>
                                ) : null}
                            </View>
                            {selected ? (
                                <View style={styles.check}>
                                    <Ionicons
                                        name="checkmark"
                                        size={17}
                                        color={perk.limeInk}
                                    />
                                </View>
                            ) : (
                                <Ionicons
                                    name="chevron-forward"
                                    size={19}
                                    color={perk.mute2}
                                />
                            )}
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
}

function Loading({error, onRetry}: {error: string | null; onRetry: () => void}) {
    return (
        <View style={styles.loading}>
            <LottieComponent
                name="maps-loading"
                backgroundColor={perk.paper}
                width={windowWidth}
            />
            <Text style={styles.loadingTitle}>Loading map data</Text>
            <Text style={styles.loadingText}>
                {error ?? "Fetching the latest boundaries and polling centres."}
            </Text>
            {error ? (
                <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
                    <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {flex: 1, backgroundColor: perk.card, paddingTop: statusBarHeight},
    mapWrap: {
        height: Math.min(windowHeight * 0.29, 245),
        overflow: "hidden",
        backgroundColor: "#0e2024",
    },
    map: {width: windowWidth, height: "100%"},
    backButton: {
        width: 44,
        height: 36,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: perk.surface,
    },
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
    header: {
        paddingHorizontal: 18,
        paddingTop: 17,
        paddingBottom: 12,
        flexDirection: "row",
        gap: 10,
        justifyContent: "flex-start",
        alignItems: "flex-start",
    },
    eyebrow: {fontFamily: "SpaceMono-Regular", fontSize: 11, fontWeight: "700", letterSpacing: 1.7, color: perk.copper},
    title: {
        marginTop: 5,
        maxWidth: 245,
        fontSize: 24,
        lineHeight: 28,
        fontWeight: "800",
        letterSpacing: -0.5,
        color: perk.ink,
    },
    titleAccent: {color: perk.copperDeep},
    cta: {
        marginHorizontal: 14,
        marginBottom: 9,
        paddingVertical: 15,
        paddingHorizontal: 18,
        borderRadius: 14,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
        backgroundColor: perk.lime,
        shadowColor: perk.limeDeep,
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 3,
    },
    ctaText: {
        fontSize: 15,
        fontWeight: "800",
        color: perk.limeInk,
        textAlign: "center",
    },
    list: {flex: 1},
    row: {
        minHeight: 59,
        paddingHorizontal: 18,
        paddingVertical: 12,
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: perk.rule08,
    },
    rowSelected: {backgroundColor: "rgba(196,255,94,0.2)"},
    rowCopy: {flex: 1},
    rowName: {fontSize: 17, fontWeight: "700", color: perk.ink, letterSpacing: -0.2},
    rowNote: {fontFamily: "SpaceMono-Regular", marginTop: 3, fontSize: 10, fontWeight: "600"},
    error: {color: perk.coralDeep},
    warning: {color: perk.copperDeep},
    check: {
        width: 27,
        height: 27,
        borderRadius: 14,
        backgroundColor: perk.lime,
        alignItems: "center",
        justifyContent: "center",
    },
    loading: {
        flex: 1,
        alignItems: "center",
        backgroundColor: perk.paper,
        paddingHorizontal: 32,
    },
    loadingTitle: {fontSize: 21, fontWeight: "800", color: perk.ink},
    loadingText: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 20,
        color: perk.mute,
        textAlign: "center",
    },
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: perk.lime,
    },
    retryText: {fontSize: 15, fontWeight: "800", color: perk.limeInk},
});

export default function SignupEntry() {
    return <Redirect href="/auth/signup/county" />;
}
