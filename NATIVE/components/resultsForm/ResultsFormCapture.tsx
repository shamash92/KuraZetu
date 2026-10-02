import {
    Linking,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {X} from "lucide-react-native";
import {
    CommonResolutions,
    Size,
    useCameraDevice,
    useCameraPermission,
    usePhotoOutput,
} from "react-native-vision-camera";
import React, {useState} from "react";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import {type Image as NitroImageHandle} from "react-native-nitro-image";
import {
    type BarcodeScanner,
    createBarcodeScanner,
} from "react-native-vision-camera-barcode-scanner";

import {File} from "expo-file-system";

import {LiveCameraPane} from "./camera/LiveCameraPane";
import {CameraPermissionModal} from "./camera/PermissionModal";
import {getCameraPermissionRecovery} from "./camera/cameraPermission";
import {CaptureAspect, useFrameAnalysis} from "./camera/useFrameAnalysis";
import {VoteEntryPane} from "./entry/VoteEntryPane";
import {RESULTS_FORMS} from "./resultsForms";
import {PhotoReviewPane} from "./review/PhotoReviewPane";
import {readFormQr} from "./review/formQr";
import {type StreamCheck, checkStream} from "./review/streamCheck";
import {CaptureTips} from "./tips/CaptureTips";
import {perk} from "@/app/_utils/colors";
import type {TLevelTabs} from "@/app/types";

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

/**
 * The largest photo the sensor offers at each aspect. VisionCamera settles on
 * the closest size the device supports, so this is the full sensor wherever
 * it is available: every extra pixel lands on handwritten vote figures.
 */
const PHOTO_RESOLUTION: Record<CaptureAspect, Size> = {
    "16:9": CommonResolutions.HIGHEST_16_9,
    "4:3": CommonResolutions.HIGHEST_4_3,
};

/** A bounded in-memory image for the full-screen review step. */
const REVIEW_PREVIEW_RESOLUTION: Record<CaptureAspect, Size> = {
    "16:9": CommonResolutions.HD_16_9,
    "4:3": CommonResolutions.HD_4_3,
};

function deleteTemporaryPhoto(uri: string | null) {
    if (!uri) return;

    try {
        const file = new File(uri);
        if (file.exists) file.delete();
    } catch (error) {
        // Cleanup failure must not prevent closing or retaking. The OS can
        // still reclaim VisionCamera's temporary directory later.
        console.warn("[form34a] temporary photo cleanup failed", error);
    }
}

/**
 * How long the QR may take before the photo is treated as unread, so a stalled
 * scan can never keep the citizen waiting at the form.
 */
const QR_CHECK_TIMEOUT_MS = 8000;

/**
 * Unread photos before "Use this photo" is offered anyway. The QR is a check,
 * not a gate: a torn, stamped or glared code must never lock anyone out.
 */
const UNREAD_PHOTOS_BEFORE_OVERRIDE = 2;

/** Read the QR from the captured photo and compare it with the selected stream. */
async function checkCapturedStream(
    scanner: BarcodeScanner,
    filePath: string,
    stationCode: string,
    level: TLevelTabs,
): Promise<StreamCheck> {
    try {
        const timeout = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), QR_CHECK_TIMEOUT_MS),
        );
        const reading = await Promise.race([
            readFormQr(scanner, filePath),
            timeout,
        ]);
        console.log(
            `[form34a] captured QR=${reading?.value ?? "none"} ` +
                `via=${reading?.source ?? "timeout"} station=${stationCode}`,
        );
        return checkStream(reading?.value ?? null, stationCode, level);
    } catch (error) {
        console.warn("[form34a] QR scan failed", error);
        return {kind: "unread"};
    }
}

export interface ResultsFormCandidate {
    key: string;
    name: string;
    party?: string | null;
}

interface ResultsFormSubmission {
    image: string;
    votes: Record<string, number>;
    rejectedVotes: number;
    disputedVotes: number;
    total: number;
}

interface ResultsFormCaptureProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    candidates: ResultsFormCandidate[];
    /** The race being captured; each has its own form and QR series. */
    level: TLevelTabs;
    /**
     * Code of the polling station (stream) selected before capture. When set,
     * each photo's QR is checked against it before the photo can be used.
     */
    stationCode?: string;
    /**
     * Return to the centre's list of streams, offered when the photo's QR
     * names another stream at the same centre.
     */
    onChooseStream?: () => void;
    submitLabel?: string;
    onSubmit: (submission: ResultsFormSubmission) => void;
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
 * Shared results form capture + vote-entry sheet, for any level. Owns the
 * camera, the per-candidate vote inputs and the running total; the parent
 * supplies the candidate list and handles what happens on submit (API upload,
 * counter-evidence check, ...).
 */
