import {Platform} from "react-native";
import React, {useState} from "react";
import {CommonResolutions, Size, useFrameOutput} from "react-native-vision-camera";
import {useSharedValue} from "react-native-reanimated";
import {scheduleOnRN} from "react-native-worklets";

import * as Haptics from "expo-haptics";

import type {BracketState} from "./FramingBracket";
import {
    CaptureReadiness,
    INITIAL_CAPTURE_READINESS,
    advanceCaptureReadiness,
} from "./captureReadiness";
import {DetectedDocument, detectDocument} from "./documentDetection";
import {
    FrameQuality,
    LumaThumbnail,
    analyseLumaPlane,
    assessQuality,
    extractLumaThumbnail,
    smoothQuality,
} from "./frameQuality";

export type CaptureAspect = "16:9" | "4:3";

/** Measure one frame in every interval instead of stalling the camera. */
const FRAME_SAMPLE_INTERVAL = 5;

// VisionCamera 5.2 exposes Android frame timestamps in nanoseconds and iOS
// frame timestamps in seconds.
const FRAME_TIMESTAMP_TO_SECONDS = Platform.OS === "android" ? 1e-9 : 1;

/** Development-only switch for calibrating thresholds on a printed form. */
const LOG_READINGS = false;

/** Width the frame is reduced to before edge detection. */
const DETECTION_WIDTH = 240;

/** Frame-processing resolution stays small; only the shape needs to match. */
const FRAME_RESOLUTION: Record<CaptureAspect, Size> = {
    "16:9": CommonResolutions.VGA_16_9,
    "4:3": CommonResolutions.VGA_4_3,
};

/** The detected form must occupy enough pixels to preserve handwritten digits. */
const MIN_DOCUMENT_COVERAGE = 0.35;

/** A wide range for a perspective-distorted A4 portrait page. */
const MIN_DOCUMENT_ASPECT = 0.45;
const MAX_DOCUMENT_ASPECT = 1.0;

function isDocumentCovered(document: DetectedDocument | null) {
    return (
        !!document &&
        document.areaFraction >= MIN_DOCUMENT_COVERAGE &&
        document.aspectRatio >= MIN_DOCUMENT_ASPECT &&
        document.aspectRatio <= MAX_DOCUMENT_ASPECT
    );
}

interface UseForm34AFrameAnalysisOptions {
    active: boolean;
    aspect: CaptureAspect;
}

/**
 * Own the complete live-analysis pipeline behind one camera-facing interface.
 *
 * The form only consumes guidance, diagnostics, readiness, a reset operation,
 * and the configured frame output. Worklet scheduling, OpenCV, smoothing and
 * native-frame disposal remain private to this module.
 */
