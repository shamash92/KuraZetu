/** How long a usable frame must remain stable before capture is enabled. */
export const CAPTURE_READY_SECONDS = 2;

export interface CaptureReadiness {
    /** Camera timestamp of the first acceptable frame in the current run. */
    goodSinceSeconds: number | null;
    /** Duration of the current acceptable run, derived from camera timestamps. */
    goodForSeconds: number;
    ready: boolean;
}

export interface CaptureReadinessTransition {
    state: CaptureReadiness;
    becameReady: boolean;
}

export const INITIAL_CAPTURE_READINESS: CaptureReadiness = {
    goodSinceSeconds: null,
    goodForSeconds: 0,
    ready: false,
};

/**
 * Advance capture readiness from a timestamped quality reading.
 *
 * Camera time makes the two-second gate independent of the device frame rate,
 * skipped frames and any analysis work that takes longer than expected.
 */
export function advanceCaptureReadiness(
    previous: CaptureReadiness,
    acceptable: boolean,
    timestampSeconds: number,
): CaptureReadinessTransition {
    if (!acceptable || !Number.isFinite(timestampSeconds)) {
        return {
            state: INITIAL_CAPTURE_READINESS,
            becameReady: false,
        };
    }

    if (
        previous.goodSinceSeconds === null ||
        timestampSeconds < previous.goodSinceSeconds
    ) {
        return {
            state: {
                goodSinceSeconds: timestampSeconds,
                goodForSeconds: 0,
                ready: false,
            },
            becameReady: false,
        };
    }

    const goodForSeconds = timestampSeconds - previous.goodSinceSeconds;
    const ready = goodForSeconds >= CAPTURE_READY_SECONDS;

    return {
        state: {
            goodSinceSeconds: previous.goodSinceSeconds,
            goodForSeconds,
            ready,
        },
        becameReady: !previous.ready && ready,
    };
}
