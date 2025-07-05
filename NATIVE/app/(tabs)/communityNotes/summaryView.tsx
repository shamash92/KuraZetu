import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import React, {useState} from "react";

import {Ionicons} from "@expo/vector-icons";

const {width} = Dimensions.get("window");

const ElectionResultsApp = () => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedStation, setSelectedStation] = useState(null);
    const [currentView, setCurrentView] = useState("stations"); // Start with stations view

    const pollingCenters = [
        {
            id: "community-center",
            name: "Community Center Complex",
            location: "Central Johannesburg",
            totalStations: 8,
            totalVoters: 15240,
            stations: [
                {
                    id: "CC-001A",
                    name: "Station 001A",
                    voters: 1892,
                    turnout: "76.4%",
                    status: "Complete",
                },
                {
                    id: "CC-002A",
                    name: "Station 002A",
                    voters: 2047,
                    turnout: "82.1%",
                    status: "Complete",
                },
                {
                    id: "CC-003A",
                    name: "Station 003A",
                    voters: 1756,
                    turnout: "71.8%",
                    status: "Complete",
                },
                {
                    id: "CC-004A",
                    name: "Station 004A",
                    voters: 2134,
                    turnout: "85.2%",
                    status: "Complete",
                },
                {
                    id: "CC-005A",
                    name: "Station 005A",
                    voters: 1988,
                    turnout: "78.9%",
                    status: "In Progress",
                },
                {
                    id: "CC-006A",
                    name: "Station 006A",
                    voters: 1876,
                    turnout: "74.3%",
                    status: "Complete",
                },
                {
                    id: "CC-007A",
                    name: "Station 007A",
                    voters: 1798,
                    turnout: "79.6%",
                    status: "Complete",
                },
                {
                    id: "CC-008A",
                    name: "Station 008A",
                    voters: 1749,
                    turnout: "77.2%",
                    status: "Complete",
                },
            ],
        },
        {
            id: "school-complex",
            name: "Primary School Complex",
            location: "Northern Johannesburg",
            totalStations: 6,
            totalVoters: 12680,
            stations: [
                {
                    id: "SC-201A",
                    name: "Station 201A",
                    voters: 2156,
                    turnout: "81.3%",
                    status: "Complete",
                },
                {
                    id: "SC-202A",
                    name: "Station 202A",
                    voters: 1987,
                    turnout: "76.8%",
                    status: "Complete",
                },
                {
                    id: "SC-203A",
                    name: "Station 203A",
                    voters: 2243,
                    turnout: "84.7%",
                    status: "Complete",
                },
                {
                    id: "SC-204A",
                    name: "Station 204A",
                    voters: 2098,
                    turnout: "79.4%",
                    status: "In Progress",
                },
                {
                    id: "SC-205A",
                    name: "Station 205A",
                    voters: 2034,
                    turnout: "77.9%",
                    status: "Complete",
                },
                {
                    id: "SC-206A",
                    name: "Station 206A",
                    voters: 2162,
                    turnout: "83.1%",
                    status: "Complete",
                },
            ],
        },
        {
            id: "church-hall",
            name: "Church Hall Complex",
            location: "Southern Johannesburg",
            totalStations: 4,
            totalVoters: 8950,
            stations: [
                {
                    id: "CH-301A",
                    name: "Station 301A",
                    voters: 2287,
                    turnout: "85.6%",
                    status: "Complete",
                },
                {
                    id: "CH-302A",
                    name: "Station 302A",
                    voters: 2156,
                    turnout: "78.4%",
                    status: "Complete",
                },
                {
                    id: "CH-303A",
                    name: "Station 303A",
                    voters: 2234,
                    turnout: "82.9%",
                    status: "Complete",
                },
                {
                    id: "CH-304A",
                    name: "Station 304A",
                    voters: 2273,
                    turnout: "80.7%",
                    status: "Complete",
                },
            ],
        },
    ];

    const getPollingStationInfo = (stationId) => {
        for (const center of pollingCenters) {
            const station = center.stations.find((s) => s.id === stationId);
            if (station) {
                return {
                    name: station.name,
                    location: center.name + ", " + center.location,
                    totalVoters: station.voters.toString(),
                    turnout: station.turnout,
                    center: center.name,
                };
            }
        }
        return null;
    };

    const electionCategories = [
        {
            id: "presidential",
            title: "Presidential",
            icon: "flag",
            color: "#E3F2FD",
            iconColor: "#1976D2",
            leadingCandidate: "John Smith",
            percentage: "45.2%",
            votes: "1,287",
            status: "Leading",
            statusColor: "#4CAF50",
        },
        {
            id: "governor",
            title: "Governor",
            icon: "business",
            color: "#E8F5E8",
            iconColor: "#388E3C",
            leadingCandidate: "Sarah Johnson",
            percentage: "52.1%",
            votes: "1,483",
            status: "Leading",
            statusColor: "#4CAF50",
        },
        {
            id: "senator",
            title: "Senator",
            icon: "medal",
            color: "#F3E5F5",
            iconColor: "#7B1FA2",
            leadingCandidate: "Mike Davis",
            percentage: "38.7%",
            votes: "1,102",
            status: "Close Race",
            statusColor: "#FF9800",
        },
        {
            id: "mayor",
            title: "Mayor",
            icon: "people",
            color: "#FFF3E0",
            iconColor: "#F57C00",
            leadingCandidate: "Lisa Chen",
            percentage: "61.4%",
            votes: "1,748",
            status: "Leading",
            statusColor: "#4CAF50",
        },
        {
            id: "council",
            title: "City Council",
            icon: "home",
            color: "#FCE4EC",
            iconColor: "#C2185B",
            leadingCandidate: "Various",
            percentage: "—",
            votes: "2,847",
            status: "Multiple Seats",
            statusColor: "#2196F3",
        },
    ];

    const getDetailedResults = (categoryId) => {
        const mockResults = {
            presidential: [
                {
                    name: "John Smith",
                    party: "Democratic Party",
                    votes: 1287,
                    percentage: 45.2,
                },
                {
                    name: "Robert Wilson",
                    party: "Republican Party",
                    votes: 1156,
                    percentage: 40.6,
                },
                {
                    name: "Maria Garcia",
                    party: "Independent",
                    votes: 404,
                    percentage: 14.2,
                },
            ],
            governor: [
                {
                    name: "Sarah Johnson",
                    party: "Democratic Party",
                    votes: 1483,
                    percentage: 52.1,
                },
                {
                    name: "Tom Anderson",
                    party: "Republican Party",
                    votes: 1098,
                    percentage: 38.6,
                },
                {name: "Alex Brown", party: "Green Party", votes: 266, percentage: 9.3},
            ],
            senator: [
                {
                    name: "Mike Davis",
                    party: "Republican Party",
                    votes: 1102,
                    percentage: 38.7,
                },
                {
                    name: "Jennifer Lee",
                    party: "Democratic Party",
                    votes: 1045,
                    percentage: 36.7,
                },
                {
                    name: "Carlos Martinez",
                    party: "Independent",
                    votes: 700,
                    percentage: 24.6,
                },
            ],
            mayor: [
                {
                    name: "Lisa Chen",
                    party: "Nonpartisan",
                    votes: 1748,
                    percentage: 61.4,
                },
                {name: "David Kim", party: "Nonpartisan", votes: 786, percentage: 27.6},
                {name: "Amy White", party: "Nonpartisan", votes: 313, percentage: 11.0},
            ],
        };
        return mockResults[categoryId] || [];
    };

    const CategoryCard = ({category}) => (
        <TouchableOpacity
            style={[styles.categoryCard, {backgroundColor: category.color}]}
            onPress={() => {
                setSelectedCategory(category);
                setCurrentView("detail");
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
                        <Text style={styles.cardTitle}>{category.title}</Text>
                        <Text style={styles.cardSubtitle}>
                            {category.leadingCandidate}
                        </Text>
                    </View>
                </View>
                <View style={styles.cardRight}>
                    <View style={styles.percentageContainer}>
                        <Text style={styles.percentage}>{category.percentage}</Text>
                        <Text style={styles.votes}>{category.votes} votes</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
            </View>
            <View style={styles.statusContainer}>
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
            </View>
        </TouchableOpacity>
    );

    const DetailedView = ({category}) => {
        const results = getDetailedResults(category.id);
        const totalVotes = results.reduce((sum, candidate) => sum + candidate.votes, 0);

        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />

                {/* Header */}
                <View style={styles.detailHeader}>
                    <TouchableOpacity
                        onPress={() => setCurrentView("summary")}
                        style={styles.backButton}
                    >
                        <Ionicons name="chevron-back" size={24} color="#2196F3" />
                        <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{category.title}</Text>
                    <View style={{width: 60}} />
                </View>

                <ScrollView
                    style={styles.detailContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Summary Card */}
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryHeader}>
                            <View
                                style={[
                                    styles.summaryIcon,
                                    {backgroundColor: category.color},
                                ]}
                            >
                                <Ionicons
                                    name={category.icon}
                                    size={32}
                                    color={category.iconColor}
                                />
                            </View>
                            <View style={styles.summaryStats}>
                                <Text style={styles.totalVotes}>
                                    {totalVotes.toLocaleString()}
                                </Text>
                                <Text style={styles.totalVotesLabel}>Total Votes</Text>
                            </View>
                        </View>
                    </View>

                    {/* Candidates */}
                    <View style={styles.candidatesContainer}>
                        {results.map((candidate, index) => (
                            <View key={index} style={styles.candidateCard}>
                                <View style={styles.candidateHeader}>
                                    <View style={styles.candidateInfo}>
                                        <Text style={styles.candidateName}>
                                            {candidate.name}
                                        </Text>
                                        <Text style={styles.candidateParty}>
                                            {candidate.party}
                                        </Text>
                                    </View>
                                    <View style={styles.candidateStats}>
                                        <Text style={styles.candidatePercentage}>
                                            {candidate.percentage}%
                                        </Text>
                                        <Text style={styles.candidateVotes}>
                                            {candidate.votes.toLocaleString()} votes
                                        </Text>
                                    </View>
                                </View>

                                {/* Progress bar */}
                                <View style={styles.progressContainer}>
                                    <View style={styles.progressBar}>
                                        <View
                                            style={[
                                                styles.progressFill,
                                                {
                                                    width: `${candidate.percentage}%`,
                                                    backgroundColor:
                                                        index === 0
                                                            ? "#2196F3"
                                                            : index === 1
                                                            ? "#757575"
                                                            : "#BDBDBD",
                                                },
                                            ]}
                                        />
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    };

    const PollingStationsView = () => (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.userGreeting}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={24} color="#fff" />
                    </View>
                    <Text style={styles.greetingText}>
                        Good Afternoon, Election Officer!
                    </Text>
                    <Ionicons name="notifications-outline" size={24} color="#333" />
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>Polling Centers</Text>

                {pollingCenters.map((center) => (
                    <View key={center.id} style={styles.centerCard}>
                        <View style={styles.centerHeader}>
                            <View style={styles.centerIconContainer}>
                                <Ionicons name="business" size={24} color="#2196F3" />
                            </View>
                            <View style={styles.centerInfo}>
                                <Text style={styles.centerName}>{center.name}</Text>
                                <Text style={styles.centerLocation}>
                                    {center.location}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.centerStats}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>
                                    {center.totalStations}
                                </Text>
                                <Text style={styles.statLabel}>Stations</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>
                                    {center.totalVoters.toLocaleString()}
                                </Text>
                                <Text style={styles.statLabel}>Total Voters</Text>
                            </View>
                        </View>

                        <View style={styles.stationsContainer}>
                            <Text style={styles.stationsTitle}>Polling Stations</Text>
                            {center.stations.map((station) => (
                                <TouchableOpacity
                                    key={station.id}
                                    style={styles.stationCard}
                                    onPress={() => {
                                        setSelectedStation(station.id);
                                        setCurrentView("summary");
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.stationCardContent}>
                                        <View style={styles.stationLeft}>
                                            <Text style={styles.stationName}>
                                                {station.name}
                                            </Text>
                                            <Text style={styles.stationVoters}>
                                                {station.voters.toLocaleString()} voters
                                            </Text>
                                        </View>
                                        <View style={styles.stationRight}>
                                            <Text style={styles.stationTurnout}>
                                                {station.turnout}
                                            </Text>
                                            <View
                                                style={[
                                                    styles.statusIndicator,
                                                    {
                                                        backgroundColor:
                                                            station.status ===
                                                            "Complete"
                                                                ? "#4CAF50"
                                                                : "#FF9800",
                                                    },
                                                ]}
                                            >
                                                <Text style={styles.statusText}>
                                                    {station.status}
                                                </Text>
                                            </View>
                                        </View>
                                        <Ionicons
                                            name="chevron-forward"
                                            size={20}
                                            color="#666"
                                        />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );

    const SummaryView = () => {
        const stationInfo = getPollingStationInfo(selectedStation);

        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => setCurrentView("stations")}
                        style={styles.backButton}
                    >
                        <Ionicons name="chevron-back" size={24} color="#2196F3" />
                        <Text style={styles.backText}>Centers</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Election Results</Text>
                    <Ionicons name="notifications-outline" size={24} color="#333" />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Polling Station Info */}
                    <View style={styles.stationInfo}>
                        <View style={styles.stationHeader}>
                            <Ionicons name="location" size={20} color="#666" />
                            <Text style={styles.stationName}>{stationInfo?.name}</Text>
                        </View>
                        <Text style={styles.stationLocation}>
                            {stationInfo?.location}
                        </Text>
                        <View style={styles.stationStats}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>
                                    {stationInfo?.totalVoters}
                                </Text>
                                <Text style={styles.statLabel}>Total Voters</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>
                                    {stationInfo?.turnout}
                                </Text>
                                <Text style={styles.statLabel}>Turnout</Text>
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

    if (currentView === "stations") {
        return <PollingStationsView />;
    } else if (currentView === "summary") {
        return <SummaryView />;
    } else {
        return <DetailedView category={selectedCategory} />;
    }
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
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    stationInfo: {
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
    stationHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    stationName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginLeft: 8,
    },
    stationLocation: {
        fontSize: 14,
        color: "#666",
        marginBottom: 16,
    },
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

export default ElectionResultsApp;
