import {Alert} from "react-native";
import {useEffect, useRef, useState} from "react";

import {
    ResultsFormAgreement,
    ResultsFormCandidate,
    ResultsFormCapture,
} from "@/components/resultsForm";
import {voteLimit} from "@/components/resultsForm/entry/voteCount";
import {
    UploadOutcome,
    newUploadKey,
    submitAgreement,
    uploadResultsForm,
} from "@/components/resultsForm/upload/uploadResultsForm";
import type {DeviceFix} from "@/components/resultsForm/upload/deviceFix";
import {TLevelTabs} from "@/app/types";
import {apiBaseURL} from "@/app/_utils/apiBaseURL";
import useAuthStore from "@/app/_utils/auth/authStore";
import {handleUnauthorized} from "@/app/_utils/auth/handleUnauthorized";
import {toTitleCase} from "@/app/_utils/toTitleCase";
import {useStationInfo} from "@/hooks/useStationInfo";
import {router, useLocalSearchParams} from "expo-router";

export interface IAspirant {
    constituency: null | string;
    county: null | string;
    first_name: string;
    /** All three names, as stored on the server. */
    full_name?: string;
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
    /** The earlier upload the person agrees with; null to type the results. */
    agreeWith?: string | null;
}

export function AddFormModal({
    visible,
    onClose,
    level,
    agreeWith = null,
}: AddFormModalProps) {
    const [candidates, setCandidates] = useState<IAspirant[]>([]);

    const {userToken} = useAuthStore();
    const {id} = useLocalSearchParams();
    const station = useStationInfo();

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
        name: candidate.full_name ?? `${candidate.first_name} ${candidate.last_name}`,
        party: candidate.party,
    }));

    // One key per photo: tapping Submit again after a lost connection sends
    // the same key, and the server stores the upload once.
    const uploadKey = useRef<{image: string; key: string} | null>(null);
    const [uploading, setUploading] = useState(false);

    const keyFor = (image: string) => {
        if (uploadKey.current?.image !== image) {
            uploadKey.current = {image, key: newUploadKey()};
        }
        return uploadKey.current.key;
    };

    const tell = (outcome: UploadOutcome) => {
        if (outcome.kind === "stored") {
            Alert.alert(
                outcome.countable ? "Uploaded" : "Uploaded, but it cannot count",
                outcome.message ?? "Your results form was uploaded.",
            );
            onClose();
        } else if (outcome.kind === "refused") {
            Alert.alert("Not uploaded", outcome.message);
        } else if (outcome.kind === "failed") {
            Alert.alert("Not uploaded", "Check your connection and tap Submit again.");
        }
    };

    const handleAgree = ({
        image,
        qualityChecked,
        fix,
        capturedAt,
        checkId,
    }: ResultsFormAgreement) => {
        if (!userToken || uploading) return;
        const key = keyFor(image);
        setUploading(true);
        void submitAgreement({token: userToken, checkId, qualityChecked, key, fix, capturedAt})
            .then(tell)
            .finally(() => setUploading(false));
    };

    const handleSubmit = ({
        image,
        qualityChecked,
        votes,
        rejectedVotes,
        disputedVotes,
        fix,
        capturedAt,
        checkId,
    }: {
        image: string;
        qualityChecked: boolean;
        votes: Record<string, number>;
        rejectedVotes: number;
        disputedVotes: number;
        total: number;
        fix: DeviceFix | null;
        capturedAt: string | null;
        checkId: string | null;
    }) => {
        // Submit is enabled only once every box has a typed number.
        const tally = Object.fromEntries(
            candidates.map((candidate) => [
                String(candidate.id),
                votes[String(candidate.id)],
            ]),
        );
        const key = keyFor(image);

        // Submit takes three taps, so a stray tap does not send an upload.
        const send = async () => {
            if (!userToken) return;

            setUploading(true);
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
                fix,
                capturedAt,
                checkId,
            }).finally(() => setUploading(false));
            tell(outcome);
        };
        void send();
    };

    return (
        <ResultsFormCapture
            visible={visible}
            onClose={onClose}
            title={agreeWith ? "Agree" : "Submit results"}
            candidates={formCandidates}
            level={level}
            stationCode={String(id)}
            onChooseStream={() => router.dismissTo("/communityNotes")}
            maxVotes={voteLimit(station?.registered_voters)}
            readsPhoto
            agreeWith={agreeWith}
            onAgree={handleAgree}
            place={
                station?.location_check
                    ? {
                          check: station.location_check,
                          centreName: toTitleCase(station.polling_center),
                          wardName: station.ward ? toTitleCase(station.ward) : null,
                      }
                    : undefined
            }
            submitting={uploading}
            onSubmit={handleSubmit}
        />
    );
}

export default AddFormModal;
