import {
    CommonResolutions,
    Size,
    useCameraDevice,
    usePhotoOutput,
} from "react-native-vision-camera";
import React, {useState} from "react";
import {type Image as NitroImageHandle} from "react-native-nitro-image";
import {createBarcodeScanner} from "react-native-vision-camera-barcode-scanner";

import {File} from "expo-file-system";

import type {TLevelTabs} from "@/app/types";

import {checkCapturedStream} from "../review/formQr";
import type {StreamCheck} from "../review/streamCheck";
import type {LightSetting} from "./captureGate";
import {CaptureAspect, useFrameAnalysis} from "./useFrameAnalysis";

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

/**
 * Unread photos before "Use this photo" is offered anyway. The QR is a check,
 * not a gate: a torn, stamped or glared code must never lock anyone out.
 */
const UNREAD_PHOTOS_BEFORE_OVERRIDE = 2;

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
 * The capture tips, the live camera, the photo under review and the accepted
 * photo. Owns the temporary photo files and deletes each once it is replaced
 * or the form closes.
 */
export function usePhotoCapture({
    visible,
    stationCode,
    level,
}: {
    visible: boolean;
    /** When set, each photo's QR is checked against this stream. */
    stationCode?: string;
    level: TLevelTabs;
}) {
    const [showCamera, setShowCamera] = useState(false);
    /** The capture tip on screen; null when the tips are not showing. */
    const [tipStep, setTipStep] = useState<number | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    /** Captured but not yet accepted — shown full-screen for review. */
    const [pendingImage, setPendingImage] = useState<string | null>(null);
    const [pendingPreview, setPendingPreview] =
        useState<NitroImageHandle | null>(null);
    const device = useCameraDevice("back");
    const [aspect, setAspect] = useState<CaptureAspect>(DEFAULT_ASPECT);
    /** Starts at Off for each form; kept across retakes until the form closes. */
    const [light, setLight] = useState<LightSetting>("off");
    const hasTorch = !!device?.hasTorch;
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

    /** Empty, for a form that has just opened. */
    const reset = () => {
        setCapturedImage(null);
        setPendingImage(null);
        setPendingPreview(null);
        setShowCamera(false);
        setTipStep(null);
        setCameraError(null);
        setCaptureError(null);
        setStreamCheck(null);
        setUnreadPhotos(0);
        setLight("off");
    };

    // Clear the previous run's readings so a stale good period can't offer the
    // shutter the instant the camera reopens for a retake.
    const openCamera = () => {
        resetAnalysis();
        setCameraError(null);
        setCaptureError(null);
        setShowCamera(true);
    };

    const showTips = () => setTipStep(0);

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

    /** Use the photo under review; returns it, or null when it cannot be used. */
    const acceptPendingPhoto = (): string | null => {
        const uri = pendingImageRef.current;
        if (!uri || !canUsePhoto) return null;

        deleteTemporaryPhoto(capturedImageRef.current);
        capturedImageRef.current = uri;
        capturedQualityCheckedRef.current = pendingQualityCheckedRef.current;
        capturedAtRef.current = pendingCapturedAtRef.current;
        pendingImageRef.current = null;
        setCapturedImage(uri);
        setPendingImage(null);
        setPendingPreview(null);
        setStreamCheck(null);
        return uri;
    };

    /** Whether this is still the accepted photo, not retaken or closed. */
    const isCaptured = (uri: string) => capturedImageRef.current === uri;

    /** How the accepted photo was taken, for the upload. */
    const capturedDetails = () => ({
        qualityChecked: capturedQualityCheckedRef.current,
        capturedAt: capturedAtRef.current,
    });

    /** Drop any capture still finishing and delete the photo files. */
    const release = () => {
        captureGenerationRef.current += 1;
        setPendingPreview(null);
        releaseOwnedPhotos();
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

    /** What the back button does while a capture screen shows; null otherwise. */
    const goBack = pendingImage
        ? discardPendingPhoto
        : showCamera
          ? closeCamera
          : tipStep !== null
            ? () => setTipStep(tipStep > 0 ? tipStep - 1 : null)
            : null;

    return {
        device,
        photoOutput,
        frameOutput,
        view,
        aspect,
        previewAspect,
        light: hasTorch ? light : null,
        setLight,
        showCamera,
        tipStep,
        setTipStep,
        capturedImage,
        pendingImage,
        pendingPreview,
        cameraError,
        captureError,
        streamCheck,
        canUsePhoto,
        takePicture,
        reset,
        openCamera,
        showTips,
        finishTips,
        closeCamera,
        discardPendingPhoto,
        acceptPendingPhoto,
        isCaptured,
        capturedDetails,
        release,
        toggleAspect,
        handleCameraError,
        goBack,
    };
}
