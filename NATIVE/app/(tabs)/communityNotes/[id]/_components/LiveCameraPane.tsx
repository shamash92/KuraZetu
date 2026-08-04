import {StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {Camera as CameraIcon} from "lucide-react-native";
import {
    Camera,
    type CameraDevice,
    type CameraFrameOutput,
    type CameraPhotoOutput,
} from "react-native-vision-camera";

import {FramingBracket, type BracketState} from "./FramingBracket";
import type {QualityAssessment} from "./frameQuality";
import type {CaptureAspect} from "./useForm34AFrameAnalysis";
import {perk} from "@/app/_utils/colors";

interface LiveCameraPaneProps {
    active: boolean;
    aspect: CaptureAspect;
    assessment: QualityAssessment | null;
    bracketState: BracketState;
    cameraError: string | null;
    captureError: string | null;
    device: CameraDevice | undefined;
    frameOutput: CameraFrameOutput;
    photoOutput: CameraPhotoOutput;
    previewAspect: number;
    readyToCapture: boolean;
    onCameraError: (error: Error) => void;
    onCapture: () => void;
    onRetry: () => void;
    onToggleAspect: () => void;
}

/** The live camera and its guidance, kept separate from form orchestration. */
export function LiveCameraPane({
    active,
    aspect,
    assessment,
    bracketState,
    cameraError,
    captureError,
    device,
    frameOutput,
    photoOutput,
    previewAspect,
    readyToCapture,
    onCameraError,
    onCapture,
    onRetry,
    onToggleAspect,
}: LiveCameraPaneProps) {
    const cameraAvailable = !!device && !cameraError;

    return (
        <View style={styles.container}>
            {cameraAvailable && (
                <TouchableOpacity
                    style={styles.aspectToggle}
                    onPress={onToggleAspect}
                    accessibilityRole="button"
                    accessibilityLabel={`Capture aspect ratio, ${aspect}`}
                    accessibilityHint="Switches between 4 by 3 and 16 by 9"
                    hitSlop={8}
                >
                    <Text style={styles.aspectToggleText}>{aspect}</Text>
                </TouchableOpacity>
            )}

            <View style={[styles.preview, {aspectRatio: previewAspect}]}>
                {device && !cameraError ? (
                    <Camera
                        style={styles.camera}
                        device={device}
                        isActive={active}
                        outputs={[photoOutput, frameOutput]}
                        resizeMode="contain"
                        onError={onCameraError}
                    />
                ) : (
                    <View style={styles.cameraFailure} accessibilityRole="alert">
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
                            onPress={onRetry}
                            accessibilityRole="button"
                        >
                            <Text style={styles.cameraRetryText}>Try again</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {cameraAvailable && <FramingBracket state={bracketState} />}
            </View>

            {captureError ? (
                <View
                    style={[styles.qualityBanner, styles.qualityBannerBad]}
                    accessibilityRole="alert"
                    accessibilityLiveRegion="polite"
                >
                    <Text style={[styles.qualityLabel, styles.qualityLabelBad]}>
                        {captureError}
                    </Text>
                </View>
            ) : assessment && cameraAvailable ? (
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
                        <Text style={styles.qualityHint}>{assessment.hint}</Text>
                    )}
                </View>
            ) : null}

            <View style={styles.cameraControls}>
                {readyToCapture && cameraAvailable ? (
                    <TouchableOpacity
                        style={styles.captureButton}
                        onPress={onCapture}
                        accessibilityRole="button"
                        accessibilityLabel="Take photo"
                        accessibilityHint="Captures Form 34A for review"
                    >
                        <CameraIcon size={32} color={perk.limeInk} />
                    </TouchableOpacity>
                ) : (
                    <View
                        style={styles.captureButtonWaiting}
                        importantForAccessibility="no"
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
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
});
