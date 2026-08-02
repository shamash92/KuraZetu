import {StyleSheet, Text, View} from "react-native";

import React from "react";
import {perk} from "@/app/_utils/colors";

interface VoteSummaryProps {
    totalValidVotes: number;
    rejectedVotes: number;
    disputedVotes: number;
    registeredVoters: number;
    rejectedObjectedTo: number;
}

//TODO: Flag (in UI) if there is issues with the data, e.g bigger turnout than registered voters
export function VoteSummary({
    totalValidVotes,
    rejectedVotes,
    disputedVotes,
    registeredVoters,
    rejectedObjectedTo,
}: VoteSummaryProps) {
    const totalVotesCast =
        totalValidVotes + rejectedVotes + disputedVotes + rejectedObjectedTo;

    const turnoutPercentage =
        registeredVoters > 0
            ? ((totalVotesCast / registeredVoters) * 100).toFixed(1)
            : "0.0";

    const rejectionRate =
        totalVotesCast > 0
            ? ((rejectedVotes / totalVotesCast) * 100).toFixed(2)
            : "0.00";

    return (
        <View style={styles.card}>
            <Text style={styles.head}>Vote summary</Text>

            <View style={styles.grid}>
                <View style={[styles.tile, {backgroundColor: perk.mint}]}>
                    <Text style={[styles.tileValue, {color: perk.greenDeep}]}>
                        {totalValidVotes.toLocaleString()}
                    </Text>
                    <Text style={[styles.tileLabel, {color: perk.greenDeep}]}>
                        VALID VOTES
                    </Text>
                </View>
                <View style={[styles.tile, {backgroundColor: perk.coral}]}>
                    <Text style={[styles.tileValue, {color: perk.coralDeep}]}>
                        {rejectedVotes.toLocaleString()}
                    </Text>
                    <Text style={[styles.tileLabel, {color: perk.coralDeep}]}>
                        REJECTED
                    </Text>
                </View>
                <View style={[styles.tile, {backgroundColor: perk.periwinkle}]}>
                    <Text style={[styles.tileValue, {color: perk.periwinkleDeep}]}>
                        {disputedVotes.toLocaleString()}
                    </Text>
                    <Text style={[styles.tileLabel, {color: perk.periwinkleDeep}]}>
                        DISPUTED
                    </Text>
                </View>
                <View style={[styles.tile, {backgroundColor: perk.surface}]}>
                    <Text style={[styles.tileValue, {color: perk.ink}]}>
                        {rejectedObjectedTo.toLocaleString()}
                    </Text>
                    <Text style={[styles.tileLabel, {color: perk.mute}]}>
                        REJECTED · OBJECTED
                    </Text>
                </View>
            </View>

            <View style={styles.lines}>
                <View style={styles.line}>
                    <Text style={styles.lineLabel}>Total votes cast</Text>
                    <Text style={styles.lineValue}>
                        {totalVotesCast.toLocaleString()}
                    </Text>
                </View>
                <View style={styles.line}>
                    <Text style={styles.lineLabel}>Voter turnout</Text>
                    <Text style={styles.lineValue}>{turnoutPercentage}%</Text>
                </View>
                <View style={styles.line}>
                    <Text style={styles.lineLabel}>Rejection rate</Text>
                    <Text style={styles.lineValue}>{rejectionRate}%</Text>
                </View>
            </View>
        </View>
    );
}

export default VoteSummary;

const styles = StyleSheet.create({
    card: {
        borderWidth: 1.5,
        borderColor: perk.ink,
        borderRadius: 14,
        overflow: "hidden",
        marginTop: 16,
    },
    head: {
        backgroundColor: perk.ink,
        color: perk.lime,
        fontSize: 13.5,
        fontWeight: "800",
        letterSpacing: 0.2,
        paddingVertical: 9,
        paddingHorizontal: 14,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        padding: 12,
    },
    tile: {
        flexGrow: 1,
        flexBasis: "45%",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 8,
        alignItems: "center",
    },
    tileValue: {
        fontSize: 22,
        fontWeight: "900",
        letterSpacing: -0.4,
    },
    tileLabel: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 8,
        fontWeight: "700",
        letterSpacing: 1,
        marginTop: 3,
    },
    lines: {
        paddingHorizontal: 14,
        paddingBottom: 12,
        paddingTop: 2,
    },
    line: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 7,
        borderTopWidth: 1,
        borderTopColor: perk.rule08,
    },
    lineLabel: {
        fontSize: 12,
        color: perk.ink,
    },
    lineValue: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 12,
        fontWeight: "700",
        color: perk.ink,
    },
});
