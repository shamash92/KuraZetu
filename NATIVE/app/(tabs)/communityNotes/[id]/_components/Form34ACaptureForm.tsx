import {
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {Camera as CameraIcon, Check, X} from "lucide-react-native";
import {
    Camera,
    CommonResolutions,
    Size,
    useCameraDevice,
    useCameraPermission,
    useFrameOutput,
    usePhotoOutput,
} from "react-native-vision-camera";
import React, {useState} from "react";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import {scheduleOnRN} from "react-native-worklets";
import {useSharedValue} from "react-native-reanimated";

import * as Haptics from "expo-haptics";

import {BracketState, FramingBracket} from "./FramingBracket";
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
import {perk} from "@/app/_utils/colors";

/**
 * Measure one frame in every `FRAME_SAMPLE_INTERVAL`.
 *
 * Every frame would be wasteful and stall the camera pipeline; this lands
 * around six readings a second on a 30fps stream, which is more than enough
 * for guidance a human is reacting to.
 */
const FRAME_SAMPLE_INTERVAL = 5;

// VisionCamera 5.2 exposes Android frame timestamps in nanoseconds and iOS
// frame timestamps in seconds. Normalize at the camera boundary so readiness
// measures wall-clock capture time consistently on both platforms.
const FRAME_TIMESTAMP_TO_SECONDS = Platform.OS === "android" ? 1e-9 : 1;

/**
 * Print every frame reading to the console.
 *
 * Development only, and the switch for calibrating `THRESHOLDS` against a
 * printed form under real light — the on-screen readout shows one frame at a
 * time, whereas a log captures the whole run.
 */
const LOG_READINGS = false;

/** Width the frame is reduced to before edge detection. */
const DETECTION_WIDTH = 300;

export type CaptureAspect = "16:9" | "4:3";

/**
 * Aspect the camera starts on.
 *
 * 4:3, even though 16:9 fills a tall phone screen more neatly. 16:9 is a crop
 * of the sensor's 4:3 readout (2160x3840 against 3024x4032), and a portrait A4
 * page fits a 4:3 frame far more closely than a 16:9 one — together roughly
 * 74% more pixels landing on the form itself. That is resolution spent on
 * handwritten vote figures, which are the hardest thing to read back.
 *
 * 16:9 remains selectable for anyone who prefers the framing.
 */
const DEFAULT_ASPECT: CaptureAspect = "4:3";

const PHOTO_RESOLUTION: Record<CaptureAspect, Size> = {
    "16:9": CommonResolutions.UHD_16_9,
    "4:3": CommonResolutions.UHD_4_3,
};

/** Frame-processing resolution stays small; only the shape needs to match. */
const FRAME_RESOLUTION: Record<CaptureAspect, Size> = {
    "16:9": CommonResolutions.VGA_16_9,
    "4:3": CommonResolutions.VGA_4_3,
};

/**
 * How much of the frame the detected form must cover before the shutter is
 * offered.
 *
 * A4 is 0.707 wide-to-tall and a 4:3 portrait frame is 0.75, so a form
 * spanning the full frame height covers about 94% of it — the ratios very
 * nearly match. Filling the on-screen bracket lands around 82%, and captures
 * framed by hand measure 84-92% in practice, so this is a reachable target
 * rather than a theoretical one.
 *
 * Set well below that to leave room for imperfect framing, but far above the
 * 0.35 it started at, which passed shots with two-thirds of the frame spent on
 * the desk. Every wasted pixel is resolution the extractor does not get to
 * spend on handwritten digits, which are the hardest thing it has to read.
 *
 * Note this measures the *frame*, not the screen. Letterboxing around the
 * preview on a tall phone costs nothing — those pixels were never captured.
 */
const MIN_DOCUMENT_COVERAGE = 0.65;

/**
 * Accepted width/height range for the detected shape.
 *
 * A Form 34A is A4 portrait (~0.71). Without this the detector treats any
 * large quadrilateral as a document, so pointing the phone at a laptop screen,
 * a monitor or a desk is enough to trigger a capture. The range is wide enough
 * to tolerate the perspective of a form photographed at an angle, while still
 * excluding anything landscape.
 */
const MIN_DOCUMENT_ASPECT = 0.45;
const MAX_DOCUMENT_ASPECT = 1.0;

export interface Form34ACandidate {
    key: string;
    name: string;
    party?: string | null;
}

export interface Form34ASubmission {
    image: string;
    votes: Record<string, number>;
    rejectedVotes: number;
    disputedVotes: number;
    total: number;
}

interface Form34ACaptureFormProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    candidates: Form34ACandidate[];
    submitLabel?: string;
    onSubmit: (submission: Form34ASubmission) => void;
    /**
     * Extra gate beyond the built-in rule (a photo plus at least one vote).
     * Return false to keep the submit button disabled.
     */
    canSubmit?: (state: {
        votes: Record<string, number>;
        rejectedVotes: number;
        disputedVotes: number;
        hasImage: boolean;
    }) => boolean;
}

