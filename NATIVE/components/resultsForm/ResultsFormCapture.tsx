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
import {createBarcodeScanner} from "react-native-vision-camera-barcode-scanner";

import {File} from "expo-file-system";

import {LiveCameraPane} from "./camera/LiveCameraPane";
import {CameraPermissionModal} from "./camera/PermissionModal";
import type {LightSetting} from "./camera/captureGate";
import {getCameraPermissionRecovery} from "./camera/cameraPermission";
import {CaptureAspect, useFrameAnalysis} from "./camera/useFrameAnalysis";
import {VoteEntryPane} from "./entry/VoteEntryPane";
import {type VoteEntryState, useVoteEntry} from "./entry/useVoteEntry";
import {STREAM_VOTER_LIMIT} from "./entry/voteCount";
import {RESULTS_FORMS} from "./resultsForms";
import type {AgreementCheck, Reading} from "./reading/prefill";
import {AgreementPane} from "./reading/AgreementPane";
import {PhotoStepPane} from "./reading/PhotoStepPane";
import {ReadingPane} from "./reading/ReadingPane";
import {agreeAfterReading, startReading, useReading} from "./reading/readPhoto";
import {ChangedFormPane} from "./reading/ChangedFormPane";
import {SameResultsPane} from "./reading/SameResultsPane";
import {PhotoReviewPane} from "./review/PhotoReviewPane";
import {checkCapturedStream} from "./review/formQr";
import type {StreamCheck} from "./review/streamCheck";
import {CaptureTips} from "./tips/CaptureTips";
import {SubmitBlocked} from "./upload/SubmitBlocked";
import {useDeviceFix} from "./upload/useDeviceFix";
import {usePlaceCheck} from "./upload/usePlaceCheck";
import {apiBaseURL} from "@/app/_utils/apiBaseURL";
import {useAuthStore} from "@/app/_utils/auth/authStore";
import {useNetworkStatus} from "@/app/_utils/device/useNetworkStatus";
import {perk} from "@/app/_utils/colors";
import type {TLevelTabs} from "@/app/types";

import type {
    ReadingStep,
    ResultsFormAgreement,
    ResultsFormCandidate,
    ResultsFormPlace,
    ResultsFormSubmission,
} from "./types";

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
 * A 12 MP photo at each aspect. VisionCamera settles on the closest size the
 * device supports, so a phone with a smaller sensor still shoots at its full
 * resolution, while a 50–200 MP sensor stops at a size that stays readable
 * and uploads over a weak connection.
 */
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

/**
 * Unread photos before "Use this photo" is offered anyway. The QR is a check,
 * not a gate: a torn, stamped or glared code must never lock anyone out.
 */
const UNREAD_PHOTOS_BEFORE_OVERRIDE = 2;

