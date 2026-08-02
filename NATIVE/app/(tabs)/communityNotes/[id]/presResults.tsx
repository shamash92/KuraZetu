import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {MessageCircle, Plus, ThumbsUp} from "lucide-react-native";
import React, {useEffect, useState} from "react";

import {AddFormModal} from "./_components/AddFormModal";
import {CounterEvidenceModal} from "./_components/CounterEvidenceModal";
import {IPollingStationPresResults} from "@/app/types";
import {ResultsTable} from "./_components/ResultsTable";
import {TLevelTabs} from "@/app/types";
import {VoteSummary} from "./_components/VoteSummary";
import {ZoomableImage} from "./_components/ZoomableImage";
import {apiBaseURL} from "@/app/_utils/apiBaseURL";
import {perk} from "@/app/_utils/colors";
import {sampleElectionData} from "../_sampleData";
import useAuthStore from "@/app/_utils/authStore";
import useCurrentPollingStationStore from "@/app/_utils/curentStationStore";
import {useLocalSearchParams} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";

const windowHeight = Dimensions.get("window").height;

const LEVEL_LABELS: Record<TLevelTabs, string> = {
    president: "Presidential",
    governor: "Governor",
    senator: "Senator",
    womanRep: "Woman Rep",
    mp: "MP",
    mca: "MCA",
};

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
    // Inside a tab screen this includes the tab bar, which floats over the content.
    const insets = useSafeAreaInsets();

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

    const {level: levelParam} = useLocalSearchParams<{level?: string}>();
    const level: TLevelTabs =
        levelParam && levelParam in LEVEL_LABELS
            ? (levelParam as TLevelTabs)
            : "president";
    const levelLabel = LEVEL_LABELS[level];

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
                    `${apiBaseURL}/api/results/polling-station/${currentStationCode}/results/${level}/`,
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
    }, [currentStationCode, userToken, addModalVisible, level]);

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: perk.card,
            }}
        >
            <AddFormModal
                visible={addModalVisible}
                onClose={() => setAddModalVisible(false)}
                level={level}
            />
            <CounterEvidenceModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                originalResults={sampleElectionData}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.stationHeader}>
                    <Text style={styles.stationHeaderLabel}>
                        {levelLabel.toUpperCase()} · THIS STATION
                    </Text>
                    <Text style={styles.stationName}>
                        {currentStationInfo?.polling_center}
                    </Text>
                    <Text style={styles.stationMeta}>
                        Stream {currentStationInfo?.stream_number} ·{" "}
                        {currentStationInfo?.code} · {currentCenter?.constituency}
                    </Text>
                </View>

                {/* Form 34A Image */}
                {extraData && extraData.form_34A && (
                    <View style={{paddingHorizontal: 8}}>
                        <Text style={styles.formLabel}>Original Form 34A</Text>
                        <View style={{height: 0.5 * windowHeight}}>
                            <ZoomableImage uri={extraData.form_34A} />
                        </View>
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
                            <ResultsTable
                                results={results}
                                title={`${levelLabel} Election Results`}
                            />
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
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>No results yet</Text>
                            <Text style={styles.emptyBody}>
                                No {levelLabel} tally has been submitted for this
                                station yet.
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
                    bottom: insets.bottom + 16,
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
                            <ThumbsUp size={22} color={perk.limeInk} />
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
                        activeOpacity={0.85}
                    >
                        <Plus size={26} color={perk.limeInk} strokeWidth={2.6} />
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
    stationHeader: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        backgroundColor: perk.card,
        borderBottomWidth: 1,
        borderBottomColor: perk.rule08,
    },
    stationHeaderLabel: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 9.5,
        fontWeight: "700",
        letterSpacing: 1.6,
        color: perk.mute,
    },
    stationName: {
        fontSize: 16,
        fontWeight: "900",
        letterSpacing: -0.2,
        textTransform: "uppercase",
        color: perk.ink,
        marginTop: 4,
    },
    stationMeta: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 9,
        color: perk.mute,
        letterSpacing: 0.6,
        marginTop: 3,
    },
    formLabel: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1.6,
        color: perk.mute,
        textAlign: "center",
        marginBottom: 6,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        paddingVertical: 48,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "900",
        letterSpacing: -0.3,
        color: perk.ink,
    },
    emptyBody: {
        fontSize: 13.5,
        color: perk.mute,
        textAlign: "center",
        lineHeight: 19,
        marginTop: 6,
        maxWidth: 260,
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
        width: 58,
        height: 58,
        borderRadius: 29,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: perk.ink,
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.22,
        shadowRadius: 14,
        elevation: 8,
    },
    upvoteFab: {
        backgroundColor: perk.lime,
    },
    upvotedFab: {
        backgroundColor: perk.limeDeep,
    },
    commentFab: {
        backgroundColor: perk.coralDeep,
    },
    addFab: {
        backgroundColor: perk.lime,
        shadowColor: perk.limeDeep,
        shadowOpacity: 0.5,
    },
});
