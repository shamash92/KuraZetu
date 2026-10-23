import {Alert} from "react-native";
import {useEffect, useRef, useState} from "react";

import {ResultsFormCandidate, ResultsFormCapture} from "@/components/resultsForm";
import {
    newUploadKey,
    uploadResultsForm,
} from "@/components/resultsForm/upload/uploadResultsForm";
import {TLevelTabs} from "@/app/types";
import {apiBaseURL} from "@/app/_utils/apiBaseURL";
import useAuthStore from "@/app/_utils/auth/authStore";
import {handleUnauthorized} from "@/app/_utils/auth/handleUnauthorized";
import {router, useLocalSearchParams} from "expo-router";

export interface IAspirant {
    constituency: null | string;
    county: null | string;
    first_name: string;
    id: number;
    is_verified: boolean;
    last_name: string;
    level: string;
    party: string;
    party_color: string;
    passport_photo: null | string;
    surname: null | string;
    verified_by_party: boolean;
    ward: null | string;
}

interface AddFormModalProps {
    visible: boolean;
    onClose: () => void;
    level: TLevelTabs;
}

export function AddFormModal({visible, onClose, level}: AddFormModalProps) {
    const [candidates, setCandidates] = useState<IAspirant[]>([]);

    const {userToken} = useAuthStore();
    const {id} = useLocalSearchParams();

    useEffect(() => {
        if (!userToken) return;

        const fetchCandidates = async () => {
            try {
                const response = await fetch(
                    `${apiBaseURL}/api/results/polling-station/aspirants/${id}/${level}/`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${userToken}`,
                        },
                        method: "GET",
                    },
                );
                if (await handleUnauthorized(response)) return;
                const data = await response.json();
                if (data && data.data) {
                    setCandidates(data.data);
                }
            } catch (error) {
                console.error("Error fetching candidates:", error);
            }
        };
        fetchCandidates();
    }, [visible, id, level, userToken]);

    const formCandidates: ResultsFormCandidate[] = candidates.map((candidate) => ({
        key: String(candidate.id),
        name: `${candidate.first_name} ${candidate.last_name}`,
        party: candidate.party,
    }));

    // One key per photo: tapping Submit again after a lost connection sends
    // the same key, and the server stores the upload once.
    const uploadKey = useRef<{image: string; key: string} | null>(null);

    const handleSubmit = ({
        image,
        qualityChecked,
        votes,
        rejectedVotes,
        disputedVotes,
    }: {
        image: string;
        qualityChecked: boolean;
        votes: Record<string, number>;
        rejectedVotes: number;
        disputedVotes: number;
    }) => {
        // Submit is enabled only once every box has a typed number.
        const tally = Object.fromEntries(
            candidates.map((candidate) => [
                String(candidate.id),
                votes[String(candidate.id)],
            ]),
        );
        if (uploadKey.current?.image !== image) {
            uploadKey.current = {image, key: newUploadKey()};
        }
        const key = uploadKey.current.key;

        Alert.alert(
            "Submit Results",
            "Are you sure you want to submit these results?",
            [
                {text: "Cancel", style: "cancel"},
                {
                    text: "Submit",
                    onPress: async () => {
                        if (!userToken) return;

                        const outcome = await uploadResultsForm({
                            token: userToken,
                            stationCode: String(id),
                            race: level,
                            image,
                            qualityChecked,
                            votes: tally,
                            rejectedVotes,
                            disputedVotes,
                            key,
                        });
                        if (outcome.kind === "stored") {
                            Alert.alert("Uploaded", "Your results form was uploaded.");
                            onClose();
                        } else if (outcome.kind === "refused") {
                            Alert.alert("Not uploaded", outcome.message);
                        } else if (outcome.kind === "failed") {
                            Alert.alert(
                                "Not uploaded",
                                "Check your connection and tap Submit again.",
                            );
                        }
                    },
                },
            ],
        );
    };

    return (
        <ResultsFormCapture
            visible={visible}
            onClose={onClose}
            title="Submit results"
            candidates={formCandidates}
            level={level}
            stationCode={String(id)}
            onChooseStream={() => router.dismissTo("/communityNotes")}
            onSubmit={handleSubmit}
        />
    );
}

export default AddFormModal;