export function useForm34AFrameAnalysis({
    active,
    aspect,
}: UseForm34AFrameAnalysisOptions) {
    const [quality, setQuality] = useState<FrameQuality | null>(null);
    const [document, setDocument] = useState<DetectedDocument | null>(null);
    const [readiness, setReadiness] = useState<CaptureReadiness>(
        INITIAL_CAPTURE_READINESS,
    );
    const readinessRef = React.useRef(INITIAL_CAPTURE_READINESS);
    const smoothedRef = React.useRef<FrameQuality | null>(null);

    // At most one copied thumbnail may wait for the React Native thread. The
    // tokens also keep callbacks from expired camera sessions out of new ones.
    const frameCounter = useSharedValue(0);
    const analysisGeneration = useSharedValue(0);
    const analysisRequestSequence = useSharedValue(0);
    const analysisInFlightRequest = useSharedValue(0);

    const reportQuality = React.useCallback(
        (
            measured: FrameQuality,
            thumbnail: LumaThumbnail,
            timestampSeconds: number,
            generation: number,
            requestId: number,
        ) => {
            try {
                if (generation !== analysisGeneration.get()) return;

                const found = detectDocument(thumbnail);
                setDocument(found);

                const smoothed = smoothQuality(smoothedRef.current, measured);
                smoothedRef.current = smoothed;
                setQuality(smoothed);

                const covered = isDocumentCovered(found);

                if (LOG_READINGS)
                    console.log(
                        `[form34a] bright=${smoothed.brightness.toFixed(1)} ` +
                            `sharp=${smoothed.sharpness.toFixed(1)} ` +
                            `glare=${(smoothed.glare * 100).toFixed(2)}% ` +
                            `doc=${found ? (found.areaFraction * 100).toFixed(1) + "%" : "none"} ` +
                            `largest=${found ? (found.largestAreaFraction * 100).toFixed(1) + "%" : "-"} ` +
                            `contours=${found?.contourCount ?? 0} ` +
                            `corners=${found?.bestPointCount ?? 0} ` +
                            `ratio=${found ? found.aspectRatio.toFixed(2) : "-"}`,
                    );

                const transition = advanceCaptureReadiness(
                    readinessRef.current,
                    assessQuality(smoothed).ok && covered,
                    timestampSeconds,
                );
                readinessRef.current = transition.state;
                setReadiness(transition.state);

                if (transition.becameReady) {
                    Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Success,
                    );
                }
            } finally {
                if (analysisInFlightRequest.get() === requestId) {
                    analysisInFlightRequest.set(0);
                }
            }
        },
        [analysisGeneration, analysisInFlightRequest],
    );

    const rawAssessment = quality ? assessQuality(quality) : null;
    const covered = isDocumentCovered(document);
    const assessment =
        rawAssessment && !covered
            ? {
                  ...rawAssessment,
                  label: document ? "Move closer" : "Show the whole form",
                  hint: document
                      ? "Fill the brackets with the form"
                      : "Fit all four edges inside the brackets",
                  ok: false,
              }
            : rawAssessment?.ok &&
                readiness.goodSinceSeconds !== null &&
                !readiness.ready
              ? {
                    ...rawAssessment,
                    label: "Hold still",
                    hint: null,
                }
              : rawAssessment;

    const readyToCapture = readiness.ready;
    const bracketState: BracketState = !assessment?.ok
        ? "bad"
        : readyToCapture
          ? "steady"
          : "ok";

    const frameOutput = useFrameOutput({
        targetResolution: FRAME_RESOLUTION[aspect],
        pixelFormat: "yuv",
        onFrame(frame) {
            "worklet";
            try {
                frameCounter.value += 1;
                if (frameCounter.value % FRAME_SAMPLE_INTERVAL !== 0) return;
                if (analysisInFlightRequest.value !== 0) return;
                const generation = analysisGeneration.value;

                const planes = frame.getPlanes();
                if (planes.length === 0) return;

                const luma = planes[0];
                const bytes = new Uint8Array(luma.getPixelBuffer());
                const measured = analyseLumaPlane(
                    bytes,
                    luma.width,
                    luma.height,
                    luma.bytesPerRow,
                );
                const thumbnail = extractLumaThumbnail(
                    bytes,
                    luma.width,
                    luma.height,
                    luma.bytesPerRow,
                    DETECTION_WIDTH,
                    frame.orientation === "left" || frame.orientation === "right",
                );
                if (generation !== analysisGeneration.value) return;

                analysisRequestSequence.value += 1;
                const requestId = analysisRequestSequence.value;
                analysisInFlightRequest.value = requestId;
                try {
                    scheduleOnRN(
                        reportQuality,
                        measured,
                        thumbnail,
                        frame.timestamp * FRAME_TIMESTAMP_TO_SECONDS,
                        generation,
                        requestId,
                    );
                } catch (error) {
                    if (analysisInFlightRequest.value === requestId) {
                        analysisInFlightRequest.value = 0;
                    }
                    console.warn("[form34a] unable to schedule analysis", error);
                }
            } finally {
                frame.dispose();
            }
        },
    });

    const invalidateAnalysis = React.useCallback(() => {
        analysisGeneration.set((generation) => generation + 1);
        analysisInFlightRequest.set(0);
        frameCounter.set(0);
    }, [analysisGeneration, analysisInFlightRequest, frameCounter]);

    const resetAnalysis = React.useCallback(() => {
        invalidateAnalysis();
        setQuality(null);
        setDocument(null);
        smoothedRef.current = null;
        readinessRef.current = INITIAL_CAPTURE_READINESS;
        setReadiness(INITIAL_CAPTURE_READINESS);
    }, [invalidateAnalysis]);

    React.useEffect(() => {
        if (!active) invalidateAnalysis();
    }, [active, invalidateAnalysis]);

    return {
        assessment,
        bracketState,
        frameOutput,
        readyToCapture,
        resetAnalysis,
    };
}
