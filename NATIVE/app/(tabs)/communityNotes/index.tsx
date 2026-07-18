import React, {useEffect, useState} from "react";
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import {ChevronRight} from "lucide-react-native";
import {apiBaseURL} from "@/app/_utils/apiBaseURL";
import {perk} from "@/app/_utils/colors";
import {router} from "expo-router";
import useAuthStore from "@/app/_utils/authStore";
import useCurrentPollingStationStore from "@/app/_utils/curentStationStore";

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

const ElectionResultsApp = () => {
    const [pollingCenterInfo, setPollingCenterInfo] =
        useState<IPollingCenterInfo | null>(null);

    const {
        setStations,
        stations,
        currentStationCode,
        setCurrentCenter,
        setCurrentStationCode,
        currentCenter,
    } = useCurrentPollingStationStore();

    const {userToken} = useAuthStore();

    useEffect(() => {
        if (!userToken) return;

        fetch(`${apiBaseURL}/api/stations/community-notes/polling-center-info/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${userToken}`,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                // console.log(data);
                if (data && data.data) {
                    // console.log(data.data, "data.data");
                    setPollingCenterInfo(data.data);
                    setCurrentCenter(data.data);
                    setStations(data.stations || []);
                }
            })
            .catch((error) => {
                console.error("Error fetching polling center info:", error);
            });
    }, [userToken]);

    const totalVoters = stations?.reduce(
        (acc, station) => acc + station.registered_voters,
        0,
    );

    return (
        <SafeAreaView style={styles.screen}>
            <StatusBar barStyle="dark-content" backgroundColor={perk.card} />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Centre card */}
                <View key={pollingCenterInfo?.code} style={styles.centreCard}>
                    <Text style={styles.centreName}>{pollingCenterInfo?.name}</Text>
                    <Text style={styles.centreMeta}>
                        {pollingCenterInfo?.county} · {pollingCenterInfo?.constituency}{" "}
                        · {pollingCenterInfo?.ward} Ward
                    </Text>

                    <View style={styles.centreStats}>
                        <View style={styles.centreStat}>
                            <Text style={styles.centreStatValue}>
                                {stations?.length.toLocaleString()}
                            </Text>
                            <Text style={styles.centreStatLabel}>STATIONS</Text>
                        </View>
                        <View style={styles.centreStat}>
                            <Text style={styles.centreStatValue}>
                                {totalVoters?.toLocaleString()}
                            </Text>
                            <Text style={styles.centreStatLabel}>TOTAL VOTERS</Text>
                        </View>
                    </View>
                </View>

                {/* Polling stations */}
                <Text style={styles.sectionLabel}>POLLING STATIONS</Text>
                {stations &&
                    stations.map((station) => {
                        const lead = station.stream_number === 1;
                        return (
                            <TouchableOpacity
                                key={station.code}
                                style={[styles.streamRow, lead && styles.streamRowLead]}
                                onPress={() => {
                                    router.navigate(`/communityNotes/${station.code}`);
                                    setCurrentStationCode(station.code);
                                }}
                                activeOpacity={0.9}
                            >
                                <View
                                    style={[
                                        styles.streamNum,
                                        lead && styles.streamNumLead,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.streamNumValue,
                                            lead && styles.streamNumValueLead,
                                        ]}
                                    >
                                        {station.stream_number}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.streamNumLabel,
                                            lead && styles.streamNumLabelLead,
                                        ]}
                                    >
                                        STRM
                                    </Text>
                                </View>
                                <View style={styles.streamText}>
                                    <Text style={styles.streamName}>
                                        Stream {station.stream_number}
                                    </Text>
                                    <Text style={styles.streamCode}>
                                        {station.code}
                                    </Text>
                                </View>
                                <View style={styles.streamVv}>
                                    <Text style={styles.streamVvValue}>
                                        {station.registered_voters.toLocaleString()}
                                    </Text>
                                    <Text style={styles.streamVvLabel}>VOTERS</Text>
                                </View>
                                <ChevronRight size={18} color={perk.copperDeep} />
                            </TouchableOpacity>
                        );
                    })}
            </ScrollView>
        </SafeAreaView>
    );
};

export default ElectionResultsApp;

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: perk.card,
        paddingTop: StatusBar.currentHeight || 0,
    },
    scroll: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 40,
    },
    centreCard: {
        backgroundColor: perk.surface,
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
    },
    centreName: {
        fontSize: 16,
        fontWeight: "900",
        letterSpacing: -0.2,
        textTransform: "uppercase",
        color: perk.limeDeep,
    },
    centreMeta: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 10,
        color: perk.mute,
        letterSpacing: 0.8,
        marginTop: 3,
        textTransform: "uppercase",
    },
    centreStats: {
        flexDirection: "row",
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: perk.rule08,
    },
    centreStat: {
        flex: 1,
        alignItems: "center",
    },
    centreStatValue: {
        fontSize: 22,
        fontWeight: "900",
        letterSpacing: -0.4,
        color: perk.ink,
    },
    centreStatLabel: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 9,
        fontWeight: "700",
        letterSpacing: 1.4,
        color: perk.mute,
        marginTop: 2,
    },
    sectionLabel: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1.8,
        color: perk.ink,
        marginBottom: 8,
    },
    streamRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: perk.card,
        borderWidth: 1.5,
        borderColor: perk.ink,
        borderRadius: 13,
        paddingVertical: 11,
        paddingHorizontal: 12,
        marginBottom: 9,
    },
    streamRowLead: {},
    streamNum: {
        width: 40,
        alignSelf: "stretch",
        borderRadius: 9,
        backgroundColor: perk.surface,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 6,
    },
    streamNumLead: {
        backgroundColor: perk.lime,
    },
    streamNumValue: {
        fontSize: 17,
        fontWeight: "900",
        color: perk.ink,
    },
    streamNumValueLead: {
        color: perk.limeInk,
    },
    streamNumLabel: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 7,
        fontWeight: "700",
        letterSpacing: 1,
        color: perk.mute,
        marginTop: 1,
    },
    streamNumLabelLead: {
        color: perk.limeInk,
    },
    streamText: {
        flex: 1,
        minWidth: 0,
    },
    streamName: {
        fontSize: 13,
        fontWeight: "800",
        letterSpacing: -0.2,
        color: perk.ink,
    },
    streamCode: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 9,
        color: perk.mute,
        letterSpacing: 0.6,
        marginTop: 3,
    },
    streamVv: {
        alignItems: "flex-end",
    },
    streamVvValue: {
        fontSize: 15,
        fontWeight: "900",
        color: perk.ink,
    },
    streamVvLabel: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 7,
        fontWeight: "700",
        letterSpacing: 1,
        color: perk.mute,
        marginTop: 1,
    },
});
