import {Alert} from "react-native";
import {fetch} from "expo/fetch";
import {File} from "expo-file-system";
import {useEffect, useState} from "react";

import {Form34ACandidate, Form34ACaptureForm} from "./Form34ACaptureForm";
import {TLevelTabs} from "@/app/types";
import {apiBaseURL} from "@/app/_utils/apiBaseURL";
import useAuthStore from "@/app/_utils/authStore";
import {useLocalSearchParams} from "expo-router";

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
        const fetchCandidates = async () => {
            try {
                const response = await fetch(
                    `${apiBaseURL}/api/results/polling-station/aspirants/${id}/${level}/`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Token ${userToken}`,
                        },
                        method: "GET",
                    },
                );
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

    const formCandidates: Form34ACandidate[] = candidates.map((candidate) => ({
        key: String(candidate.id),
        name: `${candidate.first_name} ${candidate.last_name}`,
        party: candidate.party,
    }));

    const handleSubmit = ({
        image,
        votes,
        rejectedVotes,
        disputedVotes,
    }: {
        image: string;
        votes: Record<string, number>;
        rejectedVotes: number;
        disputedVotes: number;
    }) => {
        const candidateVotes = candidates.map((candidate) => ({
            id: candidate.id,
            votes: votes[String(candidate.id)] ?? 0,
        }));

        Alert.alert(
            "Submit Results",
            "Are you sure you want to submit these results?",
            [
                {text: "Cancel", style: "cancel"},
                {
                    text: "Submit",
                    onPress: () => {
                        const formData = new FormData();
                        formData.append(
                            "data",
                            JSON.stringify({
                                polling_station: id,
                                level: level,
                                image: image,
                                votes: candidateVotes,
                                rejected_votes: rejectedVotes,
                                disputed_votes: disputedVotes,
                            }),
                        );

                        // Expo's current FormData implementation accepts Blob-compatible
                        // values. The legacy React Native {uri, type, name} object causes
                        // "Unsupported FormDataPart implementation" on the simulator.
                        formData.append("image", new File(image));

                        fetch(
                            `${apiBaseURL}/api/results/polling-station/create/${id}/${level}/`,
                            {
                                method: "POST",
                                headers: {
                                    Authorization: `Token ${userToken}`,
                                    Accept: "application/json",
                                },
                                body: formData,
                            },
                        )
                            .then((response) => {
                                if (!response.ok) {
                                    throw new Error("Failed to submit results");
                                }
                                return response.json();
                            })
                            .then(() => {
                                Alert.alert(
                                    "Success",
                                    "Results submitted successfully",
                                );
                                onClose();
                            })
                            .catch((error) => {
                                console.error("Error submitting results:", error);
                                Alert.alert("Error", "Failed to submit results");
                            });
                    },
                },
            ],
        );
    };

    return (
        <Form34ACaptureForm
            visible={visible}
            onClose={onClose}
            title="Submit results"
            candidates={formCandidates}
            onSubmit={handleSubmit}
        />
    );
}

export default AddFormModal;
