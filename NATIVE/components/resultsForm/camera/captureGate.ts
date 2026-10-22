import type {BracketState} from "./FramingBracket";
import {type FrameQuality, assessQuality, isTooDark} from "./frameQuality.ts";

/** How long usable frames must continue before the shutter is offered. */
const READY_SECONDS = 2;

/**
 * Wall-clock time after the camera opens before Capture anyway is offered.
 * Wall clock, not camera time: on a phone whose frames are never measured,
 * camera time never advances.
 */
export const CAPTURE_ANYWAY_MS = 15_000;

/** Camera time the page must stay too dark before the light is suggested or lit. */
const DARK_SECONDS = 1;

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

/** The person's light setting; null when the phone has no torch. */
export type LightSetting = "off" | "auto" | "on";

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
    /** Camera time of the first too-dark frame in the current dark run. */
    darkSinceSeconds: number | null;
    /** Auto has turned the light on; it stays on until the camera closes. */
    autoLit: boolean;
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
    /** True while a usable frame must stay still before the shutter is ready. */
    settling?: boolean;
};

export type CaptureGateView = {
    /** Null until the first frame is measured. */
    guidance: Guidance | null;
    bracket: BracketState;
    shutter: ShutterState;
    /** Wall-clock time Capture anyway is offered; null before the camera opens. */
    anywayAtMs: number | null;
    /** Whether the torch should be lit, before the app-in-foreground check. */
    torchOn: boolean;
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
    torchOn: false,
};

/** Start a new gate when the camera opens, on retake, or after a reset. */
export function startCaptureGate(nowMs: number): CaptureGateState {
    return {
        openedAtMs: nowMs,
        lastReading: null,
        usableSinceSeconds: null,
        ready: false,
        darkSinceSeconds: null,
        autoLit: false,
    };
}

function isDarkLongEnough(state: CaptureGateState) {
    return (
        state.darkSinceSeconds !== null &&
        !!state.lastReading &&
        state.lastReading.cameraSeconds - state.darkSinceSeconds >= DARK_SECONDS
    );
}

function advanceDark(
    previous: CaptureGateState,
    reading: GateReading,
    light: LightSetting | null,
): Pick<CaptureGateState, "darkSinceSeconds" | "autoLit"> {
    const dark = isTooDark(reading.quality);
    const darkSinceSeconds = !dark
        ? null
        : previous.darkSinceSeconds === null ||
            reading.cameraSeconds < previous.darkSinceSeconds
          ? reading.cameraSeconds
          : previous.darkSinceSeconds;
    const longEnough =
        darkSinceSeconds !== null &&
        reading.cameraSeconds - darkSinceSeconds >= DARK_SECONDS;

    return {
        darkSinceSeconds,
        autoLit: previous.autoLit || (light === "auto" && longEnough),
    };
}

function advanceRun(
    previous: CaptureGateState,
    reading: GateReading,
    light: LightSetting | null,
): CaptureGateState {
    const base = {
        ...previous,
        ...advanceDark(previous, reading, light),
        lastReading: reading,
    };

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

function describeGuidance(
    state: CaptureGateState,
    light: LightSetting | null,
): Guidance | null {
    const reading = state.lastReading;
    if (!reading) return null;

    // First: in the dark the page often cannot be found, and light fixes both.
    if (light === "off" && isDarkLongEnough(state)) {
        return {label: "Too dark", hint: "Tap the light", ok: false};
    }

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
        return {label: "Hold still", hint: null, ok: true, settling: true};
    }

    const assessment = assessQuality(reading.quality);
    return {label: assessment.label, hint: assessment.hint, ok: assessment.ok};
}

function describeView(
    state: CaptureGateState,
    nowMs: number,
    light: LightSetting | null,
): CaptureGateView {
    const usable = !!state.lastReading && isUsable(state.lastReading);
    const anywayAtMs = state.openedAtMs + CAPTURE_ANYWAY_MS;

    return {
        guidance: describeGuidance(state, light),
        bracket: !usable ? "bad" : state.ready ? "steady" : "ok",
        shutter: state.ready ? "ready" : nowMs >= anywayAtMs ? "anyway" : "waiting",
        anywayAtMs,
        torchOn: light === "on" || (light === "auto" && state.autoLit),
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
    input: {nowMs: number; light?: LightSetting | null; reading?: GateReading},
): CaptureGateResult {
    const light = input.light ?? null;
    const state = input.reading
        ? advanceRun(previous, input.reading, light)
        : previous;

    return {
        state,
        view: describeView(state, input.nowMs, light),
        becameReady: !previous.ready && state.ready,
    };
}
