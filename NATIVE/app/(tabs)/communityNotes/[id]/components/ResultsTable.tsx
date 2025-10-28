import {StyleSheet, Text, View} from "react-native";

import {IPollingStationPresResults} from "@/app/types";
import React from "react";

export function ResultsTable({results}: {results: IPollingStationPresResults[]}) {
    // Sort candidates by votes in descending order
    const sortedCandidates = [...results].sort((a, b) => b.votes - a.votes);
    const totalVotes = results.reduce((sum, candidate) => sum + candidate.votes, 0);

    return (
        <View
            style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 12,
                shadowColor: "#000000",
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
                overflow: "hidden",
            }}
        >
            <View style={styles.tableHeader}>
                <Text
                    style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: "#FFFFFF",
                        textAlign: "center",
                    }}
                >
                    Presidential Election Results
                </Text>
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
                                {candidate.presidential_candidate.first_name}{" "}
                                {candidate.presidential_candidate.last_name}
                            </Text>
                        </View>
                        <View style={styles.partyColumn}>
                            <Text style={[styles.cellText, styles.partyText]}>
                                {candidate.presidential_candidate.party}
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

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        shadowColor: "#000000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: "hidden",
        marginVertical: 8,
    },
    tableHeader: {
        backgroundColor: "#DC143C",
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    tableTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#FFFFFF",
        textAlign: "center",
    },
    headerRow: {
        flexDirection: "row",
        backgroundColor: "#F8F9FA",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 2,
        borderBottomColor: "#E9ECEF",
    },
    dataRow: {
        flexDirection: "row",
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F3F4",
        minHeight: 60,
        alignItems: "center",
    },
    evenRow: {
        backgroundColor: "#FFFFFF",
    },
    oddRow: {
        backgroundColor: "#FAFBFC",
    },
    winnerRow: {
        backgroundColor: "#FFF8E1",
        borderLeftWidth: 4,
        borderLeftColor: "#FF9800",
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
        fontSize: 14,
        fontWeight: "bold",
        color: "#495057",
        textAlign: "center",
    },
    cellText: {
        fontSize: 14,
        color: "#212529",
    },
    rankText: {
        fontWeight: "600",
        color: "#6C757D",
    },
    candidateName: {
        fontWeight: "600",
        lineHeight: 20,
    },
    partyText: {
        color: "#6C757D",
        fontSize: 13,
        lineHeight: 18,
    },
    voteText: {
        fontWeight: "bold",
        fontSize: 15,
    },
    percentText: {
        fontWeight: "600",
        color: "#495057",
        fontSize: 13,
    },
    winnerText: {
        color: "#DC143C",
    },
});
