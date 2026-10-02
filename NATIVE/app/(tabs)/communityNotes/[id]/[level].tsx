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
import {IPollingStationResult, TLevelTabs} from "@/app/types";
import {RESULTS_FORMS} from "@/components/resultsForm";
import {ResultsTable} from "./_components/ResultsTable";
import {VoteSummary} from "./_components/VoteSummary";
import {ZoomableImage} from "./_components/ZoomableImage";
import {apiBaseURL} from "@/app/_utils/apiBaseURL";
import {perk} from "@/app/_utils/colors";
import {sampleElectionData} from "../_sampleData";
import useAuthStore from "@/app/_utils/authStore";
import {handleUnauthorized} from "@/app/_utils/handleUnauthorized";
import {Redirect, useLocalSearchParams} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useStationInfo} from "@/hooks/useStationInfo";

const windowHeight = Dimensions.get("window").height;

const LEVEL_LABELS: Record<TLevelTabs, string> = {
    president: "Presidential",
    governor: "Governor",
    senator: "Senator",
    womanRep: "Woman Rep",
    mp: "MP",
    mca: "MCA",
};

interface IPollingStationExtraData {
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

export default function LevelResultsScreen() {
    // Inside a tab screen this includes the tab bar, which floats over the content.
    const insets = useSafeAreaInsets();

    const [modalVisible, setModalVisible] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);

    const [upvoted, setUpvoted] = useState(false);
    const [results, setResults] = useState<IPollingStationResult[] | null>(null);
    const [extraData, setExtraData] = useState<IPollingStationExtraData | null>(null);

    const station = useStationInfo();

    const {userToken} = useAuthStore();

    const {id, level: levelParam} = useLocalSearchParams<{
        id: string;
        level: string;
    }>();
    const level = levelParam in LEVEL_LABELS ? (levelParam as TLevelTabs) : null;

    useEffect(() => {
        if (!level) {
            return;
        }

        if (!id) {
            return;
        }

        if (!userToken) {
            return;
        }

        const fetchStationResults = async () => {
            try {
                const response = await fetch(
                    `${apiBaseURL}/api/results/polling-station/${id}/results/${level}/`,
                    {
                        headers: {Authorization: `Bearer ${userToken}`},
                    },
                );
                if (await handleUnauthorized(response)) return;
                const data = await response.json();

                setResults(data["data"]);
                setExtraData(data["extra_data"]);
            } catch (error) {
                console.error("Error fetching polling station results:", error);
            }
        };

        fetchStationResults();
    }, [id, userToken, addModalVisible, level]);

    if (!level) {
        return <Redirect href={`/communityNotes/${id}`} />;
    }

    const levelLabel = LEVEL_LABELS[level];

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
                level={level}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.stationHeader}>
                    <Text style={styles.stationHeaderLabel}>
                        {levelLabel.toUpperCase()} · THIS STATION
                    </Text>
                    <Text style={styles.stationName}>
                        {station?.polling_center}
                    </Text>
                    <Text style={styles.stationMeta}>
                        Stream {station?.stream_number} · {station?.code} ·{" "}
                        {station?.constituency}
                    </Text>
                </View>

                {/* Original results form image */}
                {extraData && extraData.form_34A && (
                    <View style={{paddingHorizontal: 8}}>
                        <Text style={styles.formLabel}>
                            Original {RESULTS_FORMS[level].name}
                        </Text>
                        <View style={{height: 0.5 * windowHeight}}>
                            <ZoomableImage uri={extraData.form_34A} />
                        </View>
                    </View>
                )}

                {/* Digital Tabulation */}
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
                            <MessageCircle size={24} color={perk.card} />
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