export function ResultsFormCapture({
    visible,
    onClose,
    title,
    candidates,
    level,
    stationCode,
    onChooseStream,
    submitLabel = "Submit",
    onSubmit,
    canSubmit,
}: ResultsFormCaptureProps) {
    const formName = RESULTS_FORMS[level].name;
    const {hasPermission, canRequestPermission, requestPermission} =
        useCameraPermission();
    const [showCamera, setShowCamera] = useState(false);
    /** The capture tip on screen; null when the tips are not showing. */
    const [tipStep, setTipStep] = useState<number | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    /** Captured but not yet accepted — shown full-screen for review. */
    const [pendingImage, setPendingImage] = useState<string | null>(null);
    const [pendingPreview, setPendingPreview] =
        useState<NitroImageHandle | null>(null);
    const [votes, setVotes] = useState<Record<string, number>>({});
    const [rejectedVotes, setRejectedVotes] = useState(0);
    const [disputedVotes, setDisputedVotes] = useState(0);
    const [wasVisible, setWasVisible] = useState(false);
    const device = useCameraDevice("back");
    const [aspect, setAspect] = useState<CaptureAspect>(DEFAULT_ASPECT);
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [captureError, setCaptureError] = useState<string | null>(null);
    /** The pending photo's QR against the selected stream; null when unchecked. */
    const [streamCheck, setStreamCheck] = useState<
        StreamCheck | "checking" | null
    >(null);
    const [unreadPhotos, setUnreadPhotos] = useState(0);
    const photoOutput = usePhotoOutput({
        targetResolution: PHOTO_RESOLUTION[aspect],
        // JPEG on both platforms. The default is each platform's own format,
        // which is HEIC on iPhone: most browsers cannot show it, and neither
        // Pillow nor OpenCV can open it without an extra library.
        containerFormat: "jpeg",
        quality: 1.0,
        qualityPrioritization: "quality",
        previewImageTargetSize: REVIEW_PREVIEW_RESOLUTION[aspect],
    });

    const qrScanner = React.useMemo(
        () => createBarcodeScanner({barcodeFormats: ["qr-code"]}),
        [],
    );

    const capturingRef = React.useRef(false);
    const captureGenerationRef = React.useRef(0);
    const pendingImageRef = React.useRef<string | null>(null);
    const capturedImageRef = React.useRef<string | null>(null);

    // A Nitro Image owns native memory. Release the previous preview only
    // after React commits the replacement, so the native view never receives
    // an already-disposed image.
    React.useEffect(() => {
        return () => {
            // Development builds deep-freeze every prop handed to a native
            // view, and disposing a frozen image throws. Leave that one to
            // garbage collection; release builds never freeze, so they always
            // dispose, and any other failure still surfaces.
            if (pendingPreview && !Object.isFrozen(pendingPreview)) {
                pendingPreview.dispose();
            }
        };
    }, [pendingPreview]);

    const releaseOwnedPhotos = React.useCallback(() => {
        const pending = pendingImageRef.current;
        const captured = capturedImageRef.current;
        pendingImageRef.current = null;
        capturedImageRef.current = null;

        deleteTemporaryPhoto(pending);
        if (captured !== pending) deleteTemporaryPhoto(captured);
    }, []);

    const takePicture = React.useCallback(async () => {
        // A second capture while one is in flight throws, and the shutter is
        // tappable again the moment the first press is registered.
        if (capturingRef.current) return;
        capturingRef.current = true;
        setCaptureError(null);
        const captureGeneration = captureGenerationRef.current;
        const preview = {current: null as NitroImageHandle | null};
        try {
            // VisionCamera returns a bare filesystem path; the rest of the app
            // (and expo-file-system's `File`) expects a `file://` URI.
            const {filePath} = await photoOutput.capturePhotoToFile(
                {flashMode: "off"},
                {
                    onPreviewImageAvailable(image) {
                        preview.current?.dispose();
                        preview.current = image;
                    },
                },
            );
            const uri = `file://${filePath}`;

            // The form may have closed or changed camera configuration while
            // native capture was still finishing. Delete that late result
            // rather than restoring it into an expired session.
            if (captureGeneration !== captureGenerationRef.current) {
                deleteTemporaryPhoto(uri);
                return;
            }

            // Not awaited: review opens at once while the QR is read. The
            // result only applies if this is still the photo under review.
            if (stationCode) {
                setStreamCheck("checking");
                checkCapturedStream(qrScanner, filePath, stationCode, level).then(
                    (check) => {
                        if (pendingImageRef.current !== uri) return;
                        if (check.kind === "unread") {
                            setUnreadPhotos((count) => count + 1);
                        }
                        setStreamCheck(check);
                    },
                );
            } else {
                setStreamCheck(null);
            }

            // Held for review rather than accepted outright: the citizen is
            // still standing in front of the form and able to retake, which is
            // the cheapest moment to catch a bad shot.
            deleteTemporaryPhoto(pendingImageRef.current);
            pendingImageRef.current = uri;
            setPendingImage(uri);
            setPendingPreview(preview.current);
            preview.current = null;
            setShowCamera(false);
        } catch (error) {
            console.warn("[form34a] photo capture failed", error);
            setCaptureError("The photo could not be saved. Please try again.");
        } finally {
            preview.current?.dispose();
            capturingRef.current = false;
        }
    }, [level, photoOutput, qrScanner, stationCode]);

    // Portrait: a 4:3 sensor frame shown upright is 3 wide by 4 tall.
    const previewAspect = aspect === "4:3" ? 3 / 4 : 9 / 16;
    const {
        assessment,
        bracketState,
        frameOutput,
        readyToCapture,
        resetAnalysis,
    } = useFrameAnalysis({
        active: visible && showCamera,
        aspect,
    });

    // Reset the form each time the sheet opens (render-phase state adjustment).
    if (visible && !wasVisible) {
        setWasVisible(true);
        setVotes({});
        setRejectedVotes(0);
        setDisputedVotes(0);
        setCapturedImage(null);
        setPendingImage(null);
        setPendingPreview(null);
        setShowCamera(false);
        setTipStep(null);
        setPermissionError(null);
        setCameraError(null);
        setCaptureError(null);
        setStreamCheck(null);
        setUnreadPhotos(0);
    } else if (!visible && wasVisible) {
        setWasVisible(false);
    }

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

    const submitForm = () => {
        if (!capturedImage) return;

        onSubmit({
            image: capturedImage,
            votes,
            rejectedVotes,
            disputedVotes,
            total,
        });
    };

    React.useEffect(() => {
        if (!visible) {
            captureGenerationRef.current += 1;
            releaseOwnedPhotos();
        }
    }, [releaseOwnedPhotos, visible]);

    React.useEffect(() => {
        return () => {
            captureGenerationRef.current += 1;
            releaseOwnedPhotos();
        };
    }, [releaseOwnedPhotos]);

    // Clear the previous run's readings so a stale good period can't offer the
    // shutter the instant the camera reopens for a retake.
    const openCamera = () => {
        resetAnalysis();
        setCameraError(null);
        setCaptureError(null);
        setShowCamera(true);
    };

    const finishTips = () => {
        setTipStep(null);
        openCamera();
    };

    // Back to vote entry; the generation bump drops a capture still finishing.
    const closeCamera = () => {
        captureGenerationRef.current += 1;
        setCaptureError(null);
        setShowCamera(false);
    };

    const discardPendingPhoto = () => {
        const uri = pendingImageRef.current;
        pendingImageRef.current = null;
        setPendingImage(null);
        setPendingPreview(null);
        setStreamCheck(null);
        deleteTemporaryPhoto(uri);
        openCamera();
    };

    // Unchecked, matching, or unread often enough that it must not block.
    const canUsePhoto =
        streamCheck === null ||
        (streamCheck !== "checking" &&
            (streamCheck.kind === "match" ||
                (streamCheck.kind === "unread" &&
                    unreadPhotos >= UNREAD_PHOTOS_BEFORE_OVERRIDE)));

    const acceptPendingPhoto = () => {
        const uri = pendingImageRef.current;
        if (!uri || !canUsePhoto) return;

        deleteTemporaryPhoto(capturedImageRef.current);
        capturedImageRef.current = uri;
        pendingImageRef.current = null;
        setCapturedImage(uri);
        setPendingImage(null);
        setPendingPreview(null);
        setStreamCheck(null);
    };

    const closeForm = () => {
        captureGenerationRef.current += 1;
        setPendingPreview(null);
        releaseOwnedPhotos();
        onClose();
    };

    // The photo belongs to another stream: leave this form so the citizen can
    // pick the right stream from the centre's list.
    const chooseStream = onChooseStream
        ? () => {
              closeForm();
              onChooseStream();
          }
        : undefined;

    const toggleAspect = () => {
        captureGenerationRef.current += 1;
        resetAnalysis();
        setCaptureError(null);
        setAspect((current) => (current === "4:3" ? "16:9" : "4:3"));
    };

    const handleCameraError = React.useCallback(
        (error: Error) => {
            console.warn("[form34a] camera session failed", error);
            captureGenerationRef.current += 1;
            resetAnalysis();
            setCameraError("The camera stopped unexpectedly.");
            setCaptureError(null);
        },
        [resetAnalysis],
    );

    const permissionRecovery = getCameraPermissionRecovery(canRequestPermission);
    const handlePermissionRecovery = React.useCallback(async () => {
        setPermissionError(null);
        try {
            if (permissionRecovery.action === "request") {
                const granted = await requestPermission();
                if (!granted) {
                    setPermissionError(
                        "Camera permission was not granted. Open Settings to enable it.",
                    );
                }
            } else {
                await Linking.openSettings();
            }
        } catch (error) {
            console.warn("[form34a] permission recovery failed", error);
            setPermissionError(
                permissionRecovery.action === "request"
                    ? "The permission request could not be opened. Please try again."
                    : "Settings could not be opened. Open this app in device Settings.",
            );
        }
    }, [permissionRecovery.action, requestPermission]);

    if (!hasPermission) {
        return (
            <CameraPermissionModal
                visible={visible}
                actionLabel={permissionRecovery.buttonLabel}
                error={permissionError}
                message={permissionRecovery.message}
                onClose={closeForm}
                onRecover={handlePermissionRecovery}
            />
        );
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            statusBarTranslucent={Platform.OS === "android"}
            onRequestClose={
                pendingImage
                    ? discardPendingPhoto
                    : showCamera
                      ? closeCamera
                      : tipStep !== null
                        ? () => setTipStep(tipStep > 0 ? tipStep - 1 : null)
                        : closeForm
            }
        >
            <SafeAreaProvider>
                <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
                    <View style={styles.header}>
                        <Text style={styles.title} accessibilityRole="header">
                            {title}
                        </Text>
                        <TouchableOpacity
                            onPress={closeForm}
                            style={styles.closeButton}
                            accessibilityRole="button"
                            accessibilityLabel="Close form"
                            hitSlop={7}
                        >
                            <X size={16} color={perk.ink} />
                        </TouchableOpacity>
                    </View>

                    {pendingImage ? (
                        <PhotoReviewPane
                            formName={formName}
                            imageUri={pendingImage}
                            preview={pendingPreview}
                            previewAspect={previewAspect}
                            streamCheck={streamCheck}
                            canUsePhoto={canUsePhoto}
                            onAccept={acceptPendingPhoto}
                            onRetake={discardPendingPhoto}
                            onChooseStream={chooseStream}
                            onGoBack={closeForm}
                        />
                    ) : showCamera ? (
                        <LiveCameraPane
                            active={visible && showCamera}
                            aspect={aspect}
                            assessment={assessment}
                            bracketState={bracketState}
                            cameraError={cameraError}
                            captureError={captureError}
                            device={device}
                            frameOutput={frameOutput}
                            photoOutput={photoOutput}
                            previewAspect={previewAspect}
                            readyToCapture={readyToCapture}
                            onCameraError={handleCameraError}
                            onCapture={takePicture}
                            onClose={closeCamera}
                            onRetry={openCamera}
                            onToggleAspect={toggleAspect}
                        />
                    ) : tipStep !== null ? (
                        <CaptureTips
                            step={tipStep}
                            onStepChange={setTipStep}
                            onFinish={finishTips}
                        />
                    ) : (
                        <VoteEntryPane
                            candidates={candidates}
                            captured={!!capturedImage}
                            formName={formName}
                            disputedVotes={disputedVotes}
                            rejectedVotes={rejectedVotes}
                            submitEnabled={submitEnabled}
                            submitLabel={submitLabel}
                            total={total}
                            votes={votes}
                            onCapture={() => setTipStep(0)}
                            onClose={closeForm}
                            onDisputedVotesChange={setDisputedVotes}
                            onRejectedVotesChange={setRejectedVotes}
                            onSubmit={submitForm}
                            onVoteChange={setVote}
                        />
                    )}
                </SafeAreaView>
            </SafeAreaProvider>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: perk.card,
    },
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
});
