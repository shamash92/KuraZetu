import {StyleSheet, Text, View} from "react-native";

import {IPollingStationPresResults} from "@/app/types";
import React from "react";
import {perk} from "@/app/_utils/colors";

export function ResultsTable({
    results,
    title = "Election Results",
}: {
    results: IPollingStationPresResults[];
    title?: string;
}) {
    // Sort candidates by votes in descending order
    const sortedCandidates = [...results].sort((a, b) => b.votes - a.votes);
    const totalVotes = results.reduce((sum, candidate) => sum + candidate.votes, 0);

    return (
        <View style={styles.wrapper}>
            <View style={styles.tableHeader}>
                <Text style={styles.tableTitle}>{title}</Text>
            </View>

            <View style={styles.headerRow}>
                <View style={styles.rankColumn}>
                    <Text style={styles.headerText}>#</Text>
                </View>
                <View style={styles.candidateColumn}>
                    <Text style={styles.headerText}>Candidate</Text>
                </View>
                <View style={styles.partyColumn}>
                    <Text style={styles.headerText}>Party</Text>
                </View>
                <View style={styles.votesColumn}>
                    <Text style={styles.headerText}>Votes</Text>
                </View>
                <View style={styles.percentColumn}>
                    <Text style={styles.headerText}>%</Text>
                </View>
            </View>

            {sortedCandidates.map((candidate, index) => {
                const percentage =
                    totalVotes > 0
                        ? ((candidate.votes / totalVotes) * 100).toFixed(1)
                        : "0.0";
                const isWinner = index === 0 && candidate.votes > 0;

                return (
                    <View
                        key={index}
                        style={[
                            styles.dataRow,
                            index % 2 === 0 ? styles.evenRow : styles.oddRow,
                            isWinner && styles.winnerRow,
                        ]}
                    >
                        <View style={styles.rankColumn}>
                            <Text style={[styles.cellText, styles.rankText]}>
                                {index + 1}
                            </Text>
                        </View>
                        <View style={styles.candidateColumn}>
                            <Text
                                style={[
                                    styles.cellText,
                                    styles.candidateName,
                                    isWinner && styles.winnerText,
                                ]}
                            >
                                {candidate.candidate.first_name}{" "}
                                {candidate.candidate.last_name}
                            </Text>
                        </View>
                        <View style={styles.partyColumn}>
                            <Text style={[styles.cellText, styles.partyText]}>
                                {candidate.candidate.party}
                            </Text>
                        </View>
                        <View style={styles.votesColumn}>
                            <Text
                                style={[
                                    styles.cellText,
                                    styles.voteText,
                                    isWinner && styles.winnerText,
                                ]}
                            >
                                {candidate.votes.toLocaleString()}
                            </Text>
                        </View>
                        <View style={styles.percentColumn}>
                            <Text
                                style={[
                                    styles.cellText,
                                    styles.percentText,
                                    isWinner && styles.winnerText,
                                ]}
                            >
                                {percentage}%
                            </Text>
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
    tableHeader: {
        backgroundColor: perk.ink,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    tableTitle: {
        fontSize: 13.5,
        fontWeight: "800",
        letterSpacing: 0.2,
        color: perk.lime,
    },
    headerRow: {
        flexDirection: "row",
        backgroundColor: perk.surface,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: perk.rule08,
    },
    dataRow: {
        flexDirection: "row",
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: perk.rule08,
        minHeight: 56,
        alignItems: "center",
    },
    evenRow: {
        backgroundColor: perk.card,
    },
    oddRow: {
        backgroundColor: perk.paper,
    },
    winnerRow: {
        backgroundColor: "rgba(196,255,94,0.22)",
        borderLeftWidth: 4,
        borderLeftColor: perk.limeDeep,
    },
    rankColumn: {
        width: 40,
        alignItems: "center",
    },
    candidateColumn: {
        flex: 3,
        paddingRight: 12,
    },
    partyColumn: {
        flex: 2,
        paddingRight: 12,
    },
    votesColumn: {
        width: 70,
        alignItems: "center",
    },
    percentColumn: {
        width: 50,
        alignItems: "center",
    },
    headerText: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 9,
        fontWeight: "700",
        letterSpacing: 0.6,
        color: perk.mute,
        textAlign: "center",
    },
    cellText: {
        fontSize: 13,
        color: perk.ink,
    },
    rankText: {
        fontWeight: "800",
        color: perk.mute,
    },
    candidateName: {
        fontWeight: "800",
        lineHeight: 18,
    },
    partyText: {
        fontFamily: "SpaceMono-Regular",
        color: perk.mute,
        fontSize: 10,
        lineHeight: 15,
    },
    voteText: {
        fontFamily: "SpaceMono-Regular",
        fontWeight: "700",
        fontSize: 13,
    },
    percentText: {
        fontWeight: "800",
        color: perk.ink,
        fontSize: 12,
    },
    winnerText: {
        color: perk.copperDeep,
    },
});
