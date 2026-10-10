import React, {useEffect, useState} from "react";
import {Pressable, ScrollView, StyleSheet, Text, View} from "react-native";

import {ArrowRight} from "lucide-react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {apiBaseURL} from "@/app/_utils/apiBaseURL";
import {perk} from "@/app/_utils/colors";
import {router} from "expo-router";
import useAuthStore from "@/app/_utils/authStore";
import {handleUnauthorized} from "@/app/_utils/handleUnauthorized";

export interface IPollingCenterInfo {
    code: string;
    constituency: string;
    county: string;
    id: number;
    name: string;
    ward: string;
}

export interface IPollingStation {
    code: string;
    date_created: string;
    date_modified: string;
    is_verified: boolean;
    registered_voters: number;
    stream_number: number;
}

// Sponsors and bodies that prefix school and hall names in the register. They
// stay in capitals when the rest of a name is set in title case.
const NAME_ACRONYMS = new Set([
    "ABC", "ACC", "ACK", "AGC", "AIC", "AIPCA", "AP", "CCM", "CDF", "DEB", "ECD",
    "ECDE", "ELCK", "FPFK", "GK", "KAG", "KMTC", "KWS", "MCK", "NYS", "PAG",
    "PCEA", "PEFA", "RC", "SA", "SDA", "TTC",
]);

// Names arrive in capitals from the register. Set as running text they read as
// a place, not a label.
const toTitleCase = (text: string) =>
    text
        .split(/(\s+|[-/()])/)
        .map((word) =>
            NAME_ACRONYMS.has(word.replace(/\./g, "").toUpperCase())
                ? word.toUpperCase()
                : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join("");

const ElectionResultsApp = () => {
    const [pollingCenterInfo, setPollingCenterInfo] =
        useState<IPollingCenterInfo | null>(null);
    const [stations, setStations] = useState<IPollingStation[]>([]);

    const {userToken} = useAuthStore();

    useEffect(() => {
        if (!userToken) return;

        const fetchPollingCenter = async () => {
            try {
                const response = await fetch(
                    `${apiBaseURL}/api/stations/community-notes/polling-center-info/`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${userToken}`,
                        },
                    },
                );
                if (await handleUnauthorized(response)) return;
                const data = await response.json();
                if (data && data.data) {
                    setPollingCenterInfo(data.data);
                    setStations(data.stations || []);
                }
            } catch (error) {
                console.error("Error fetching polling center info:", error);
            }
        };

        void fetchPollingCenter();
    }, [userToken]);

    const totalVoters = stations?.reduce(
        (acc, station) => acc + station.registered_voters,
        0,
    );

    const place = pollingCenterInfo
        ? [pollingCenterInfo.ward, pollingCenterInfo.constituency, pollingCenterInfo.county]
              .filter(Boolean)
              .map(toTitleCase)
        : [];
    if (place.length > 0 && pollingCenterInfo?.ward) place[0] = `${place[0]} Ward`;

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Context only: which centre this is. The streams below are
                    what the screen is for, so this stays small and flat. */}
                {pollingCenterInfo ? (
                    <View style={styles.centre}>
                        <Text style={styles.centreName} numberOfLines={2}>
                            {toTitleCase(pollingCenterInfo.name)}
                        </Text>
                        <Text style={styles.centrePlace}>{place.join(" · ")}</Text>
                    </View>
                ) : null}

                {stations.length > 0 ? (
                    <>
                        <View style={styles.promptRow}>
                            <Text style={styles.prompt} accessibilityRole="header">
                                {stations.length === 1
                                    ? "Open your stream"
                                    : "Choose a stream"}
                            </Text>
                            <Text style={styles.promptTotal}>
                                {totalVoters.toLocaleString()} voters
                            </Text>
                        </View>

                        {stations.map((station) => (
                            <Pressable
                                key={station.code}
                                // Feedback on touch-down; the push happens on release.
                                style={({pressed}) => [
                                    styles.stream,
                                    pressed && styles.streamPressed,
                                ]}
                                onPress={() => {
                                    router.navigate(`/communityNotes/${station.code}`);
                                }}
                                accessibilityRole="button"
                                accessibilityLabel={`Open stream ${station.stream_number}, ${station.registered_voters.toLocaleString()} registered voters`}
                            >
                                <View style={styles.streamText}>
                                    <Text style={styles.streamName}>
                                        Stream {station.stream_number}
                                    </Text>
                                    <Text style={styles.streamVoters} numberOfLines={1}>
                                        {station.registered_voters.toLocaleString()}{" "}
                                        voters ·{" "}
                                        <Text style={styles.streamCode}>
                                            {station.code}
                                        </Text>
                                    </Text>
                                </View>
                                {/* Lime is the app's action colour: the round
                                    button is what says the card opens. */}
                                <View style={styles.streamGo}>
                                    <ArrowRight
                                        size={20}
                                        color={perk.limeInk}
                                        strokeWidth={2.4}
                                    />
                                </View>
                            </Pressable>
                        ))}
                    </>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
};

export default ElectionResultsApp;

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: perk.card,
    },
    scroll: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 20,
        // Clears the floating tab bar.
        paddingBottom: 132,
    },
    centre: {
        paddingBottom: 18,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: perk.rule16,
    },
    centreName: {
        fontSize: 17,
        lineHeight: 22,
        fontWeight: "700",
        letterSpacing: -0.2,
        color: perk.ink,
    },
    centrePlace: {
        marginTop: 2,
        fontSize: 14,
        lineHeight: 19,
        color: perk.mute,
    },
    promptRow: {
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 22,
        marginBottom: 10,
    },
    prompt: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: "600",
        letterSpacing: -0.1,
        color: perk.ink,
    },
    promptTotal: {
        fontSize: 14,
        color: perk.mute,
        fontVariant: ["tabular-nums"],
    },
    stream: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: perk.surface,
        borderRadius: 16,
        paddingVertical: 14,
        paddingLeft: 18,
        paddingRight: 14,
        marginBottom: 8,
    },
    streamPressed: {
        backgroundColor: perk.paperVivid,
        transform: [{scale: 0.98}],
    },
    streamText: {
        flex: 1,
        minWidth: 0,
    },
    streamName: {
        fontSize: 17,
        lineHeight: 22,
        fontWeight: "800",
        letterSpacing: -0.2,
        color: perk.ink,
    },
    streamVoters: {
        marginTop: 2,
        fontSize: 14,
        lineHeight: 19,
        color: perk.mute,
        fontVariant: ["tabular-nums"],
    },
    streamCode: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 12,
        letterSpacing: 0.2,
    },
    streamGo: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: perk.lime,
    },
});
