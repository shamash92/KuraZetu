import {Alert} from "react-native";

import {Form34ACandidate, Form34ACaptureForm} from "./Form34ACaptureForm";

interface Candidate {
    name: string;
    party: string;
    votes: number;
}

interface ElectionData {
    pollingStation: string;
    pollingStationCode: string;
    ward: string;
    constituency: string;
    county: string;
    form34AImage: string;
    candidates: Candidate[];
    totalValidVotes: number;
    rejectedVotes: number;
    disputedVotes: number;
    totalVotesCast: number;
    registeredVoters: number;
}

interface CounterEvidenceModalProps {
    visible: boolean;
    onClose: () => void;
    originalResults: ElectionData;
}

export function CounterEvidenceModal({
    visible,
    onClose,
    originalResults,
}: CounterEvidenceModalProps) {
    const formCandidates: Form34ACandidate[] = originalResults.candidates.map(
        (candidate) => ({
            key: candidate.name,
            name: candidate.name,
            party: candidate.party,
        }),
    );

    // True when the entered tally is identical to the original submission —
    // in that case there is no counter-evidence to add.
    const isIdentical = (
        votes: Record<string, number>,
        rejectedVotes: number,
        disputedVotes: number,
    ) => {
        for (const candidate of originalResults.candidates) {
            if ((votes[candidate.name] ?? 0) !== candidate.votes) {
                return false;
            }
        }
        return (
            rejectedVotes === originalResults.rejectedVotes &&
            disputedVotes === originalResults.disputedVotes
        );
    };

    const handleSubmit = ({
        votes,
        rejectedVotes,
        disputedVotes,
    }: {
        votes: Record<string, number>;
        rejectedVotes: number;
        disputedVotes: number;
    }) => {
        if (isIdentical(votes, rejectedVotes, disputedVotes)) {
            Alert.alert(
                "Results Match",
                "Your submitted results match the original submission. No counter-evidence needed.",
            );
            return;
        }

        Alert.alert(
            "Submit Counter-Evidence",
            "Are you sure you want to submit this counter-evidence?",
            [
                {text: "Cancel", style: "cancel"},
                {
                    text: "Submit",
                    onPress: () => {
                        // TODO: wire counter-evidence submission to the API.
                        Alert.alert(
                            "Success",
                            "Counter-evidence submitted successfully",
                        );
                        onClose();
                    },
                },
            ],
        );
    };

    return (
        <Form34ACaptureForm
            visible={visible}
            onClose={onClose}
            title="Submit counter-evidence"
            submitLabel="Submit"
            candidates={formCandidates}
            canSubmit={({votes, rejectedVotes, disputedVotes}) =>
                !isIdentical(votes, rejectedVotes, disputedVotes)
            }
            onSubmit={handleSubmit}
        />
    );
}

export default CounterEvidenceModal;