/**
 * Shared Form 34A capture + vote-entry sheet. Owns the camera, the per-candidate
 * vote inputs and the running total; the parent supplies the candidate list and
 * handles what happens on submit (API upload, counter-evidence check, ...).
 */
export function Form34ACaptureForm({
    visible,
    onClose,
    title,
    candidates,
    submitLabel = "Submit",
    onSubmit,
    canSubmit,
}: Form34ACaptureFormProps) {
    const {hasPermission, requestPermission} = useCameraPermission();
    const [showCamera, setShowCamera] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    /** Captured but not yet accepted — shown full-screen for review. */
    const [pendingImage, setPendingImage] = useState<string | null>(null);
    const [votes, setVotes] = useState<Record<string, number>>({});
    const [rejectedVotes, setRejectedVotes] = useState(0);
    const [disputedVotes, setDisputedVotes] = useState(0);
    const [wasVisible, setWasVisible] = useState(false);
    const device = useCameraDevice("back");
    const [aspect, setAspect] = useState<CaptureAspect>(DEFAULT_ASPECT);
    const photoOutput = usePhotoOutput({
        targetResolution: PHOTO_RESOLUTION[aspect],
        qualityPrioritization: "quality",
    });

    const capturingRef = React.useRef(false);

    const takePicture = React.useCallback(async () => {
        // A second capture while one is in flight throws, and the shutter is
        // tappable again the moment the first press is registered.
        if (capturingRef.current) return;
        capturingRef.current = true;
        try {
            // VisionCamera returns a bare filesystem path; the rest of the app
            // (and expo-file-system's `File`) expects a `file://` URI.
            const {filePath} = await photoOutput.capturePhotoToFile(
                {flashMode: "off"},
                {},
            );
            // Held for review rather than accepted outright: the citizen is
            // still standing in front of the form and able to retake, which is
            // the cheapest moment to catch a bad shot.
            setPendingImage(`file://${filePath}`);
            setShowCamera(false);
        } catch {
            // Swallow: the capture button stays available for a retry.
        } finally {
            capturingRef.current = false;
        }
    }, [photoOutput]);

    // Live capture-quality readout. The frame processor runs on the camera
    // thread at full rate, but only every Nth frame is measured and pushed to
    // React, so the preview never waits on us.
    const [quality, setQuality] = useState<FrameQuality | null>(null);

    // The camera is continuously auto-focusing and re-metering, so a single
    // good frame proves nothing. Camera timestamps measure a real two-second
    // run even when devices deliver or analyse frames at different rates.
    const [readiness, setReadiness] = useState<CaptureReadiness>(
        INITIAL_CAPTURE_READINESS,
    );
    const readinessRef = React.useRef(INITIAL_CAPTURE_READINESS);
    const smoothedRef = React.useRef<FrameQuality | null>(null);

    // At most one copied thumbnail may wait for the React Native thread. A
    // monotonically increasing token prevents an old callback from clearing a
    // newer session's in-flight marker after the camera is reopened.
    const frameCounter = useSharedValue(0);
    const analysisGeneration = useSharedValue(0);
    const analysisRequestSequence = useSharedValue(0);
    const analysisInFlightRequest = useSharedValue(0);

    // The form as OpenCV currently sees it, or null when no four-cornered
    // shape is in frame.
    const [document, setDocument] = useState<DetectedDocument | null>(null);

    // CALIBRATION — also stream readings to Metro so a run can be captured as
    // a series rather than read off the screen one frame at a time.
    const reportQuality = React.useCallback(
        (
            measured: FrameQuality,
            thumbnail: LumaThumbnail,
            timestampSeconds: number,
            generation: number,
            requestId: number,
        ) => {
            try {
                // A callback already queued when a camera session ended must
                // not restore stale guidance in a new session.
                if (generation !== analysisGeneration.get()) return;

                // OpenCV cannot run in the worklet, so edge detection happens
                // here on the JS thread, at the same throttled rate as metrics.
                const found = detectDocument(thumbnail);
                setDocument(found);

                // Smooth before judging: raw readings jitter enough to flip the
                // banner several times a second.
                const smoothed = smoothQuality(smoothedRef.current, measured);
                smoothedRef.current = smoothed;
                setQuality(smoothed);

                const covers =
                    !!found &&
                    found.areaFraction >= MIN_DOCUMENT_COVERAGE &&
                    found.aspectRatio >= MIN_DOCUMENT_ASPECT &&
                    found.aspectRatio <= MAX_DOCUMENT_ASPECT;

                // Off by default. Frame readings are the only way to calibrate
                // thresholds against a real printed form, so the capability
                // stays — but it prints several lines a second.
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

                // Both gates must hold: the image has to be legible *and* show
                // the whole form. Either alone passes on a perfect close-up.
                const transition = advanceCaptureReadiness(
                    readinessRef.current,
                    assessQuality(smoothed).ok && covers,
                    timestampSeconds,
                );
                readinessRef.current = transition.state;
                setReadiness(transition.state);

                // A tap the moment the shutter appears, so it can be felt
                // without watching the screen while holding a form steady.
                if (transition.becameReady) {
                    Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Success,
                    );
                }
            } finally {
                // An invalidated callback cannot clear a newer request's token.
                if (analysisInFlightRequest.get() === requestId) {
                    analysisInFlightRequest.set(0);
                }
            }
        },
        [analysisGeneration, analysisInFlightRequest],
    );

    const rawAssessment = quality ? assessQuality(quality) : null;

    // Framing is reported before lighting or focus: there is no point telling
    // someone to hold steady if the form is not in the shot at all.
    const covered =
        !!document &&
        document.areaFraction >= MIN_DOCUMENT_COVERAGE &&
        document.aspectRatio >= MIN_DOCUMENT_ASPECT &&
        document.aspectRatio <= MAX_DOCUMENT_ASPECT;
    // Portrait: a 4:3 sensor frame shown upright is 3 wide by 4 tall.
    const previewAspect = aspect === "4:3" ? 3 / 4 : 9 / 16;

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

    /** The shutter is offered only once the shot has held up for a while. */
    const readyToCapture = readiness.ready;

    // Amber the moment the frame is usable, green once it has held long enough
    // that the shutter is available — so the colour and the button agree.
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

                const planes = frame.getPlanes();
                if (planes.length === 0) return;

                // Plane 0 of a YUV frame is luma, which is all these metrics need.
                const luma = planes[0];
                const bytes = new Uint8Array(luma.getPixelBuffer());
                const measured = analyseLumaPlane(
                    bytes,
                    luma.width,
                    luma.height,
                    luma.bytesPerRow,
                );
                // Copied before the frame is disposed, since the thumbnail
                // outlives this callback.
                const thumbnail = extractLumaThumbnail(
                    bytes,
                    luma.width,
                    luma.height,
                    luma.bytesPerRow,
                    DETECTION_WIDTH,
                    frame.orientation === "left" || frame.orientation === "right",
                );
                analysisRequestSequence.value += 1;
                const requestId = analysisRequestSequence.value;
                const generation = analysisGeneration.value;
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
                // Must always release the frame or the pipeline stalls.
                frame.dispose();
            }
        },
    });

    // Reset the form each time the sheet opens (render-phase state adjustment).
    if (visible && !wasVisible) {
        setWasVisible(true);
        setVotes({});
        setRejectedVotes(0);
        setDisputedVotes(0);
        setCapturedImage(null);
        setPendingImage(null);
        setShowCamera(false);
    } else if (!visible && wasVisible) {
        setWasVisible(false);
    }

    const getVote = (key: string) => votes[key] ?? 0;

    const setVote = (key: string, value: number) =>
        setVotes((prev) => ({...prev, [key]: value}));

    const total =
        Object.values(votes).reduce((sum, v) => sum + (v || 0), 0) +
        rejectedVotes +
        disputedVotes;

    const hasVotes = Object.values(votes).some((v) => v > 0);
    const extraGate = canSubmit
        ? canSubmit({votes, rejectedVotes, disputedVotes, hasImage: !!capturedImage})
        : true;
    const submitEnabled = !!capturedImage && hasVotes && extraGate;

    const invalidateAnalysis = React.useCallback(() => {
        analysisGeneration.set((generation) => generation + 1);
        analysisInFlightRequest.set(0);
    }, [analysisGeneration, analysisInFlightRequest]);

    const resetAnalysis = React.useCallback(() => {
        invalidateAnalysis();
        setQuality(null);
        setDocument(null);
        smoothedRef.current = null;
        readinessRef.current = INITIAL_CAPTURE_READINESS;
        setReadiness(INITIAL_CAPTURE_READINESS);
    }, [invalidateAnalysis]);

    React.useEffect(() => {
        if (!visible || !showCamera) invalidateAnalysis();
    }, [invalidateAnalysis, showCamera, visible]);

    // Clear the previous run's readings so a stale good period can't offer the
    // shutter the instant the camera reopens for a retake.
    const openCamera = () => {
        resetAnalysis();
        setShowCamera(true);
    };

    const parseCount = (text: string) => {
        const clean = text.replace(/[^0-9]/g, "");
        return clean === "" ? 0 : Number(clean);
    };

    if (!hasPermission) {
        return (
            <Modal
                visible={visible}
                animationType="slide"
                transparent
                statusBarTranslucent
            >
                <SafeAreaProvider>
                    <View style={styles.permissionOverlay}>
                        <SafeAreaView style={styles.permissionSafeArea}>
                            <View style={styles.permissionContainer}>
                                <View style={styles.permissionCard}>
                                    <Text style={styles.permissionText}>
                                        We need camera permission to capture Form 34A
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.permissionButton}
                                        onPress={requestPermission}
                                    >
                                        <Text style={styles.permissionButtonText}>
                                            Grant Permission
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.permissionCancelButton}
                                        onPress={onClose}
                                    >
                                        <Text style={styles.cancelButtonText}>
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </SafeAreaView>
                    </View>
                </SafeAreaProvider>
            </Modal>
        );
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            statusBarTranslucent={Platform.OS === "android"}
        >
            <SafeAreaProvider>
                <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={16} color={perk.ink} />
                        </TouchableOpacity>
                    </View>

                    {pendingImage ? (
                        <View style={styles.reviewContainer}>
                            {/* Same aspect box as the preview, so the photo is
                                shown at the framing the citizen just composed
                                rather than rescaled into a taller container. */}
                            <View style={styles.reviewImageFrame}>
                                <Image
                                    source={{uri: pendingImage}}
                                    style={[
                                        styles.reviewImage,
                                        {aspectRatio: previewAspect},
                                    ]}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={styles.reviewPrompt}>
                                Can you read every vote number?
                            </Text>
                            <View style={styles.reviewControls}>
                                <TouchableOpacity
                                    style={styles.reviewRetake}
                                    onPress={() => {
                                        setPendingImage(null);
                                        openCamera();
                                    }}
                                >
                                    <Text style={styles.cancelButtonText}>Retake</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.reviewAccept}
                                    onPress={() => {
                                        setCapturedImage(pendingImage);
                                        setPendingImage(null);
                                    }}
                                >
                                    <Check size={18} color={perk.limeInk} />
                                    <Text style={styles.submitButtonText}>
                                        Use this photo
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : showCamera ? (
                        <View style={styles.cameraContainer}>
                            <TouchableOpacity
                                style={styles.aspectToggle}
                                onPress={() =>
                                    setAspect(aspect === "4:3" ? "16:9" : "4:3")
                                }
                            >
                                <Text style={styles.aspectToggleText}>{aspect}</Text>
                            </TouchableOpacity>
                            {/* Locked to the capture aspect so the brackets sit
                                over the frame itself, not the letterboxing.
                                Screen shapes vary widely between handsets; the
                                frame's shape does not. */}
                            <View
                                style={[styles.preview, {aspectRatio: previewAspect}]}
                            >
                                {device && (
                                    <Camera
                                        style={styles.camera}
                                        device={device}
                                        isActive={visible && showCamera}
                                        outputs={[photoOutput, frameOutput]}
                                        // The default, 'cover', crops the 4:3 frame
                                        // to fill a tall screen, so the citizen
                                        // frames against less than the camera
                                        // actually records. Showing the whole field
                                        // of view is what makes the brackets mean
                                        // anything.
                                        resizeMode="contain"
                                    />
                                )}
                                <FramingBracket state={bracketState} />
                            </View>
                            {assessment && (
                                <View
                                    style={[
                                        styles.qualityBanner,
                                        assessment.ok
                                            ? styles.qualityBannerOk
                                            : styles.qualityBannerBad,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.qualityLabel,
                                            assessment.ok
                                                ? styles.qualityLabelOk
                                                : styles.qualityLabelBad,
                                        ]}
                                    >
                                        {assessment.label}
                                    </Text>
                                    {!!assessment.hint && (
                                        <Text style={styles.qualityHint}>
                                            {assessment.hint}
                                        </Text>
                                    )}
                                </View>
                            )}
                            {/* CALIBRATION readout — remove once thresholds are set. */}
                            {quality && (
                                <View style={styles.qualityReadout}>
                                    <Text style={styles.qualityText}>
                                        {`bright ${quality.brightness.toFixed(0)}  ` +
                                            `sharp ${quality.sharpness.toFixed(0)}  ` +
                                            `glare ${(quality.glare * 100).toFixed(1)}%  ` +
                                            `doc ${
                                                document
                                                    ? `${(document.areaFraction * 100).toFixed(0)}%/${document.bestPointCount}pt`
                                                    : "—"
                                            }`}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.cameraControls}>
                                {readyToCapture && !!device ? (
                                    <TouchableOpacity
                                        style={styles.captureButton}
                                        onPress={takePicture}
                                    >
                                        <CameraIcon size={32} color={perk.limeInk} />
                                    </TouchableOpacity>
                                ) : (
                                    // A placeholder rather than nothing, so the
                                    // shutter appears in place instead of the
                                    // controls jumping when it becomes available.
                                    <View style={styles.captureButtonWaiting} />
                                )}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.body}>
                            <ScrollView
                                style={styles.content}
                                contentContainerStyle={styles.contentInner}
                                showsVerticalScrollIndicator={false}
                            >
                                <Text style={styles.sectionLabel}>
                                    CAPTURE FORM 34A
                                </Text>
                                {capturedImage ? (
                                    <View style={styles.capturedRow}>
                                        <Text style={styles.capturedText}>
                                            ✓ Form 34A captured
                                        </Text>
                                        <TouchableOpacity onPress={openCamera}>
                                            <Text style={styles.recaptureText}>
                                                Retake
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.cameraButton}
                                        onPress={openCamera}
                                    >
                                        <CameraIcon size={16} color={perk.lime} />
                                        <Text style={styles.cameraButtonText}>
                                            Capture Form 34A
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                <Text style={[styles.sectionLabel, {marginTop: 18}]}>
                                    ENTER VOTE DATA
                                </Text>
                                {candidates.map((candidate) => {
                                    const value = getVote(candidate.key);
                                    return (
                                        <View
                                            key={candidate.key}
                                            style={styles.voteRow}
                                        >
                                            <View style={styles.voteWho}>
                                                <Text
                                                    style={styles.voteName}
                                                    numberOfLines={1}
                                                >
                                                    {candidate.name}
                                                </Text>
                                                {!!candidate.party && (
                                                    <Text
                                                        style={styles.voteParty}
                                                        numberOfLines={1}
                                                    >
                                                        {candidate.party}
                                                    </Text>
                                                )}
                                            </View>
                                            <TextInput
                                                style={[
                                                    styles.vbox,
                                                    value > 0 && styles.vboxSet,
                                                ]}
                                                value={value === 0 ? "" : String(value)}
                                                onChangeText={(t) =>
                                                    setVote(
                                                        candidate.key,
                                                        parseCount(t),
                                                    )
                                                }
                                                placeholder="0"
                                                placeholderTextColor={perk.mute2}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    );
                                })}

                                <View style={styles.voteRow}>
                                    <View style={styles.voteWho}>
                                        <Text style={styles.voteName}>
                                            Rejected votes
                                        </Text>
                                    </View>
                                    <TextInput
                                        style={[
                                            styles.vbox,
                                            rejectedVotes > 0 && styles.vboxSet,
                                        ]}
                                        value={
                                            rejectedVotes === 0
                                                ? ""
                                                : String(rejectedVotes)
                                        }
                                        onChangeText={(t) =>
                                            setRejectedVotes(parseCount(t))
                                        }
                                        placeholder="0"
                                        placeholderTextColor={perk.mute2}
                                        keyboardType="numeric"
                                    />
                                </View>

                                <View style={styles.voteRow}>
                                    <View style={styles.voteWho}>
                                        <Text style={styles.voteName}>
                                            Disputed votes
                                        </Text>
                                    </View>
                                    <TextInput
                                        style={[
                                            styles.vbox,
                                            disputedVotes > 0 && styles.vboxSet,
                                        ]}
                                        value={
                                            disputedVotes === 0
                                                ? ""
                                                : String(disputedVotes)
                                        }
                                        onChangeText={(t) =>
                                            setDisputedVotes(parseCount(t))
                                        }
                                        placeholder="0"
                                        placeholderTextColor={perk.mute2}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </ScrollView>

                            {/* Floating footer sheet */}
                            <View style={styles.footer}>
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Total votes</Text>
                                    <Text style={styles.totalValue}>
                                        {total.toLocaleString()}
                                    </Text>
                                </View>
                                <View style={styles.footerButtons}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={onClose}
                                    >
                                        <Text style={styles.cancelButtonText}>
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.submitButton,
                                            !submitEnabled && styles.disabledButton,
                                        ]}
                                        disabled={!submitEnabled}
                                        onPress={() =>
                                            onSubmit({
                                                image: capturedImage as string,
                                                votes,
                                                rejectedVotes,
                                                disputedVotes,
                                                total,
                                            })
                                        }
                                    >
                                        <Check size={18} color={perk.limeInk} />
                                        <Text style={styles.submitButtonText}>
                                            {submitLabel}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </SafeAreaView>
            </SafeAreaProvider>
        </Modal>
    );
}

