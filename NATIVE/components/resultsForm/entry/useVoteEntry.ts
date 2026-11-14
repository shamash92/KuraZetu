import {useState} from "react";

import type {ResultsFormCandidate} from "../types";
import {type Reading, fillBoxes} from "../reading/prefill";
import {toCount} from "./voteCount";

/** What the parent's extra Submit gate is given. */
export interface VoteEntryState {
    votes: Record<string, number>;
    rejectedVotes: number;
    disputedVotes: number;
    hasImage: boolean;
}

/** The vote boxes, their total, and whether Submit is allowed. */
export function useVoteEntry({
    candidates,
    maxVotes,
    hasImage,
    canSubmit,
}: {
    candidates: ResultsFormCandidate[];
    maxVotes: number;
    hasImage: boolean;
    canSubmit?: (state: VoteEntryState) => boolean;
}) {
    // Digits typed per box, at most three; converted to numbers on submit.
    const [votes, setVotes] = useState<Record<string, string>>({});
    const [rejectedVotes, setRejectedVotes] = useState("");
    const [disputedVotes, setDisputedVotes] = useState("");

    const setVote = (key: string, digits: string) =>
        setVotes((prev) => ({...prev, [key]: digits}));

    // Every candidate, so an untouched box is sent as 0.
    const counts = Object.fromEntries(
        candidates.map(({key}) => [key, toCount(votes[key] ?? "")]),
    );
    const rejected = toCount(rejectedVotes);
    const disputed = toCount(disputedVotes);
    const total =
        Object.values(counts).reduce((sum, count) => sum + count, 0) + rejected + disputed;

    const extraGate = canSubmit
        ? canSubmit({votes: counts, rejectedVotes: rejected, disputedVotes: disputed, hasImage})
        : true;
    // A form where every box is 0 has not been entered.
    const submitEnabled = hasImage && total > 0 && total <= maxVotes && extraGate;

    /** Empty every box. */
    const clear = () => {
        setVotes({});
        setRejectedVotes("");
        setDisputedVotes("");
    };

    /** Put a reading's figures in the boxes; returns the boxes it left empty. */
    const fill = (prefill: Reading["prefill"] | null): string[] => {
        const boxes = fillBoxes(
            prefill,
            candidates.map(({key}) => key),
        );
        setVotes(boxes.votes);
        setRejectedVotes(boxes.rejectedVotes);
        setDisputedVotes(boxes.disputedVotes);
        return boxes.unread;
    };

    return {
        votes,
        rejectedVotes,
        disputedVotes,
        setVote,
        setRejectedVotes,
        setDisputedVotes,
        counts,
        rejected,
        disputed,
        total,
        submitEnabled,
        clear,
        fill,
    };
}
