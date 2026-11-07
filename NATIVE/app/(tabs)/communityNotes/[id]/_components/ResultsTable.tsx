import {StyleSheet, Text, View} from "react-native";

import {IPollingStationResult} from "@/app/types";
import React from "react";
import {perk} from "@/app/_utils/colors";

export function ResultsTable({
    results,
    title = "Election Results",
}: {
    results: IPollingStationResult[];
    title?: string;
}) {
    // Sort candidates by votes in descending order
    const sortedCandidates = [...results].sort((a, b) => b.votes - a.votes);
    const totalVotes = results.reduce((sum, candidate) => sum + candidate.votes, 0);

    return (
        <View style={styles.wrapper}>
            <Text style={styles.title} accessibilityRole="header">
                {title}
            </Text>

            <View style={styles.headerRow}>
                <Text style={[styles.headerText, styles.rank]}>#</Text>
                <Text style={[styles.headerText, styles.candidate]}>Candidate</Text>
                <Text style={[styles.headerText, styles.votesHeader]}>Votes</Text>
            </View>

            {sortedCandidates.map((candidate, index) => {
                const hasVotes = candidate.votes > 0;
                // One decimal, so a small share does not run to many digits.
                const percentage = hasVotes
                    ? ((candidate.votes / totalVotes) * 100).toFixed(1)
                    : null;
                const isWinner = index === 0 && candidate.votes > 0;
                const isLast = index === sortedCandidates.length - 1;

                return (
                    <View
                        key={candidate.candidate.id}
                        style={[
                            styles.dataRow,
                            isWinner && styles.winnerRow,
                            isLast && styles.lastRow,
                        ]}
                    >
                        <Text style={[styles.rankText, styles.rank]}>{index + 1}</Text>
                        <View style={styles.candidate}>
                            <Text
                                style={[
                                    styles.name,
                                    candidate.votes === 0 && styles.nameNoVotes,
                                ]}
                                numberOfLines={2}
                            >
                                {candidate.candidate.first_name}{" "}
                                {candidate.candidate.last_name}
                            </Text>
                            <Text style={styles.party} numberOfLines={1}>
                                {candidate.candidate.party}
                            </Text>
                        </View>
                        <View style={styles.votes}>
                            <Text style={[styles.voteText, !hasVotes && styles.noVotes]}>
                                {candidate.votes.toLocaleString()}
                            </Text>
                            {percentage !== null && (
                                <Text
                                    style={[
                                        styles.percentText,
                                        isWinner && styles.percentWinner,
                                    ]}
                                >
                                    {percentage}%
                                </Text>
                            )}
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

export default ResultsTable;

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: perk.card,
        borderWidth: 1.5,
        borderColor: perk.ink,
        borderRadius: 14,
        overflow: "hidden",
    },
    title: {
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 10,
        fontSize: 17,
        fontWeight: "800",
        letterSpacing: -0.2,
        color: perk.ink,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: perk.surface,
        paddingVertical: 8,
        paddingHorizontal: 14,
    },
    headerText: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 9,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        color: perk.mute,
    },
    dataRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: perk.rule16,
    },
    lastRow: {
        borderBottomWidth: 0,
    },
    winnerRow: {
        backgroundColor: "rgba(196,255,94,0.22)",
    },
    rank: {
        width: 28,
    },
    candidate: {
        flex: 1,
        paddingRight: 12,
    },
    votesHeader: {
        textAlign: "right",
    },
    votes: {
        alignItems: "flex-end",
    },
    rankText: {
        fontSize: 13,
        fontWeight: "700",
        color: perk.mute,
    },
    name: {
        fontSize: 15,
        lineHeight: 19,
        fontWeight: "800",
        color: perk.ink,
    },
    nameNoVotes: {
        color: perk.mute,
    },
    noVotes: {
        fontWeight: "500",
        color: perk.mute,
    },
    party: {
        marginTop: 2,
        fontFamily: "SpaceMono-Regular",
        fontSize: 9,
        letterSpacing: 0.4,
        textTransform: "uppercase",
        color: perk.mute,
    },
    voteText: {
        fontSize: 20,
        lineHeight: 24,
        fontWeight: "900",
        color: perk.ink,
        fontVariant: ["tabular-nums"],
    },
    percentText: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 10,
        color: perk.mute,
    },
    percentWinner: {
        color: perk.greenDeep,
    },
});
