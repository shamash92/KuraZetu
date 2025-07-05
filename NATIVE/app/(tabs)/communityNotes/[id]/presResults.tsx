import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {MessageCircle, ThumbsUp} from "lucide-react-native";
import React, {useEffect, useState} from "react";

import {CounterEvidenceModal} from "./components/CounterEvidenceModal";
import {IPollingStationPresResults} from "@/app/types";
import {PollingStationInfo} from "./components/PollingStationInfo";
import {ResultsTable} from "./components/ResultsTable";
import {VoteSummary} from "./components/VoteSummary";
import {ZoomableImage} from "./components/ZoomableImage";
import {apiBaseURL} from "@/app/(utils)/apiBaseURL";
import {getFromSecureStore} from "@/app/(utils)/secureStore";
import {sampleElectionData} from "../sampleData";
import {useLocalSearchParams} from "expo-router";

const windowHeight = Dimensions.get("window").height;

export default function ResultsScreen() {
    const [modalVisible, setModalVisible] = useState(false);
    const [upvoted, setUpvoted] = useState(false);
    const [userToken, setUserToken] = useState<string | null>(null);
    const [results, setResults] = useState<IPollingStationPresResults[] | null>(null);

    const {id} = useLocalSearchParams();
    console.log(id, "ID from params");

    useEffect(() => {
        const fetchUserToken = async () => {
            const token = await getFromSecureStore("userToken");
            setUserToken(token);
        };

        fetchUserToken();
    }, []);

    useEffect(() => {
        if (!id) {
            return;
        }

        if (!userToken) {
            return;
        }

        const fetchStation = async () => {
            try {
                const response = await fetch(
                    `${apiBaseURL}/api/results/polling-station/${id}/presidential/`,
                    {
                        headers: {
                            Authorization: `Token ${userToken}`,
                        },
                    },
                );
                const data = await response.json();
                console.log(data, "data in ResultsScreen");
                setResults(data["data"]);
            } catch (error) {
                console.error("Error fetching polling station pres results:", error);
            }
        };

        if (id && userToken) {
            fetchStation();
        }
    }, [id, userToken]);

    return (
        <View
            style={{
                flex: 1,
            }}
        >
            <CounterEvidenceModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                originalResults={sampleElectionData}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
                <View
                    style={{
                        padding: 10,
                        backgroundColor: "#FFFFFF",
                        borderBottomWidth: 1,
                        borderBottomColor: "#E9ECEF",
                        shadowColor: "#000000",
                        shadowOffset: {width: 0, height: 2},
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        elevation: 2,
                    }}
                >
                    <Text style={styles.title}>
                        {sampleElectionData.pollingStation}
                    </Text>
                    <Text style={styles.subtitle}>
                        {sampleElectionData.pollingStationCode}
                    </Text>

                    <PollingStationInfo
                        pollingStation={sampleElectionData.pollingStation}
                        pollingStationCode={sampleElectionData.pollingStationCode}
                        ward={sampleElectionData.ward}
                        wardCode={sampleElectionData.wardCode}
                        constituency={sampleElectionData.constituency}
                        constituencyCode={sampleElectionData.constituencyCode}
                        county={sampleElectionData.county}
                        countyCode={sampleElectionData.countyCode}
                        formNumber={sampleElectionData.formNumber}
                        declarationDate={sampleElectionData.declarationDate}
                    />
                </View>

                {/* Form 3XX Image */}
                <View
                    style={{
                        paddingHorizontal: 8,
                        // paddingVertical: 8,
                        // borderWidth: 2,
                        // borderColor: "green",
                    }}
                >
                    <Text
                        style={{
                            fontSize: 14,
                            fontWeight: "bold",
                            color: "#212529",
                            textAlign: "center",
                            // marginBottom: 12,
                            // paddingHorizontal: 4,
                        }}
                    >
                        Original Form 34A
                    </Text>
                    <View
                        style={{
                            // backgroundColor: "#FF4545",
                            // borderRadius: 12,
                            // shadowColor: "#000000",
                            // borderWidth: 4,
                            // borderColor: "red",
                            // shadowOpacity: 0.1,
                            // shadowRadius: 8,
                            // elevation: 4,
                            height: 0.5 * windowHeight,
                        }}
                    >
                        <ZoomableImage
                            uri={require("../../../../assets/images/sample.jpg")}
                        />
                    </View>
                </View>

                {/* Digital Tabulation TODO: Perhaps refactor this to a separate component ? */}
                <View
                    style={{
                        paddingHorizontal: 8,
                        paddingTop: 8,
                    }}
                >
                    {results && results.length > 0 ? (
                        <ResultsTable results={results} />
                    ) : (
                        <Text>No Results reported yet</Text>
                    )}
                    <VoteSummary
                        totalValidVotes={sampleElectionData.totalValidVotes}
                        rejectedVotes={sampleElectionData.rejectedVotes}
                        disputedVotes={sampleElectionData.disputedVotes}
                        totalVotesCast={sampleElectionData.totalVotesCast}
                        registeredVoters={sampleElectionData.registeredVoters}
                    />
                </View>
            </ScrollView>

            {/* Floating Action Buttons */}
            <View
                style={{
                    position: "absolute",
                    right: 20,
                    bottom: 30,
                    flexDirection: "column",
                    gap: 16,
                }}
            >
                <TouchableOpacity
                    style={[styles.fab, styles.upvoteFab, upvoted && styles.upvotedFab]}
                    onPress={() => setUpvoted(!upvoted)}
                    activeOpacity={0.8}
                >
                    <ThumbsUp size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.fab, styles.commentFab]}
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <MessageCircle size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F9FA",
        paddingTop: 30,
    },
    scrollView: {
        flex: 1,
    },
    header: {},
    title: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#212529",
        marginBottom: 4,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        color: "#6C757D",
        textAlign: "center",
        fontWeight: "500",
    },
    section: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#212529",
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    imageContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        shadowColor: "#000000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    bottomSpacing: {
        height: 100,
    },
    fabContainer: {},
    fab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000000",
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    upvoteFab: {
        backgroundColor: "#006600",
    },
    upvotedFab: {
        backgroundColor: "#006600",
    },
    commentFab: {
        backgroundColor: "#B71C1C",
    },
});
