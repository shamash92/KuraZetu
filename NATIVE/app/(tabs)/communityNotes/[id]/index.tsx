import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {ChevronLeft, ChevronRight} from "lucide-react-native";
import {router, useLocalSearchParams} from "expo-router";

import {SafeAreaView} from "react-native-safe-area-context";
import {TLevelTabs} from "@/app/types";
import {perk} from "@/app/_utils/colors";
import {useStationInfo} from "@/hooks/useStationInfo";

const PollingStationResultsSummaryList = () => {
    const {id} = useLocalSearchParams<{id: string}>();

    const station = useStationInfo();

    const races: {id: string; title: string; geo?: string; level: TLevelTabs}[] = [
        {id: "presidential", title: "President", geo: "National", level: "president"},
        {
            id: "governor",
            title: "Governor",
            geo: station?.county ?? undefined,
            level: "governor",
        },
        {
            id: "senator",
            title: "Senator",
            geo: station?.county ?? undefined,
            level: "senator",
        },
        {id: "mp", title: "MP", geo: station?.constituency ?? undefined, level: "mp"},
        {
            id: "woman-rep",
            title: "Woman Rep",
            geo: station?.county ?? undefined,
            level: "womanRep",
        },
        {id: "mca", title: "MCA", geo: `${station?.ward} Ward`, level: "mca"},
    ];

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.top}>
                    <TouchableOpacity
                        style={styles.back}
                        onPress={() => router.back()}
                        activeOpacity={0.8}
                    >
                        <ChevronLeft size={16} color={perk.ink} />
                    </TouchableOpacity>
                    <Text style={styles.topLabel}>POLLING STATION RESULTS</Text>
                </View>

                {/* Station */}
                <Text style={styles.stationName}>
                    {station?.polling_center}
                </Text>
                <Text style={styles.stationMeta}>
                    Stream {station?.stream_number} · {station?.code} ·{" "}
                    {station?.registered_voters} voters
                </Text>

                {/* Races */}
                <Text style={styles.sectionLabel}>ELECTION RESULTS</Text>
                <View style={styles.raceList}>
                    {races.map((race, idx) => (
                        <TouchableOpacity
                            key={race.id}
                            style={[styles.raceRow, idx > 0 && styles.raceRowBorder]}
                            onPress={() => {
                                router.navigate(
                                    `/communityNotes/${id}/${race.level}`,
                                );
                            }}
                            activeOpacity={0.8}
                        >
                            <View style={styles.raceText}>
                                <Text style={styles.raceName}>{race.title}</Text>
                                <Text style={styles.raceGeo}>{race.geo}</Text>
                            </View>
                            <ChevronRight size={15} color={perk.copperDeep} />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default PollingStationResultsSummaryList;

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
        paddingTop: 12,
        paddingBottom: 40,
    },
    top: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    back: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: perk.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    topLabel: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1.6,
        color: perk.mute,
    },
    stationName: {
        fontSize: 17,
        fontWeight: "900",
        letterSpacing: -0.2,
        textTransform: "uppercase",
        color: perk.ink,
    },
    stationMeta: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 10,
        color: perk.mute,
        letterSpacing: 0.6,
        marginTop: 3,
    },
    sectionLabel: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1.8,
        color: perk.ink,
        marginTop: 18,
        marginBottom: 8,
    },
    raceList: {
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: perk.surface,
    },
    raceRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    raceRowBorder: {
        borderTopWidth: 1,
        borderTopColor: perk.rule08,
    },
    raceText: {
        flex: 1,
        minWidth: 0,
    },
    raceName: {
        fontSize: 13,
        fontWeight: "800",
        letterSpacing: -0.2,
        color: perk.ink,
    },
    raceGeo: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 8,
        color: perk.mute,
        letterSpacing: 1,
        marginTop: 2,
        textTransform: "uppercase",
    },
});
