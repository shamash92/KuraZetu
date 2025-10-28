import React, {useEffect} from "react";
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {router, useLocalSearchParams} from "expo-router";

import {Ionicons} from "@expo/vector-icons";
import {apiBaseURL} from "@/app/(utils)/apiBaseURL";
import useAuthStore from "@/app/(utils)/authStore";
import useCurrentPollingStationStore from "@/app/(utils)/curentStationStore";

const PollingStationResultsSummaryList = () => {
    const {id} = useLocalSearchParams();
    console.log(id, "params << PollingStationResultsSummaryList");

    const {
        setStations,
        stations,
        currentStationCode,
        setCurrentCenter,
        setCurrentStationCode,
        currentCenter,
        setCurrentStationInfo,
        currentStationInfo,
    } = useCurrentPollingStationStore();

    console.log(currentStationCode === id, "should be True for matching station code");

    const {userToken} = useAuthStore();

    useEffect(() => {
        if (!id) {
            return;
        }

        if (!userToken) {
            return;
        }

        if (currentStationCode !== id) {
            setCurrentStationCode(id.toString());
        }

        const fetchStation = async () => {
            try {
                const response = await fetch(
                    `${apiBaseURL}/api/stations/community-notes/polling-stations/${id}/info/`,
                    {
                        headers: {
                            Authorization: `Token ${userToken}`,
                        },
                    },
                );
                const data = await response.json();
                console.log(data, "data in PollingStationResultsSummaryList");
                setCurrentStationInfo(data);
            } catch (error) {
                console.error("Error fetching polling station info:", error);
            }
        };

        if (id && userToken) {
            fetchStation();
        }
    }, [id, userToken]);

    const electionCategories = [
        {
            id: "presidential",
            title: "President",
            icon: "flag",
            color: "#E3F2FD",
            iconColor: "#1976D2",
            leadingCandidate: "Pres 1",
            percentage: "52.3%",
            votes: "2,345",
            status: "Leading",
            statusColor: "#4CAF50",
        },
        {
            id: "governor",
            title: "Governor",
            icon: "business",
            color: "#E8F5E8",
            iconColor: "#388E3C",
            leadingCandidate: "Gov 1",
            percentage: "48.7%",
            votes: "1,876",
            status: "Leading",
            statusColor: "#4CAF50",
        },
        {
            id: "senator",
            title: "Senator",
            icon: "medal",
            color: "#F3E5F5",
            iconColor: "#7B1FA2",
            leadingCandidate: "Sen 1",
            percentage: "55.1%",
            votes: "1,234",
            status: "Leading",
            statusColor: "#4CAF50",
        },
        {
            id: "mp",
            title: "MP",
            icon: "people",
            color: "#FFF3E0",
            iconColor: "#F57C00",
            leadingCandidate: "MP 3",
            percentage: "60.4%",
            votes: "2,012",
            status: "Leading",
            statusColor: "#4CAF50",
        },
        {
            id: "woman-rep",
            title: "Woman Representative",
            icon: "female",
            color: "#FCE4EC",
            iconColor: "#C2185B",
            leadingCandidate: "WR 1",
            percentage: "58.9%",
            votes: "1,543",
            status: "Leading",
            statusColor: "#4CAF50",
        },
        {
            id: "mca",
            title: "MCA",
            icon: "home",
            color: "#E0F7FA",
            iconColor: "#0097A7",
            leadingCandidate: "MCA 1",
            percentage: "62.7%",
            votes: "1,098",
            status: "Leading",
            statusColor: "#4CAF50",
        },
    ];

    const CategoryCard = ({category}) => (
        <TouchableOpacity
            style={[styles.categoryCard, {backgroundColor: category.color}]}
            onPress={() => {
                router.navigate(`/communityNotes/${currentStationCode}/presResults`);
            }}
            activeOpacity={0.8}
        >
            <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                    <View
                        style={[
                            styles.iconContainer,
                            {backgroundColor: "rgba(255,255,255,0.7)"},
                        ]}
                    >
                        <Ionicons
                            name={category.icon}
                            size={24}
                            color={category.iconColor}
                        />
                    </View>
                    <View style={styles.cardInfo}>
                        <Text style={styles.cardTitle}>{category.title} results</Text>
                        {/* <Text style={styles.cardSubtitle}>
                            {category.leadingCandidate}
                        </Text> */}
                    </View>
                </View>
                <View style={styles.cardRight}>
                    {/* <View style={styles.percentageContainer}>
                        <Text style={styles.percentage}>{category.percentage}</Text>
                        <Text style={styles.votes}>{category.votes} votes</Text>
                    </View> */}
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
            </View>
            {/* <View style={styles.statusContainer}>
                <View
                    style={[
                        styles.statusBadge,
                        {backgroundColor: category.statusColor + "20"},
                    ]}
                >
                    <Text style={[styles.statusText, {color: category.statusColor}]}>
                        {category.status}
                    </Text>
                </View>
            </View> */}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor: "#F5F5F5",
                paddingTop: 16,
            }}
        >
            <ScrollView
                style={{
                    flex: 1,
                    paddingHorizontal: 20,
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Polling Station Info */}
                <View
                    style={{
                        backgroundColor: "#fff",
                        borderRadius: 16,
                        padding: 20,
                        marginBottom: 16,
                        elevation: 2,
                        shadowColor: "#000",
                        shadowOffset: {width: 0, height: 2},
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                    }}
                >
                    <View style={styles.stationHeader}>
                        <Ionicons name="location" size={20} color="#666" />
                        <Text
                            style={{
                                fontSize: 20,
                                fontWeight: "bold",
                                color: "black",
                                marginLeft: 8,
                            }}
                        >
                            {currentStationInfo?.polling_center}
                        </Text>
                    </View>
                    <Text
                        style={{
                            fontSize: 16,
                            color: "#666",
                            marginBottom: 16,
                            marginTop: 4,
                        }}
                    >
                        Station Code: {currentStationInfo?.code}
                    </Text>
                    <View style={styles.stationStats}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {currentStationInfo?.registered_voters}
                            </Text>
                            <Text style={styles.statLabel}>Total Voters</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {currentStationInfo?.stream_number}
                            </Text>
                            <Text style={styles.statLabel}>Stream Number</Text>
                        </View>
                    </View>
                </View>

                {/* Election Categories */}
                <Text style={styles.sectionTitle}>Election Results</Text>
                {electionCategories.map((category) => (
                    <CategoryCard key={category.id} category={category} />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F5F5",
        paddingTop: StatusBar.currentHeight || 0,
    },
    header: {
        backgroundColor: "#fff",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    userGreeting: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#2196F3",
        alignItems: "center",
        justifyContent: "center",
    },
    greetingText: {
        flex: 1,
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginLeft: 12,
    },
    content: {},
    stationInfo: {},
    stationHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    stationName: {},
    stationLocation: {},
    stationStats: {
        flexDirection: "row",
        justifyContent: "space-around",
    },
    statItem: {
        alignItems: "center",
    },
    statValue: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#2196F3",
    },
    statLabel: {
        fontSize: 12,
        color: "#666",
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 16,
    },
    categoryCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    cardLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
    },
    cardSubtitle: {
        fontSize: 14,
        color: "#666",
        marginTop: 2,
    },
    cardRight: {
        flexDirection: "row",
        alignItems: "center",
    },
    percentageContainer: {
        alignItems: "flex-end",
        marginRight: 8,
    },
    percentage: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
    },
    votes: {
        fontSize: 12,
        color: "#666",
    },
    statusContainer: {
        alignItems: "flex-start",
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
    },
    detailHeader: {
        backgroundColor: "#fff",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
    },
    backText: {
        fontSize: 16,
        color: "#2196F3",
        marginLeft: 4,
    },
    detailTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
    },
    centerCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    centerHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    centerIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: "#E3F2FD",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    centerInfo: {
        flex: 1,
    },
    centerName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
    },
    centerLocation: {
        fontSize: 14,
        color: "#666",
        marginTop: 2,
    },
    centerStats: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#F0F0F0",
    },
    stationsContainer: {
        marginTop: 4,
    },
    stationsTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 12,
    },
    stationCard: {
        backgroundColor: "#F8F9FA",
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    stationCardContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    stationLeft: {
        flex: 1,
    },
    stationName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    stationVoters: {
        fontSize: 12,
        color: "#666",
        marginTop: 2,
    },
    stationRight: {
        alignItems: "flex-end",
        marginRight: 12,
    },
    stationTurnout: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    statusIndicator: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: "600",
        color: "#fff",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
    },
    detailContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    summaryCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        marginVertical: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    summaryHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    summaryIcon: {
        width: 60,
        height: 60,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    summaryStats: {
        alignItems: "flex-end",
    },
    totalVotes: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#333",
    },
    totalVotesLabel: {
        fontSize: 14,
        color: "#666",
        marginTop: 4,
    },
    candidatesContainer: {
        marginBottom: 20,
    },
    candidateCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    candidateHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    candidateInfo: {
        flex: 1,
    },
    candidateName: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
    },
    candidateParty: {
        fontSize: 14,
        color: "#666",
        marginTop: 2,
    },
    candidateStats: {
        alignItems: "flex-end",
    },
    candidatePercentage: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
    },
    candidateVotes: {
        fontSize: 12,
        color: "#666",
        marginTop: 2,
    },
    progressContainer: {
        marginTop: 8,
    },
    progressBar: {
        height: 8,
        backgroundColor: "#E0E0E0",
        borderRadius: 4,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 4,
    },
});

export default PollingStationResultsSummaryList;
