import {
    Image,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
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
    usePhotoOutput,
} from "react-native-vision-camera";
import React, {useState} from "react";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import {
    NativeNitroImage,
    type Image as NitroImageHandle,
} from "react-native-nitro-image";

import {File} from "expo-file-system";

import {FramingBracket} from "./FramingBracket";
import {VoteCountRow} from "./VoteCountRow";
import {getCameraPermissionRecovery} from "./cameraPermission";
import {
    CaptureAspect,
    useForm34AFrameAnalysis,
} from "./useForm34AFrameAnalysis";
import {perk} from "@/app/_utils/colors";

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
    const {hasPermission, canRequestPermission, requestPermission} =
        useCameraPermission();
    const [showCamera, setShowCamera] = useState(false);
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
    const photoOutput = usePhotoOutput({
        targetResolution: PHOTO_RESOLUTION[aspect],
        qualityPrioritization: "quality",
        previewImageTargetSize: REVIEW_PREVIEW_RESOLUTION[aspect],
    });

    const capturingRef = React.useRef(false);
    const captureGenerationRef = React.useRef(0);
    const pendingImageRef = React.useRef<string | null>(null);
    const capturedImageRef = React.useRef<string | null>(null);

    // A Nitro Image owns native memory. Release the previous preview only
    // after React commits the replacement, so the native view never receives
    // an already-disposed image.
    React.useEffect(() => {
        return () => pendingPreview?.dispose();
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
    }, [photoOutput]);

    // Portrait: a 4:3 sensor frame shown upright is 3 wide by 4 tall.
    const previewAspect = aspect === "4:3" ? 3 / 4 : 9 / 16;
    const {
        assessment,
        bracketState,
        frameOutput,
        readyToCapture,
        resetAnalysis,
    } = useForm34AFrameAnalysis({
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
        setPermissionError(null);
        setCameraError(null);
        setCaptureError(null);
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

    const discardPendingPhoto = () => {
        const uri = pendingImageRef.current;
        pendingImageRef.current = null;
        setPendingImage(null);
        setPendingPreview(null);
        deleteTemporaryPhoto(uri);
        openCamera();
    };

    const acceptPendingPhoto = () => {
        const uri = pendingImageRef.current;
        if (!uri) return;

        deleteTemporaryPhoto(capturedImageRef.current);
        capturedImageRef.current = uri;
        pendingImageRef.current = null;
        setCapturedImage(uri);
        setPendingImage(null);
        setPendingPreview(null);
    };

    const closeForm = () => {
        captureGenerationRef.current += 1;
        setPendingPreview(null);
        releaseOwnedPhotos();
        onClose();
    };

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
                                        {permissionRecovery.message}
                                    </Text>
                                    {!!permissionError && (
                                        <Text
                                            style={styles.permissionError}
                                            accessibilityRole="alert"
                                        >
                                            {permissionError}
                                        </Text>
                                    )}
                                    <TouchableOpacity
                                        style={styles.permissionButton}
                                        onPress={handlePermissionRecovery}
                                        accessibilityRole="button"
                                    >
                                        <Text style={styles.permissionButtonText}>
                                            {permissionRecovery.buttonLabel}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.permissionCancelButton}
                                        onPress={closeForm}
                                        accessibilityRole="button"
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
                        <View style={styles.reviewContainer}>
                            {/* Same aspect box as the preview, so the photo is
                                shown at the framing the citizen just composed
                                rather than rescaled into a taller container. */}
                            <View style={styles.reviewImageFrame}>
                                {pendingPreview ? (
                                    <NativeNitroImage
                                        image={pendingPreview}
                                        style={[
                                            styles.reviewImage,
                                            {aspectRatio: previewAspect},
                                        ]}
                                        resizeMode="contain"
                                        accessible
                                        accessibilityLabel="Captured Form 34A preview"
                                    />
                                ) : (
                                    <Image
                                        source={{uri: pendingImage}}
                                        style={[
                                            styles.reviewImage,
                                            {aspectRatio: previewAspect},
                                        ]}
                                        resizeMode="contain"
                                        accessible
                                        accessibilityLabel="Captured Form 34A preview"
                                    />
                                )}
                            </View>
                            <Text style={styles.reviewPrompt}>
                                Can you read every vote number?
                            </Text>
                            <View style={styles.reviewControls}>
                                <TouchableOpacity
                                    style={styles.reviewRetake}
                                    onPress={discardPendingPhoto}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.cancelButtonText}>Retake</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.reviewAccept}
                                    onPress={acceptPendingPhoto}
                                    accessibilityRole="button"
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
                            {!cameraError && !!device && (
                                <TouchableOpacity
                                    style={styles.aspectToggle}
                                    onPress={toggleAspect}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Capture aspect ratio, ${aspect}`}
                                    accessibilityHint="Switches between 4 by 3 and 16 by 9"
                                    hitSlop={8}
                                >
                                    <Text style={styles.aspectToggleText}>
                                        {aspect}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            {/* Locked to the capture aspect so the brackets sit
                                over the frame itself, not the letterboxing.
                                Screen shapes vary widely between handsets; the
                                frame's shape does not. */}
                            <View
                                style={[styles.preview, {aspectRatio: previewAspect}]}
                            >
                                {device && !cameraError ? (
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
                                        onError={handleCameraError}
                                    />
                                ) : (
                                    <View
                                        style={styles.cameraFailure}
                                        accessibilityRole="alert"
                                    >
                                        <Text
                                            style={styles.cameraFailureTitle}
                                            accessibilityRole="header"
                                        >
                                            Camera unavailable
                                        </Text>
                                        <Text style={styles.cameraFailureText}>
                                            {cameraError ??
                                                "No back camera is available on this device."}
                                        </Text>
                                        <TouchableOpacity
                                            style={styles.cameraRetryButton}
                                            onPress={openCamera}
                                            accessibilityRole="button"
                                        >
                                            <Text style={styles.cameraRetryText}>
                                                Try again
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                {!cameraError && !!device && (
                                    <FramingBracket state={bracketState} />
                                )}
                            </View>
                            {captureError ? (
                                <View
                                    style={[
                                        styles.qualityBanner,
                                        styles.qualityBannerBad,
                                    ]}
                                    accessibilityRole="alert"
                                    accessibilityLiveRegion="polite"
                                >
                                    <Text
                                        style={[
                                            styles.qualityLabel,
                                            styles.qualityLabelBad,
                                        ]}
                                    >
                                        {captureError}
                                    </Text>
                                </View>
                            ) : assessment && !cameraError && device ? (
                                <View
                                    style={[
                                        styles.qualityBanner,
                                        assessment.ok
                                            ? styles.qualityBannerOk
                                            : styles.qualityBannerBad,
                                    ]}
                                    accessibilityRole="alert"
                                    accessibilityLiveRegion="polite"
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
                            ) : null}
                            <View style={styles.cameraControls}>
                                {readyToCapture && !!device && !cameraError ? (
                                    <TouchableOpacity
                                        style={styles.captureButton}
                                        onPress={takePicture}
                                        accessibilityRole="button"
                                        accessibilityLabel="Take photo"
                                        accessibilityHint="Captures Form 34A for review"
                                    >
                                        <CameraIcon size={32} color={perk.limeInk} />
                                    </TouchableOpacity>
                                ) : (
                                    // A placeholder rather than nothing, so the
                                    // shutter appears in place instead of the
                                    // controls jumping when it becomes available.
                                    <View
                                        style={styles.captureButtonWaiting}
                                        importantForAccessibility="no"
                                    />
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
                                        <TouchableOpacity
                                            onPress={openCamera}
                                            accessibilityRole="button"
                                            accessibilityLabel="Retake Form 34A photo"
                                            hitSlop={8}
                                        >
                                            <Text style={styles.recaptureText}>
                                                Retake
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.cameraButton}
                                        onPress={openCamera}
                                        accessibilityRole="button"
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
                                        <VoteCountRow
                                            key={candidate.key}
                                            label={candidate.name}
                                            party={candidate.party}
                                            value={value}
                                            accessibilityLabel={`Votes for ${candidate.name}`}
                                            onChange={(nextValue) =>
                                                setVote(candidate.key, nextValue)
                                            }
                                        />
                                    );
                                })}

                                <VoteCountRow
                                    label="Rejected votes"
                                    value={rejectedVotes}
                                    accessibilityLabel="Rejected votes"
                                    onChange={setRejectedVotes}
                                />

                                <VoteCountRow
                                    label="Disputed votes"
                                    value={disputedVotes}
                                    accessibilityLabel="Disputed votes"
                                    onChange={setDisputedVotes}
                                />
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
                                        onPress={closeForm}
                                        accessibilityRole="button"
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
                                        accessibilityRole="button"
                                        accessibilityState={{
                                            disabled: !submitEnabled,
                                        }}
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
    permissionError: {
        color: perk.coralDeep,
        fontSize: 13,
        fontWeight: "700",
        lineHeight: 18,
        marginTop: -12,
        marginBottom: 16,
        textAlign: "center",
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
    cameraFailure: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 28,
        backgroundColor: perk.ink,
    },
    cameraFailureTitle: {
        color: perk.card,
        fontSize: 18,
        fontWeight: "900",
        textAlign: "center",
    },
    cameraFailureText: {
        color: perk.paperDeep,
        fontSize: 13,
        fontWeight: "600",
        lineHeight: 19,
        marginTop: 8,
        textAlign: "center",
    },
    cameraRetryButton: {
        backgroundColor: perk.lime,
        borderRadius: 12,
        marginTop: 18,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    cameraRetryText: {
        color: perk.limeInk,
        fontSize: 13,
        fontWeight: "800",
    },
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
