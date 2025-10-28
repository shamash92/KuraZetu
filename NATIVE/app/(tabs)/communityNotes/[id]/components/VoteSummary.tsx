import {StyleSheet, Text, View} from "react-native";

import React from "react";

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
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Vote Summary</Text>
            </View>

            <View style={styles.content}>
                {/* Main Statistics */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>
                            {totalValidVotes.toLocaleString()}
                        </Text>
                        <Text style={styles.statLabel}>Valid Votes</Text>
                    </View>

                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>
                            {rejectedVotes.toLocaleString()}
                        </Text>
                        <Text style={styles.statLabel}>Rejected Votes</Text>
                    </View>

                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>
                            {disputedVotes.toLocaleString()}
                        </Text>
                        <Text style={styles.statLabel}>Disputed Votes</Text>
                    </View>

                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>
                            {rejectedObjectedTo.toLocaleString()}
                        </Text>
                        <Text style={styles.statLabel}> Rejected objected to</Text>
                    </View>
                </View>

                {/* Detailed Breakdown */}
                <View style={styles.breakdown}>
                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Total Votes Cast:</Text>
                        <Text style={styles.breakdownValue}>
                            {totalVotesCast.toLocaleString()}
                        </Text>
                    </View>

                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Voter Turnout:</Text>
                        <Text style={styles.breakdownValue}>{turnoutPercentage}%</Text>
                    </View>

                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Rejection Rate:</Text>
                        <Text style={styles.breakdownValue}>
                            {totalVotesCast > 0
                                ? ((rejectedVotes / totalVotesCast) * 100).toFixed(2)
                                : "0.00"}
                            %
                        </Text>
                    </View>
                </View>

                {/* Total Summary */}
                <View style={styles.totalSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Overall Total Votes Cast:</Text>
                        <Text style={styles.totalValue}>
                            {totalVotesCast.toLocaleString()}
                        </Text>
                    </View>
                </View>
            </View>
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
        marginTop: 16,
        overflow: "hidden",
    },
    header: {
        backgroundColor: "#006600",
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#FFFFFF",
        textAlign: "center",
    },
    content: {
        padding: 20,
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 20,
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: "45%",
        backgroundColor: "#F8F9FA",
        borderRadius: 8,
        padding: 16,
        alignItems: "center",
        borderLeftWidth: 4,
        borderLeftColor: "#DC143C",
    },
    statValue: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#DC143C",
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: "#6C757D",
        textAlign: "center",
        fontWeight: "600",
    },
    breakdown: {
        borderTopWidth: 1,
        borderTopColor: "#E9ECEF",
        paddingTop: 16,
        marginBottom: 16,
    },
    breakdownRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
    },
    breakdownLabel: {
        fontSize: 15,
        color: "#495057",
        fontWeight: "500",
    },
    breakdownValue: {
        fontSize: 15,
        fontWeight: "600",
        color: "#212529",
    },
    totalSection: {
        borderTopWidth: 2,
        borderTopColor: "#DC143C",
        paddingTop: 16,
        backgroundColor: "#FFF8F8",
        marginHorizontal: -20,
        marginBottom: -20,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#212529",
    },
    totalValue: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#DC143C",
    },
});
