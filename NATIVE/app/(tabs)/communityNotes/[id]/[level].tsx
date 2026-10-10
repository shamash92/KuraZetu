import {
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {MessageCircle, ThumbsUp} from "lucide-react-native";
import React, {useEffect, useState} from "react";

import {AddFormModal} from "./_components/AddFormModal";
import {CounterEvidenceModal} from "./_components/CounterEvidenceModal";
import {EmptyResults} from "./_components/EmptyResults";
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
import {Redirect, Stack, useLocalSearchParams} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {toTitleCase} from "@/app/_utils/toTitleCase";
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
    // Null until the station answers, so a slow request is not read as "none".
    const [results, setResults] = useState<IPollingStationResult[] | null>(null);
    const [extraData, setExtraData] = useState<IPollingStationExtraData | null>(null);
    // A request that did not come back is not the same as a station with no tally.
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);

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
            setFailed(false);
            try {
                const response = await fetch(
                    `${apiBaseURL}/api/results/polling-station/${id}/results/${level}/`,
                    {
                        headers: {Authorization: `Bearer ${userToken}`},
                    },
                );
                if (await handleUnauthorized(response)) return;
                if (!response.ok) {
                    setFailed(true);
                    return;
                }
                const data = await response.json();

                setResults(data["data"] ?? []);
                setExtraData(data["extra_data"]);
            } catch (error) {
                console.error("Error fetching polling station results:", error);
                setFailed(true);
            }
        };

        fetchStationResults();
    }, [id, userToken, addModalVisible, level, attempt]);

    if (!level) {
        return <Redirect href={`/communityNotes/${id}`} />;
    }

    const levelLabel = LEVEL_LABELS[level];

    // Context only: which centre and stream these results belong to.
    const stationHeader = station ? (
        <View style={styles.stationHeader}>
            <Text style={styles.stationName} numberOfLines={2}>
                {toTitleCase(station.polling_center)}
            </Text>
            <Text style={styles.stationMeta} numberOfLines={1}>
                Stream {station.stream_number} ·{" "}
                {station.registered_voters.toLocaleString()} voters ·{" "}
                <Text style={styles.stationCode}>{station.code}</Text>
            </Text>
        </View>
    ) : null;

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

            {/* The navigation bar names the race. */}
            <Stack.Screen options={{headerTitle: `${levelLabel} results`}} />

            {failed && !results ? (
                <>
                    {stationHeader}
                    <View style={styles.failed}>
                        <Text style={styles.failedTitle} accessibilityRole="header">
                            Could not load {levelLabel} results
                        </Text>
                        <Text style={styles.failedBody}>
                            The request did not go through. Check your connection and
                            try again.
                        </Text>
                        <Pressable
                            style={({pressed}) => [
                                styles.retry,
                                pressed && styles.retryPressed,
                            ]}
                            onPress={() => setAttempt((count) => count + 1)}
                            accessibilityRole="button"
                        >
                            <Text style={styles.retryLabel}>Try again</Text>
                        </Pressable>
                    </View>
                </>
            ) : null}

            {results && results.length === 0 ? (
                <>
                    {stationHeader}
                    <EmptyResults
                        levelLabel={levelLabel}
                        formName={RESULTS_FORMS[level].name}
                        bottomOffset={insets.bottom + 16}
                        onAdd={() => setAddModalVisible(true)}
                    />
                </>
            ) : null}

            {results && results.length > 0 ? (
                <>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {stationHeader}

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
                    </View>
                </>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    stationHeader: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 18,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: perk.rule16,
    },
    stationName: {
        fontSize: 17,
        lineHeight: 22,
        fontWeight: "700",
        letterSpacing: -0.2,
        color: perk.ink,
    },
    stationMeta: {
        marginTop: 2,
        fontSize: 14,
        lineHeight: 19,
        color: perk.mute,
        fontVariant: ["tabular-nums"],
    },
    stationCode: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 12,
        letterSpacing: 0.2,
    },
    failed: {
        paddingHorizontal: 20,
        paddingTop: 36,
        alignItems: "flex-start",
    },
    failedTitle: {
        fontSize: 28,
        lineHeight: 32,
        fontWeight: "900",
        letterSpacing: -0.9,
        color: perk.ink,
    },
    failedBody: {
        marginTop: 8,
        maxWidth: 320,
        fontSize: 16,
        lineHeight: 23,
        color: perk.mute,
    },
    retry: {
        marginTop: 20,
        height: 48,
        borderRadius: 24,
        paddingHorizontal: 22,
        justifyContent: "center",
        backgroundColor: perk.ink,
    },
    retryPressed: {
        backgroundColor: perk.inkSoft,
        transform: [{scale: 0.97}],
    },
    retryLabel: {
        fontSize: 15,
        fontWeight: "700",
        color: perk.paper,
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
});
