/** Each count on a results form is written in three boxes: 000 to 999. */
export const VOTE_DIGITS = 3;

/**
 * The digits of a vote box as typed, at most three, without leading zeros:
 * "0" for none, "4", "40", "400". The boxes show them right-aligned (004).
 */
export function voteDigits(text: string): string {
    return text
        .replace(/[^0-9]/g, "")
        .replace(/^0+(?=\d)/, "")
        .slice(0, VOTE_DIGITS);
}

/** What the three boxes show: the typed digits padded with zeros (004). */
export function voteBoxes(digits: string): string {
    return digits.padStart(VOTE_DIGITS, "0");
}

/** A box counts once anything is typed in it; 0 is typed, not assumed. */
export function isFilled(digits: string): boolean {
    return digits !== "";
}

/** The count a box holds, for totals and for sending to the server. */
export function toCount(digits: string): number {
    return digits === "" ? 0 : Number.parseInt(digits, 10);
}
