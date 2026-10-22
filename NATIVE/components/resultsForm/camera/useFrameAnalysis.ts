import {Platform} from "react-native";
import React, {useState} from "react";
import {CommonResolutions, Size, useFrameOutput} from "react-native-vision-camera";
import {useSharedValue} from "react-native-reanimated";
import {scheduleOnRN} from "react-native-worklets";

import * as Haptics from "expo-haptics";

import {
    CaptureGateState,
    CaptureGateView,
    INITIAL_CAPTURE_VIEW,
    advanceCaptureGate,
    startCaptureGate,
} from "./captureGate";
import {detectDocument} from "./documentDetection";
import {
    FrameQuality,
    LumaThumbnail,
    analyseLumaPlane,
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

/** How often the gate is checked when no frame arrives, for Capture anyway. */
const GATE_TICK_MS = 1000;

interface UseFrameAnalysisOptions {
    active: boolean;
    aspect: CaptureAspect;
}

/**
 * Own the complete live-analysis pipeline behind one camera-facing interface.
 *
 * The form only consumes the gate's view, a reset operation, and the
 * configured frame output. Worklet scheduling, OpenCV, smoothing and
 * native-frame disposal remain private to this module; what the screen shows
 * is decided by the capture gate.
 */
export function useFrameAnalysis({
    active,
    aspect,
}: UseFrameAnalysisOptions) {
    const [view, setView] = useState<CaptureGateView>(INITIAL_CAPTURE_VIEW);
    /** Null until the camera opens; resetAnalysis starts each gate. */
    const gateRef = React.useRef<CaptureGateState | null>(null);
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
                if (!gateRef.current) return;

                const found = detectDocument(thumbnail);
                const smoothed = smoothQuality(smoothedRef.current, measured);
                smoothedRef.current = smoothed;

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

                const result = advanceCaptureGate(gateRef.current, {
                    nowMs: Date.now(),
                    reading: {
                        quality: smoothed,
                        document: found,
                        cameraSeconds: timestampSeconds,
                    },
                });
                gateRef.current = result.state;
                setView(result.view);

                if (result.becameReady) {
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
        smoothedRef.current = null;
        gateRef.current = startCaptureGate(Date.now());
        setView(INITIAL_CAPTURE_VIEW);
    }, [invalidateAnalysis]);

    React.useEffect(() => {
        if (!active) invalidateAnalysis();
    }, [active, invalidateAnalysis]);

    // Capture anyway runs on the wall clock, so it must appear even on a
    // phone whose frames are never measured. Between frames only the
    // shutter can change, so other ticks leave the view alone.
    React.useEffect(() => {
        if (!active) return;
        const interval = setInterval(() => {
            if (!gateRef.current) return;
            const result = advanceCaptureGate(gateRef.current, {
                nowMs: Date.now(),
            });
            setView((previous) =>
                previous.shutter === result.view.shutter ? previous : result.view,
            );
        }, GATE_TICK_MS);
        return () => clearInterval(interval);
    }, [active]);

    return {
        frameOutput,
        resetAnalysis,
        view,
    };
}