export default Form34ACaptureForm;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: perk.card,
    },
    // Permission
    permissionOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(13,13,13,0.85)",
    },
    permissionSafeArea: {flex: 1},
    permissionContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 16,
    },
    permissionCard: {
        width: "100%",
        maxWidth: 400,
        backgroundColor: perk.card,
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
    },
    permissionText: {
        fontSize: 18,
        color: perk.ink,
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 24,
    },
    permissionButton: {
        backgroundColor: perk.lime,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        marginBottom: 16,
        width: "100%",
        alignItems: "center",
    },
    permissionButtonText: {
        color: perk.limeInk,
        fontSize: 16,
        fontWeight: "800",
    },
    permissionCancelButton: {
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: perk.surface,
        alignItems: "center",
        width: "100%",
    },
    // Header
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: perk.card,
    },
    title: {
        fontSize: 19,
        fontWeight: "900",
        letterSpacing: -0.4,
        color: perk.ink,
    },
    closeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: perk.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    qualityBanner: {
        position: "absolute",
        top: 14,
        alignSelf: "center",
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 12,
        alignItems: "center",
        maxWidth: "88%",
    },
    qualityBannerOk: {backgroundColor: perk.lime},
    qualityBannerBad: {backgroundColor: perk.coralDeep},
    qualityLabel: {
        fontSize: 14,
        fontWeight: "900",
        letterSpacing: -0.2,
    },
    qualityLabelOk: {color: perk.limeInk},
    qualityLabelBad: {color: perk.card},
    qualityHint: {
        fontSize: 11.5,
        fontWeight: "700",
        color: perk.card,
        marginTop: 2,
        textAlign: "center",
    },
    // CALIBRATION readout — remove once thresholds are set.
    qualityReadout: {
        position: "absolute",
        top: 74,
        alignSelf: "center",
        backgroundColor: "rgba(13,13,13,0.75)",
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 8,
    },
    qualityText: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 11,
        fontWeight: "700",
        color: perk.lime,
    },
    // Review
    reviewContainer: {
        flex: 1,
        paddingHorizontal: 12,
        paddingBottom: 12,
    },
    reviewImageFrame: {
        flex: 1,
        justifyContent: "center",
    },
    reviewImage: {
        width: "100%",
        borderRadius: 12,
        backgroundColor: perk.ink,
    },
    reviewPrompt: {
        fontSize: 13,
        fontWeight: "800",
        color: perk.ink,
        textAlign: "center",
        marginTop: 12,
    },
    reviewControls: {
        flexDirection: "row",
        gap: 8,
        marginTop: 10,
    },
    reviewRetake: {
        flex: 0.7,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: perk.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    reviewAccept: {
        flex: 1.3,
        flexDirection: "row",
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: perk.lime,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    // Camera
    cameraContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: perk.ink,
    },
    preview: {
        width: "100%",
        maxHeight: "100%",
    },
    aspectToggle: {
        position: "absolute",
        top: 14,
        right: 14,
        zIndex: 2,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: "rgba(13,13,13,0.6)",
    },
    aspectToggleText: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 12,
        fontWeight: "700",
        color: perk.lime,
    },
    camera: {flex: 1},
    cameraControls: {
        position: "absolute",
        bottom: 50,
        left: 0,
        right: 0,
        alignItems: "center",
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: perk.lime,
        justifyContent: "center",
        alignItems: "center",
    },
    captureButtonWaiting: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.35)",
    },
    // Body
    body: {flex: 1},
    content: {flex: 1},
    contentInner: {
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 16,
    },
    sectionLabel: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1.8,
        color: perk.mute,
        marginBottom: 10,
    },
    cameraButton: {
        flexDirection: "row",
        backgroundColor: perk.ink,
        paddingVertical: 13,
        paddingHorizontal: 24,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    cameraButtonText: {
        color: perk.lime,
        fontSize: 13,
        fontWeight: "800",
    },
    capturedRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: perk.mint,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    capturedText: {
        fontSize: 13,
        color: perk.greenDeep,
        fontWeight: "800",
    },
    recaptureText: {
        color: perk.copperDeep,
        fontSize: 13,
        fontWeight: "800",
        textDecorationLine: "underline",
    },
    voteRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: perk.rule08,
    },
    voteWho: {
        flex: 1,
        paddingRight: 12,
    },
    voteName: {
        fontSize: 12.5,
        fontWeight: "800",
        color: perk.ink,
    },
    voteParty: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 9,
        color: perk.mute,
        letterSpacing: 0.6,
        marginTop: 1,
        textTransform: "uppercase",
    },
    vbox: {
        width: 52,
        height: 34,
        borderWidth: 1.5,
        borderColor: perk.rule16,
        borderRadius: 9,
        paddingHorizontal: 4,
        fontFamily: "SpaceMono-Regular",
        fontSize: 12,
        fontWeight: "700",
        textAlign: "center",
        color: perk.mute2,
        backgroundColor: perk.card,
    },
    vboxSet: {
        borderColor: perk.ink,
        color: perk.ink,
    },
    // Floating footer
    footer: {
        backgroundColor: perk.card,
        borderWidth: 1.5,
        borderColor: perk.ink,
        borderRadius: 16,
        marginHorizontal: 12,
        marginBottom: 12,
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 12,
        shadowColor: perk.ink,
        shadowOffset: {width: 0, height: 10},
        shadowOpacity: 0.12,
        shadowRadius: 18,
        elevation: 10,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: "800",
        color: perk.ink,
    },
    totalValue: {
        fontSize: 20,
        fontWeight: "900",
        color: perk.coralDeep,
    },
    footerButtons: {
        flexDirection: "row",
        gap: 8,
        marginTop: 10,
    },
    cancelButton: {
        flex: 0.7,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: perk.surface,
        alignItems: "center",
    },
    cancelButtonText: {
        color: perk.ink,
        fontSize: 13,
        fontWeight: "800",
    },
    submitButton: {
        flex: 1.3,
        flexDirection: "row",
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: perk.lime,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    submitButtonText: {
        color: perk.limeInk,
        fontSize: 13,
        fontWeight: "800",
    },
    disabledButton: {
        backgroundColor: perk.paperDeep,
    },
});
