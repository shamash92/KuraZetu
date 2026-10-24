/** Where the phone is, as the device reports it. Accuracy is in metres. */
export interface DeviceFix {
    latitude: number;
    longitude: number;
    accuracy: number;
}

/** The server cannot place an upload with a fix less precise than this. */
export const MAX_ACCURACY_M = 100;

/** Keep whichever fix is more accurate; a fix beats none. */
export function moreAccurate(kept: DeviceFix | null, next: DeviceFix): DeviceFix {
    if (!kept || next.accuracy < kept.accuracy) return next;
    return kept;
}

/** Whether the server can grade a fix rather than calling it unknown. */
export function isPrecise(fix: DeviceFix | null): boolean {
    return fix !== null && fix.accuracy <= MAX_ACCURACY_M;
}
