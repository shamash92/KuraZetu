import React from "react";
import {Pressable, ScrollView, StyleSheet, Text, View} from "react-native";
import {ArrowRight} from "lucide-react-native";
import {router, useLocalSearchParams} from "expo-router";

import {TLevelTabs} from "@/app/types";
import {perk} from "@/app/_utils/colors";
import {toTitleCase} from "@/app/_utils/toTitleCase";
import {useStationInfo} from "@/hooks/useStationInfo";

interface IRace {
    title: string;
    place?: string;
    level: TLevelTabs;
}

const RaceTile = ({race, onOpen}: {race: IRace; onOpen: (race: IRace) => void}) => (
    <Pressable
        // Feedback on touch-down; the push happens on release.
        style={({pressed}) => [styles.tile, pressed && styles.tilePressed]}
        onPress={() => onOpen(race)}
        accessibilityRole="button"
        accessibilityLabel={`Open ${race.title} results${race.place ? `, ${race.place}` : ""}`}
    >
        <View>
            <Text
                style={styles.tileName}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
            >
                {race.title}
            </Text>
            {race.place ? (
                <Text style={styles.tilePlace} numberOfLines={2}>
                    {race.place}
                </Text>
            ) : null}
        </View>
        <View style={styles.tileGo}>
            <ArrowRight size={18} color={perk.limeInk} strokeWidth={2.4} />
        </View>
    </Pressable>
);

const PollingStationResultsSummaryList = () => {
    const {id} = useLocalSearchParams<{id: string}>();

    const station = useStationInfo();

    const county = station?.county ? toTitleCase(station.county) : undefined;

    // The six races, laid out by the ground each one covers: the country, then
    // the county's three seats side by side, then the constituency and the ward.
    const president: IRace = {title: "President", place: "National", level: "president"};
    const countyRaces: IRace[] = [
        {title: "Governor", place: county, level: "governor"},
        {title: "Senator", place: county, level: "senator"},
        {title: "Woman Rep", place: county, level: "womanRep"},
    ];
    const localRaces: IRace[] = [
        {
            title: "MP",
            place: station?.constituency ? toTitleCase(station.constituency) : undefined,
            level: "mp",
        },
        {
            title: "MCA",
            place: station?.ward ? `${toTitleCase(station.ward)} Ward` : undefined,
            level: "mca",
        },
    ];

    const openRace = (race: IRace) => {
        router.navigate(`/communityNotes/${id}/${race.level}`);
    };

    return (
        <View style={styles.screen}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Context only: which centre and stream this is. */}
                {station ? (
                    <View style={styles.centre}>
                        <Text style={styles.centreName} numberOfLines={2}>
                            {toTitleCase(station.polling_center)}
                        </Text>
                        <Text style={styles.centreMeta} numberOfLines={1}>
                            Stream {station.stream_number} ·{" "}
                            {station.registered_voters.toLocaleString()} voters ·{" "}
                            <Text style={styles.centreCode}>{station.code}</Text>
                        </Text>
                    </View>
                ) : null}

                <Pressable
                    style={({pressed}) => [
                        styles.president,
                        pressed && styles.presidentPressed,
                    ]}
                    onPress={() => openRace(president)}
                    accessibilityRole="button"
                    accessibilityLabel="Open President results, National"
                >
                    <View style={styles.presidentText}>
                        <Text style={styles.presidentName}>{president.title}</Text>
                        <Text style={styles.presidentPlace}>{president.place}</Text>
                    </View>
                    <View style={styles.presidentGo}>
                        <ArrowRight size={22} color={perk.lime} strokeWidth={2.4} />
                    </View>
                </Pressable>

                <View style={styles.row}>
                    {countyRaces.map((race) => (
                        <RaceTile key={race.level} race={race} onOpen={openRace} />
                    ))}
                </View>

                {localRaces.map((race) => (
                    <Pressable
                        key={race.level}
                        style={({pressed}) => [styles.wide, pressed && styles.tilePressed]}
                        onPress={() => openRace(race)}
                        accessibilityRole="button"
                        accessibilityLabel={`Open ${race.title} results${race.place ? `, ${race.place}` : ""}`}
                    >
                        <View style={styles.presidentText}>
                            <Text style={styles.wideName}>{race.title}</Text>
                            {race.place ? (
                                <Text style={styles.widePlace} numberOfLines={1}>
                                    {race.place}
                                </Text>
                            ) : null}
                        </View>
                        <View style={styles.wideGo}>
                            <ArrowRight
                                size={20}
                                color={perk.limeInk}
                                strokeWidth={2.4}
                            />
                        </View>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
};

export default PollingStationResultsSummaryList;

const GAP = 8;

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
        paddingTop: 8,
        // Clears the floating tab bar.
        paddingBottom: 132,
        gap: GAP,
    },
    centre: {
        paddingHorizontal: 2,
        marginTop: 8,
        marginBottom: 20,
    },
    centreName: {
        fontSize: 17,
        lineHeight: 22,
        fontWeight: "700",
        letterSpacing: -0.2,
        color: perk.ink,
    },
    centreMeta: {
        marginTop: 2,
        fontSize: 14,
        lineHeight: 19,
        color: perk.mute,
        fontVariant: ["tabular-nums"],
    },
    centreCode: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 12,
        letterSpacing: 0.2,
    },
    president: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: perk.lime,
        borderRadius: 20,
        paddingVertical: 20,
        paddingLeft: 22,
        paddingRight: 18,
    },
    presidentPressed: {
        backgroundColor: perk.limeDeep,
        transform: [{scale: 0.98}],
    },
    presidentText: {
        flex: 1,
        minWidth: 0,
    },
    presidentName: {
        fontSize: 26,
        lineHeight: 30,
        fontWeight: "900",
        letterSpacing: -0.9,
        color: perk.limeInk,
    },
    presidentPlace: {
        marginTop: 2,
        fontSize: 14,
        lineHeight: 19,
        fontWeight: "500",
        color: perk.limeInk,
        opacity: 0.72,
    },
    presidentGo: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: perk.ink,
    },
    row: {
        flexDirection: "row",
        gap: GAP,
    },
    tile: {
        flex: 1,
        minWidth: 0,
        minHeight: 124,
        justifyContent: "space-between",
        gap: 12,
        backgroundColor: perk.surface,
        borderRadius: 20,
        padding: 14,
    },
    tilePressed: {
        backgroundColor: perk.paperVivid,
        transform: [{scale: 0.97}],
    },
    tileName: {
        fontSize: 17,
        lineHeight: 22,
        fontWeight: "800",
        letterSpacing: -0.3,
        color: perk.ink,
    },
    tilePlace: {
        marginTop: 2,
        fontSize: 13,
        lineHeight: 17,
        color: perk.mute,
    },
    wide: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: perk.surface,
        borderRadius: 20,
        paddingVertical: 16,
        paddingLeft: 22,
        paddingRight: 18,
    },
    wideName: {
        fontSize: 20,
        lineHeight: 25,
        fontWeight: "800",
        letterSpacing: -0.5,
        color: perk.ink,
    },
    widePlace: {
        marginTop: 2,
        fontSize: 14,
        lineHeight: 19,
        color: perk.mute,
    },
    wideGo: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: perk.lime,
    },
    tileGo: {
        alignSelf: "flex-end",
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: perk.lime,
    },
});
