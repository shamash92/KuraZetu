/** Convert pasted or typed text into a non-negative, safely representable count. */
export function parseVoteCount(text: string): number {
    const digits = text.replace(/[^0-9]/g, "");
    if (digits === "") return 0;

    return Math.min(Number(digits), Number.MAX_SAFE_INTEGER);
}
