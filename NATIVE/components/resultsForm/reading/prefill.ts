import {voteDigits} from "../entry/voteCount.ts";

/** The figures the server read one way; null leaves the box for the person. */
export interface Prefill {
    votes: Record<string, number | null>;
    rejected_votes: number | null;
    disputed_votes: number | null;
}

/** One line of what the server checks on a photo taken to agree. */
export interface AgreementCheck {
    code: string;
    label: string;
    state: "running" | "passed" | "failed" | "not_read";
    /** Each figure that differs or could not be read, from this photo. */
    details: string[];
}

/** A reading as the server sends it to the phone. */
export interface Reading {
    check_id: string;
    status: "running" | "done" | "failed";
    outcome: string | null;
    message: string | null;
    /** The photo cannot be used: take another. */
    retake: boolean;
    prefill: Prefill | null;
    /**
     * Made to agree with an earlier upload: `outcome` is then "agrees",
     * "figures_differ" or "not_checked".
     */
    agreement?: boolean;
    /** With an agreement, each check and how far it has got. */
    checks?: AgreementCheck[];
    /**
     * With differences: the path of the person's photo with an arrow at each.
     * Opens with their sign-in token.
     */
    marked_photo?: string;
}

/** The boxes filled from a reading, and the boxes the person must fill. */
export interface FilledBoxes {
    votes: Record<string, string>;
    rejectedVotes: string;
    disputedVotes: string;
    /** Box keys left empty: candidate keys, "rejected", "disputed". */
    unread: string[];
}

export const REJECTED = "rejected";
export const DISPUTED = "disputed";

function digits(value: number | null | undefined): string | null {
    return value === null || value === undefined ? null : voteDigits(String(value));
}

/** Fill every box the reading has; every other box stays empty. */
export function fillBoxes(prefill: Prefill | null, candidateKeys: string[]): FilledBoxes {
    const filled: FilledBoxes = {votes: {}, rejectedVotes: "", disputedVotes: "", unread: []};
    for (const key of candidateKeys) {
        const value = digits(prefill?.votes[key]);
        if (value === null) filled.unread.push(key);
        else filled.votes[key] = value;
    }
    const rejected = digits(prefill?.rejected_votes);
    if (rejected === null) filled.unread.push(REJECTED);
    else filled.rejectedVotes = rejected;
    const disputed = digits(prefill?.disputed_votes);
    if (disputed === null) filled.unread.push(DISPUTED);
    else filled.disputedVotes = disputed;
    return filled;
}
