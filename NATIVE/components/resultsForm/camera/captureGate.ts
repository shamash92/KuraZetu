import type {BracketState} from "./FramingBracket";
import {type FrameQuality, assessQuality} from "./frameQuality.ts";

/** How long usable frames must continue before the shutter is offered. */
const READY_SECONDS = 2;

/**
 * Wall-clock time after the camera opens before Capture anyway is offered.
 * Wall clock, not camera time: on a phone whose frames are never measured,
 * camera time never advances.
 */
export const CAPTURE_ANYWAY_MS = 15_000;

/** The page must occupy enough pixels to preserve handwritten digits. */
const MIN_PAGE_COVERAGE = 0.35;

/** A wide range for a perspective-distorted A4 portrait page. */
const MIN_PAGE_ASPECT = 0.45;
const MAX_PAGE_ASPECT = 1.0;

/** The size and shape of the page found in a frame. */
export type PageOutline = {
    areaFraction: number;
    aspectRatio: number;
};

/** One smoothed measurement of a preview frame. */
export type GateReading = {
    quality: FrameQuality;
    document: PageOutline | null;
    /** Camera time of the frame, in seconds. */
    cameraSeconds: number;
};

export type CaptureGateState = {
    /** Wall-clock time the camera opened, in milliseconds. */
    openedAtMs: number;
    /** The latest reading, kept so a clock tick can redraw the screen. */
    lastReading: GateReading | null;
    /** Camera time of the first usable frame in the current run. */
    usableSinceSeconds: number | null;
    ready: boolean;
};

/** `anyway` offers a photograph without the quality check. */
export type ShutterState = "waiting" | "ready" | "anyway";

/** The one line of guidance on the camera screen. */
export type Guidance = {
    label: string;
    /** One thing the person should do, or null when nothing is needed. */
    hint: string | null;
    /** True when the frame is usable. */
    ok: boolean;
};

export type CaptureGateView = {
    /** Null until the first frame is measured. */
    guidance: Guidance | null;
    bracket: BracketState;
    shutter: ShutterState;
    /** Wall-clock time Capture anyway is offered; null before the camera opens. */
    anywayAtMs: number | null;
};

export type CaptureGateResult = {
    state: CaptureGateState;
    view: CaptureGateView;
    /** True only on the reading that made the frame ready. */
    becameReady: boolean;
};

function isPageCovered(page: PageOutline | null) {
    return (
        !!page &&
        page.areaFraction >= MIN_PAGE_COVERAGE &&
        page.aspectRatio >= MIN_PAGE_ASPECT &&
        page.aspectRatio <= MAX_PAGE_ASPECT
    );
}

function isUsable(reading: GateReading) {
    return assessQuality(reading.quality).ok && isPageCovered(reading.document);
}

/** What the camera screen shows before the camera opens. */
export const INITIAL_CAPTURE_VIEW: CaptureGateView = {
    guidance: null,
    bracket: "bad",
    shutter: "waiting",
    anywayAtMs: null,
};

/** Start a new gate when the camera opens, on retake, or after a reset. */
export function startCaptureGate(nowMs: number): CaptureGateState {
    return {
        openedAtMs: nowMs,
        lastReading: null,
        usableSinceSeconds: null,
        ready: false,
    };
}

function advanceRun(
    previous: CaptureGateState,
    reading: GateReading,
): CaptureGateState {
    const base = {...previous, lastReading: reading};

    if (!isUsable(reading) || !Number.isFinite(reading.cameraSeconds)) {
        return {...base, usableSinceSeconds: null, ready: false};
    }

    if (
        previous.usableSinceSeconds === null ||
        reading.cameraSeconds < previous.usableSinceSeconds
    ) {
        return {...base, usableSinceSeconds: reading.cameraSeconds, ready: false};
    }

    return {
        ...base,
        ready: reading.cameraSeconds - previous.usableSinceSeconds >= READY_SECONDS,
    };
}

function describeGuidance(state: CaptureGateState): Guidance | null {
    const reading = state.lastReading;
    if (!reading) return null;

    if (!isPageCovered(reading.document)) {
        return {
            label: reading.document ? "Move closer" : "Show the whole form",
            hint: reading.document
                ? "Fill the brackets with the form"
                : "Fit all four edges inside the brackets",
            ok: false,
        };
    }

    if (state.usableSinceSeconds !== null && !state.ready) {
        return {label: "Hold still", hint: null, ok: true};
    }

    const assessment = assessQuality(reading.quality);
    return {label: assessment.label, hint: assessment.hint, ok: assessment.ok};
}

function describeView(state: CaptureGateState, nowMs: number): CaptureGateView {
    const usable = !!state.lastReading && isUsable(state.lastReading);
    const anywayAtMs = state.openedAtMs + CAPTURE_ANYWAY_MS;

    return {
        guidance: describeGuidance(state),
        bracket: !usable ? "bad" : state.ready ? "steady" : "ok",
        shutter: state.ready ? "ready" : nowMs >= anywayAtMs ? "anyway" : "waiting",
        anywayAtMs,
    };
}

/**
 * Advance the gate and say what the camera screen shows.
 *
 * Call it with each measured frame, and with no reading once a second so
 * Capture anyway appears even when no frame is measured. Pure: the caller
 * owns the camera, the clock and the vibration.
 */
export function advanceCaptureGate(
    previous: CaptureGateState,
    input: {nowMs: number; reading?: GateReading},
): CaptureGateResult {
    const state = input.reading ? advanceRun(previous, input.reading) : previous;

    return {
        state,
        view: describeView(state, input.nowMs),
        becameReady: !previous.ready && state.ready,
    };
}