/** Shown when there is no reading: the server could not be reached or failed. */
const NOT_READ = "The form could not be read. Type the results from the form.";
/** Shown when an agreeing photo has no outcome from the server. */
const NOT_CHECKED = "Your photo could not be checked.";

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
    /** Checks where the phone is after capture and at Submit, when given. */
    place?: ResultsFormPlace;
    /** The most votes the form can add up to; Submit is blocked above it. */
    maxVotes?: number;
    /**
     * Read the photo on the server before entry and prefill the boxes. Needs
     * stationCode.
     */
    readsPhoto?: boolean;
    /**
     * The earlier upload the person agrees with. The photo is compared with
     * it and read in full; nothing is typed unless the person disagrees.
     * Needs readsPhoto.
     */
    agreeWith?: string | null;
    /** Save the agreement. Needed with agreeWith. */
    onAgree?: (agreement: ResultsFormAgreement) => void;
    submitLabel?: string;
    /** The parent is uploading: Submit shows progress and ignores taps. */
    submitting?: boolean;
    onSubmit: (submission: ResultsFormSubmission) => void;
    /**
     * Extra gate beyond the built-in rule (a photo plus all three digits
     * typed in every box).
     * Return false to keep the submit button disabled.
     */
    canSubmit?: (state: VoteEntryState) => boolean;
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
    place,
    maxVotes = STREAM_VOTER_LIMIT,
    readsPhoto = false,
    agreeWith = null,
    onAgree,
    submitLabel = "Submit",
    submitting = false,
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
    const entry = useVoteEntry({
        candidates,
        maxVotes,
        hasImage: !!capturedImage,
        canSubmit,
    });
    const [wasVisible, setWasVisible] = useState(false);
    const device = useCameraDevice("back");
    const [aspect, setAspect] = useState<CaptureAspect>(DEFAULT_ASPECT);
    /** Starts at Off for each form; kept across retakes until the form closes. */
    const [light, setLight] = useState<LightSetting>("off");
    const hasTorch = !!device?.hasTorch;
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [captureError, setCaptureError] = useState<string | null>(null);
    /** The pending photo's QR against the selected stream; null when unchecked. */
    const [streamCheck, setStreamCheck] = useState<
        StreamCheck | "checking" | null
    >(null);
    const [unreadPhotos, setUnreadPhotos] = useState(0);
    const [readingStep, setReadingStep] = useState<ReadingStep | null>(null);
    /** Tapped Disagree: later photos are read for typing, not compared. */
    const [disagreed, setDisagreed] = useState(false);
    /** Chose to agree once the reading showed an earlier upload's results. */
    const [agreedAfter, setAgreedAfter] = useState<string | null>(null);
    const [startingAgreement, setStartingAgreement] = useState(false);
    const agreeTarget = agreeWith ?? agreedAfter;
    const agreeing = !!agreeTarget && !disagreed;
    const {userToken} = useAuthStore();
    const photoOutput = usePhotoOutput({
        targetResolution: PHOTO_RESOLUTION[aspect],
        // JPEG on both platforms. The default is each platform's own format,
        // which is HEIC on iPhone: most browsers cannot show it, and neither
        // Pillow nor OpenCV can open it without an extra library.
        containerFormat: "jpeg",
        // 0.9 keeps every pixel at about half the file size of 1.0 (about
        // 5 MB instead of 10 MB), so the upload takes half as long.
        quality: 0.9,
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
    const pendingQualityCheckedRef = React.useRef(true);
    const capturedQualityCheckedRef = React.useRef(true);
    const pendingCapturedAtRef = React.useRef<string | null>(null);
    const capturedAtRef = React.useRef<string | null>(null);

    // Uploads need internet and the phone's location; locating starts as the
    // screen opens so an indoor phone has time to get a precise fix.
    const network = useNetworkStatus();
    const location = useDeviceFix(visible);
    const placeCheck = usePlaceCheck(place, location.fix);
    const blockReason =
        network === "offline"
            ? "offline"
            : location.permission === "denied"
              ? "location"
              : null;

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

    const takePicture = React.useCallback(async (qualityChecked: boolean) => {
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
            pendingQualityCheckedRef.current = qualityChecked;
            pendingCapturedAtRef.current = new Date().toISOString();
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
    const {frameOutput, resetAnalysis, view} = useFrameAnalysis({
        active: visible && showCamera,
        aspect,
        light: hasTorch ? light : null,
    });

    // Reset the form each time the sheet opens (render-phase state adjustment).
    if (visible && !wasVisible) {
        setWasVisible(true);
        entry.clear();
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
        placeCheck.reset();
        setReadingStep(null);
        setLight("off");
    } else if (!visible && wasVisible) {
        setWasVisible(false);
        setReadingStep(null);
    }

    const submitForm = () => {
        if (!capturedImage) return;

        placeCheck.sendWhereAllowed(() =>
            onSubmit({
                image: capturedImage,
                qualityChecked: capturedQualityCheckedRef.current,
                votes: entry.counts,
                rejectedVotes: entry.rejected,
                disputedVotes: entry.disputed,
                total: entry.total,
                fix: location.fix,
                capturedAt: capturedAtRef.current,
                checkId: readingStep?.kind === "read" ? readingStep.checkId : null,
            }),
        );
    };

    const submitAgreement = () => {
        if (!capturedImage || readingStep?.kind !== "agreement") return;
        const {checkId} = readingStep;
        if (!checkId || !onAgree) return;

        placeCheck.sendWhereAllowed(() =>
            onAgree({
                image: capturedImage,
                qualityChecked: capturedQualityCheckedRef.current,
                fix: location.fix,
                capturedAt: capturedAtRef.current,
                checkId,
            }),
        );
    };

    /** Keep the photo and type the results from it. */
    const disagree = () => {
        if (readingStep?.kind !== "agreement") return;
        setDisagreed(true);
        fillFromReading(readingStep.reading, readingStep.checkId);
    };

    /** Agree with the earlier upload the reading matched, using this photo. */
    const agreeInstead = async () => {
        if (readingStep?.kind !== "read" || !readingStep.sameAs || !readingStep.checkId) return;
        if (!userToken) return;
        const {checkId, sameAs} = readingStep;
        setStartingAgreement(true);
        const outcome = await agreeAfterReading({token: userToken, checkId, reference: sameAs});
        setStartingAgreement(false);
        if (outcome.kind === "signed_out") return;
        setAgreedAfter(sameAs);
        if (outcome.kind !== "started") {
            setReadingStep({
                kind: "agreement",
                checkId: null,
                agrees: false,
                message: (outcome.kind === "failed" && outcome.message) || NOT_CHECKED,
                reading: null,
                checks: null,
                markedPhoto: null,
            });
            return;
        }
        setReadingStep({kind: "reading", checkId, checks: outcome.reading.checks ?? null});
    };

    /** Go on to the results after seeing where the form looks changed. */
    const continueChanged = () => {
        if (readingStep?.kind !== "read") return;
        setReadingStep({...readingStep, formChanged: null});
    };

    /** Type the results even though they match an earlier upload. */
    const typeAnyway = () => {
        if (readingStep?.kind !== "read") return;
        setReadingStep({...readingStep, sameAs: null});
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

    /** Show the reading's outcome: retake, the agreement, or the boxes. */
    const finishReading = (
        reading: Reading | null,
        checkId: string | null,
        checks: AgreementCheck[] | null = reading?.checks ?? null,
    ) => {
        if (reading?.retake) {
            setReadingStep({kind: "retake", message: reading.message ?? "Retake the photo."});
            return;
        }
        if (agreeing) {
            // An agreement is never saved unchecked.
            const checked = reading?.agreement === true && reading.status === "done";
            setReadingStep({
                kind: "agreement",
                checkId,
                agrees: checked && reading.outcome === "agrees",
                message: (checked && reading.message) || NOT_CHECKED,
                reading: reading?.status === "done" ? reading : null,
                checks,
                markedPhoto: reading?.marked_photo
                    ? `${apiBaseURL}${reading.marked_photo}`
                    : null,
            });
            return;
        }
        fillFromReading(reading, checkId);
    };

    /** The boxes, prefilled from the reading or empty. */
    const fillFromReading = (reading: Reading | null, checkId: string | null) => {
        const read = reading?.status === "done";
        const unread = entry.fill(read ? reading.prefill : null);
        setReadingStep({
            kind: "read",
            checkId,
            instruction: (read && reading.message) || NOT_READ,
            prefilled: read,
            // Without a reading every box is empty: no border marks them.
            unread: read ? unread : [],
            sameAs: read ? (reading.same_as ?? null) : null,
            formChanged:
                read && reading.form_changed
                    ? {
                          markedPhoto: reading.marked_photo
                              ? `${apiBaseURL}${reading.marked_photo}`
                              : null,
                      }
                    : null,
        });
    };

    /** Send the accepted photo to be read; the boxes wait for the reading. */
    const readPhoto = async (uri: string) => {
        entry.clear();
        setReadingStep({kind: "reading", checkId: null, checks: null});
        if (!userToken || !stationCode) {
            finishReading(null, null);
            return;
        }
        const outcome = await startReading({
            token: userToken,
            stationCode,
            race: level,
            image: uri,
            reference: agreeing ? agreeTarget : null,
        });
        // Retaken or closed while the photo was being sent.
        if (capturedImageRef.current !== uri) return;
        if (outcome.kind === "signed_out") return;
        if (outcome.kind === "not_allowed") {
            setReadingStep({
                kind: "read",
                checkId: null,
                instruction: null,
                prefilled: false,
                unread: [],
                sameAs: null,
                formChanged: null,
            });
            return;
        }
        if (outcome.kind === "failed") {
            if (agreeing && outcome.message) {
                // Refused before any check, e.g. the same photo again.
                setReadingStep({
                    kind: "agreement",
                    checkId: null,
                    agrees: false,
                    message: outcome.message,
                    reading: null,
                    checks: null,
                    markedPhoto: null,
                });
                return;
            }
            finishReading(null, null);
            return;
        }
        const {reading} = outcome;
        if (reading.status === "running") {
            setReadingStep({
                kind: "reading",
                checkId: reading.check_id,
                checks: reading.checks ?? null,
            });
        } else {
            finishReading(reading, reading.check_id);
        }
    };

    // Ask for the reading every 2 s. Once it has ended, show it (render-phase
    // state adjustment: the step leaves "reading", so this runs once).
    const pollingId = readingStep?.kind === "reading" ? readingStep.checkId : null;
    const {ended, latest} = useReading(userToken, pollingId);
    if (ended && pollingId) {
        // Given up: keep the lines as far as they got.
        const lastChecks =
            ended === "gave_up"
                ? (latest?.checks ??
                  (readingStep?.kind === "reading" ? readingStep.checks : null))
                : (ended.checks ?? null);
        finishReading(ended === "gave_up" ? null : ended, pollingId, lastChecks);
    }

    const acceptPendingPhoto = () => {
        const uri = pendingImageRef.current;
        if (!uri || !canUsePhoto) return;

        deleteTemporaryPhoto(capturedImageRef.current);
        capturedImageRef.current = uri;
        capturedQualityCheckedRef.current = pendingQualityCheckedRef.current;
        capturedAtRef.current = pendingCapturedAtRef.current;
        pendingImageRef.current = null;
        setCapturedImage(uri);
        setPendingImage(null);
        setPendingPreview(null);
        setStreamCheck(null);
        if (readsPhoto) void readPhoto(uri);
        placeCheck.warnAfterCapture();
    };

    const closeForm = () => {
        captureGenerationRef.current += 1;
        setReadingStep(null);
        setDisagreed(false);
        setAgreedAfter(null);
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

                    {blockReason ? (
                        <SubmitBlocked reason={blockReason} onRetry={location.retry} />
                    ) : pendingImage ? (
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
                            cameraError={cameraError}
                            light={hasTorch ? light : null}
                            onLightChange={setLight}
                            captureError={captureError}
                            device={device}
                            frameOutput={frameOutput}
                            photoOutput={photoOutput}
                            previewAspect={previewAspect}
                            view={view}
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
                    ) : readsPhoto && !capturedImage ? (
                        <PhotoStepPane formName={formName} onCapture={() => setTipStep(0)} />
                    ) : readsPhoto &&
                      capturedImage &&
                      agreeing &&
                      readingStep?.kind === "reading" ? (
                        <AgreementPane
                            checks={latest?.checks ?? readingStep.checks}
                            checking
                        />
                    ) : readsPhoto &&
                      capturedImage &&
                      (readingStep?.kind === "reading" || readingStep?.kind === "retake") ? (
                        <ReadingPane
                            formName={formName}
                            imageUri={capturedImage}
                            sending={
                                readingStep.kind === "reading" && readingStep.checkId === null
                            }
                            retakeMessage={
                                readingStep.kind === "retake" ? readingStep.message : null
                            }
                            onRetake={openCamera}
                        />
                    ) : readsPhoto && capturedImage && readingStep?.kind === "agreement" ? (
                        <AgreementPane
                            checks={readingStep.checks}
                            photo={
                                readingStep.markedPhoto && userToken
                                    ? {
                                          marked: readingStep.markedPhoto,
                                          plain: capturedImage,
                                          token: userToken,
                                      }
                                    : null
                            }
                            message={readingStep.message}
                            agrees={readingStep.agrees}
                            submitting={submitting}
                            onSubmit={submitAgreement}
                            onRetake={openCamera}
                            onDisagree={disagree}
                        />
                    ) : readsPhoto &&
                      capturedImage &&
                      readingStep?.kind === "read" &&
                      readingStep.formChanged ? (
                        <ChangedFormPane
                            photo={
                                readingStep.formChanged.markedPhoto && userToken
                                    ? {
                                          marked: readingStep.formChanged.markedPhoto,
                                          plain: capturedImage,
                                          token: userToken,
                                      }
                                    : null
                            }
                            onContinue={continueChanged}
                            onCancel={closeForm}
                        />
                    ) : readsPhoto &&
                      capturedImage &&
                      readingStep?.kind === "read" &&
                      readingStep.sameAs ? (
                        <SameResultsPane
                            sending={startingAgreement}
                            onAgree={agreeInstead}
                            onType={typeAnyway}
                        />
                    ) : (
                        <VoteEntryPane
                            // A new reading starts the counts afresh.
                            key={readingStep?.kind === "read" ? readingStep.checkId : null}
                            candidates={candidates}
                            captured={!!capturedImage}
                            formName={formName}
                            instruction={readingStep?.kind === "read" ? readingStep.instruction : null}
                            unread={readingStep?.kind === "read" ? readingStep.unread : []}
                            steps={readsPhoto}
                            prefilled={readingStep?.kind === "read" && readingStep.prefilled}
                            tapsToSubmit={readsPhoto ? 3 : 1}
                            maxVotes={maxVotes}
                            disputedVotes={entry.disputedVotes}
                            rejectedVotes={entry.rejectedVotes}
                            submitEnabled={entry.submitEnabled}
                            submitLabel={submitLabel}
                            submitting={submitting}
                            total={entry.total}
                            votes={entry.votes}
                            onCapture={() => setTipStep(0)}
                            onDisputedVotesChange={entry.setDisputedVotes}
                            onRejectedVotesChange={entry.setRejectedVotes}
                            onSubmit={submitForm}
                            onVoteChange={entry.setVote}
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
