import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {MessageCircle, PlusCircleIcon, ThumbsUp} from "lucide-react-native";
import React, {useEffect, useState} from "react";

import {AddFormModal} from "./components/AddFormModal";
import {CounterEvidenceModal} from "./components/CounterEvidenceModal";
import {IPollingStationPresResults} from "@/app/types";
import {ResultsTable} from "./components/ResultsTable";
import {VoteSummary} from "./components/VoteSummary";
import {ZoomableImage} from "./components/ZoomableImage";
import {apiBaseURL} from "@/app/(utils)/apiBaseURL";
import {sampleElectionData} from "../sampleData";
import useAuthStore from "@/app/(utils)/authStore";
import useCurrentPollingStationStore from "@/app/(utils)/curentStationStore";

const windowHeight = Dimensions.get("window").height;

export interface IPollingStationExtraData {
    added_by: number;
    disputed_votes: number;
    is_verified: boolean;
    polling_station: number;
    rejected_objected_to_votes: number;
    rejected_votes: number;
    valid_votes_cast: number;
    form_34A: string | null; // Optional, as it may not always be present
    registered_voters: number; // Optional, as it may not always be present
}

export default function ResultsScreen() {
    const [modalVisible, setModalVisible] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);

    const [upvoted, setUpvoted] = useState(false);
    const [results, setResults] = useState<IPollingStationPresResults[] | null>(null);
    const [extraData, setExtraData] = useState<IPollingStationExtraData | null>(null);

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

    const {userToken} = useAuthStore();

    useEffect(() => {
        if (!currentStationCode) {
            return;
        }

        if (!userToken) {
            return;
        }

        const fetchStationResults = async () => {
            try {
                const response = await fetch(
                    `${apiBaseURL}/api/results/polling-station/${currentStationCode}/presidential/`,
                    {
                        headers: {
                            Authorization: `Token ${userToken}`,
                        },
                    },
                );
                const data = await response.json();
                // console.log(data, "data in ResultsScreen");
                console.log(data["extra_data"], "extra data in ResultsScreen");

                setResults(data["data"]);
                setExtraData(data["extra_data"]);
            } catch (error) {
                console.error("Error fetching polling station pres results:", error);
            }
        };

        if (currentStationCode && userToken) {
            fetchStationResults();
        }
    }, [currentStationCode, userToken, addModalVisible]);

    return (
        <View
            style={{
                flex: 1,
            }}
        >
            <AddFormModal
                visible={addModalVisible}
                onClose={() => setAddModalVisible(false)}
                level="president"
            />
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
                    <Text
                        style={{
                            fontSize: 20,
                            fontWeight: "bold",
                            color: "#212529",
                            textAlign: "center",
                        }}
                    >
                        {currentStationInfo?.polling_center}
                    </Text>
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-evenly",
                            paddingTop: 8,
                        }}
                    >
                        <Text style={styles.subtitle}>
                            Stream No: {currentStationInfo?.stream_number}
                        </Text>
                        <Text style={styles.subtitle}>
                            Code: {currentStationInfo?.code}
                        </Text>
                    </View>

                    <Text
                        style={{
                            fontSize: 14,
                            color: "#495057",
                            textAlign: "center",
                            paddingTop: 2,
                        }}
                    >
                        {currentCenter?.county} / {currentCenter?.constituency} /{" "}
                        {currentCenter?.ward}
                    </Text>
                </View>

                {/* Form 34A Image */}
                {extraData && extraData.form_34A ? (
                    <View
                        style={{
                            paddingHorizontal: 8,
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
                                height: 0.5 * windowHeight,
                            }}
                        >
                            <ZoomableImage uri={extraData.form_34A} />
                        </View>
                    </View>
                ) : (
                    <View
                        style={{
                            padding: 16,
                            alignItems: "center",
                            justifyContent: "center",
                            height: 0.2 * windowHeight,
                        }}
                    >
                        <Text style={{textAlign: "center"}}>
                            No Form 34A image available for this polling station.
                        </Text>
                    </View>
                )}

                {/* Polling Station Info */}

                {/* Digital Tabulation TODO: Perhaps refactor this to a separate component ? */}
                <View
                    style={{
                        paddingHorizontal: 8,
                        paddingTop: 8,
                    }}
                >
                    {results && results.length > 0 ? (
                        <>
                            <ResultsTable results={results} />
                            {extraData && (
                                <VoteSummary
                                    totalValidVotes={extraData.valid_votes_cast}
                                    rejectedVotes={extraData.rejected_votes}
                                    disputedVotes={extraData.disputed_votes}
                                    rejectedObjectedTo={
                                        extraData.rejected_objected_to_votes
                                    }
                                    registeredVoters={extraData.registered_voters}
                                />
                            )}
                        </>
                    ) : (
                        <View
                            style={{
                                padding: 16,
                                alignItems: "center",
                                justifyContent: "center",
                                height: 0.2 * windowHeight,
                            }}
                        >
                            <Text style={{textAlign: "center"}}>
                                No results available for this polling station.
                            </Text>
                        </View>
                    )}
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
                {results && results.length > 0 ? (
                    <>
                        <TouchableOpacity
                            style={[
                                styles.fab,
                                styles.upvoteFab,
                                upvoted && styles.upvotedFab,
                            ]}
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
                    </>
                ) : (
                    <TouchableOpacity
                        style={[styles.fab, styles.addFab]}
                        onPress={() => setAddModalVisible(true)}
                        activeOpacity={0.8}
                    >
                        <PlusCircleIcon size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                )}
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
    title: {},
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
    addFab: {
        backgroundColor: "#1976D2",
    },
});
