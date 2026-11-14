import {FlatList, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {statusBarHeight} from "@/app/_utils/device/screenDimensions";

import {Ionicons} from "@expo/vector-icons";
import React, {useState} from "react";
import {perk} from "@/app/_utils/colors";
import {Redirect, router, useLocalSearchParams} from "expo-router";
import {SignupLocationLoading} from "@/components/auth/signupLocationLoading";
import {SignupLocationMap} from "@/components/auth/signupLocationMap";
import {useSignupLocationData} from "@/app/_utils/auth/useSignupLocationData";

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
    const [selectedCounty, setSelectedCounty] = useState<number | null>(null);
    const [selectedCountyName, setSelectedCountyName] = useState<string | null>(null);
    const [selectedConstituency, setSelectedConstituency] = useState<number | null>(
        null,
    );
    const [selectedConstituencyName, setSelectedConstituencyName] = useState<
        string | null
    >(null);
    const [selectedWard, setSelectedWard] = useState<number | null>(null);
    const [selectedWardName, setSelectedWardName] = useState<string | null>(null);
    const [selectedPollingCenter, setSelectedPollingCenter] = useState<string | null>(
        null,
    );
    const [mapRegion, setMapRegion] = useState({
        latitude: 0,
        longitude: 37.7,
        latitudeDelta: 8,
        longitudeDelta: 8,
    });

    const step = routeStep;
    const {
        counties,
        constituencies,
        wards,
        pollingCenters,
        countyLoadError,
        isIntroPlaying,
        retry,
    } = useSignupLocationData(step, params);
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
            (acc: any, coord: Array<number>) => ({
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

    const finish = () =>
        router.replace(
            `/auth/phoneVerification?ward=${params.ward}&pollingCenter=${selectedPollingCenter}`,
        );
    const proceed = () => {
        if (step === "county" && selectedCounty) {
            router.push({
                pathname: "/auth/signup/[step]",
                params: {step: "constituency", county: String(selectedCounty), countyName: selectedCountyName ?? ""},
            });
        }
        if (step === "constituency" && selectedConstituency) {
            router.push({
                pathname: "/auth/signup/[step]",
                params: {
                    step: "ward",
                    county: params.county ?? "",
                    countyName: params.countyName ?? "",
                    constituency: String(selectedConstituency),
                    constituencyName: selectedConstituencyName ?? "",
                },
            });
        }
        if (step === "ward" && selectedWard) {
            router.push({
                pathname: "/auth/signup/[step]",
                params: {
                    step: "centre",
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

    const data: Array<any> =
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
    const mapFeatures: Array<any> =
        step === "county"
            ? (counties ?? [])
            : step === "constituency"
              ? (constituencies?.features ?? [])
              : step === "ward"
                ? (wards?.features ?? [])
                : [];

    if (counties === null || (isIntroPlaying && countyLoadError === null))
        return (
            <SignupLocationLoading error={countyLoadError} onRetry={retry} />
        );

    return (
        <View style={styles.screen}>
            <SignupLocationMap
                step={step}
                mapRegion={mapRegion}
                mapFeatures={mapFeatures}
                data={data}
                selectedId={selectedId}
                selectedPollingCenter={selectedPollingCenter}
                onPollingCenterPress={handlePollingCenterPress}
            />

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

const styles = StyleSheet.create({
    screen: {flex: 1, backgroundColor: perk.card, paddingTop: statusBarHeight},
    backButton: {
        width: 44,
        height: 36,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: perk.surface,
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
});

export default function SignupEntry() {
    return <Redirect href="/auth/signup/county" />;
}
