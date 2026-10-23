/**
 * Convert pasted or typed text into a non-negative, safely representable
 * count. An empty box is null: no number typed yet, which is not 0.
 */
export function parseVoteCount(text: string): number | null {
    const digits = text.replace(/[^0-9]/g, "");
    if (digits === "") return null;

    return Math.min(Number(digits), Number.MAX_SAFE_INTEGER);
}
