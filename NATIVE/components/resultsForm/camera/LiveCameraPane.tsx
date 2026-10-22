import {AppState, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {useEffect, useState} from "react";
import {Camera as CameraIcon, Flashlight, FlashlightOff, X} from "lucide-react-native";
import {
    Camera,
    type CameraDevice,
    type CameraFrameOutput,
    type CameraPhotoOutput,
} from "react-native-vision-camera";

import {FramingBracket, type BracketState} from "./FramingBracket";
import {ShutterCountdown} from "./ShutterCountdown";
import type {
    CaptureGateView,
    Guidance,
    LightSetting,
    ShutterState,
} from "./captureGate";
import type {CaptureAspect} from "./useFrameAnalysis";
import {perk} from "@/app/_utils/colors";

interface LiveCameraPaneProps {
    active: boolean;
    aspect: CaptureAspect;
    cameraError: string | null;
    /** The light setting; null hides the button on a phone without a torch. */
    light: LightSetting | null;
    onLightChange: (light: LightSetting) => void;
    captureError: string | null;
    device: CameraDevice | undefined;
    frameOutput: CameraFrameOutput;
    photoOutput: CameraPhotoOutput;
    previewAspect: number;
    view: CaptureGateView;
    onCameraError: (error: Error) => void;
    /** `qualityChecked` is false for a photograph taken with Capture anyway. */
    onCapture: (qualityChecked: boolean) => void;
    onClose: () => void;
    onRetry: () => void;
    onToggleAspect: () => void;
}

interface CameraSurfaceProps {
    active: boolean;
    torchOn: boolean;
    available: boolean;
    bracketState: BracketState;
    error: string | null;
    device: CameraDevice | undefined;
    frameOutput: CameraFrameOutput;
    photoOutput: CameraPhotoOutput;
    previewAspect: number;
    onCameraError: (error: Error) => void;
    onRetry: () => void;
}

function CameraSurface({
    active,
    torchOn,
    available,
    bracketState,
    error,
    device,
    frameOutput,
    photoOutput,
    previewAspect,
    onCameraError,
    onRetry,
}: CameraSurfaceProps) {
    return (
        // Not collapsable: VisionCamera's Android preview lays itself out at
        // (0, 0) of its native parent, so this box must be that parent.
        <View
            style={[styles.preview, {aspectRatio: previewAspect}]}
            collapsable={false}
        >
            {available && device ? (
                <Camera
                    style={styles.camera}
                    device={device}
                    isActive={active}
                    torchMode={torchOn ? "on" : "off"}
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
                        {error ?? "No back camera is available on this device."}
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
            {available && <FramingBracket state={bracketState} />}
        </View>
    );
}

interface CaptureGuidanceProps {
    guidance: Guidance | null;
    cameraAvailable: boolean;
    captureError: string | null;
}

function CaptureGuidance({
    guidance,
    cameraAvailable,
    captureError,
}: CaptureGuidanceProps) {
    if (captureError) {
        return (
            <View
                style={[styles.qualityBanner, styles.qualityBannerBad]}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
            >
                <Text style={[styles.qualityLabel, styles.qualityLabelBad]}>
                    {captureError}
                </Text>
            </View>
        );
    }

    if (!guidance || !cameraAvailable) return null;

    return (
        <View
            style={[
                styles.qualityBanner,
                guidance.ok ? styles.qualityBannerOk : styles.qualityBannerBad,
            ]}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
        >
            <Text
                style={[
                    styles.qualityLabel,
                    guidance.ok ? styles.qualityLabelOk : styles.qualityLabelBad,
                ]}
            >
                {guidance.label}
            </Text>
            {!!guidance.hint && (
                <Text style={styles.qualityHint}>{guidance.hint}</Text>
            )}
        </View>
    );
}

const NEXT_LIGHT: Record<LightSetting, LightSetting> = {
    off: "auto",
    auto: "on",
    on: "off",
};

const LIGHT_WORD: Record<LightSetting, string> = {
    off: "Off",
    auto: "Auto",
    on: "On",
};

interface LightButtonProps {
    light: LightSetting;
    lit: boolean;
    onChange: (light: LightSetting) => void;
}

/** Cycles Off, Auto, On. Lime while the torch is lit. */
function LightButton({light, lit, onChange}: LightButtonProps) {
    const color = lit ? perk.lime : perk.card;
    const Icon = light === "off" ? FlashlightOff : Flashlight;

    return (
        <TouchableOpacity
            style={styles.lightButton}
            onPress={() => onChange(NEXT_LIGHT[light])}
            accessibilityRole="button"
            accessibilityLabel={`Light, ${LIGHT_WORD[light]}`}
            accessibilityHint="Changes the light setting"
            hitSlop={8}
        >
            <Icon size={20} color={color} />
            <Text style={[styles.lightWord, {color}]}>{LIGHT_WORD[light]}</Text>
        </TouchableOpacity>
    );
}

/** Whether the app is in the foreground; the torch goes off in the background. */
function useAppInForeground() {
    const [foreground, setForeground] = useState(
        AppState.currentState === "active",
    );
    useEffect(() => {
        const subscription = AppState.addEventListener("change", (state) =>
            setForeground(state === "active"),
        );
        return () => subscription.remove();
    }, []);
    return foreground;
}

interface CaptureControlProps {
    shutter: ShutterState;
    anywayAtMs: number | null;
    light: LightSetting | null;
    lit: boolean;
    onLightChange: (light: LightSetting) => void;
    onCapture: (qualityChecked: boolean) => void;
    onClose: () => void;
}

function CaptureControl({
    shutter,
    anywayAtMs,
    light,
    lit,
    onLightChange,
    onCapture,
    onClose,
}: CaptureControlProps) {
    return (
        <View style={styles.cameraControls}>
            <View style={styles.controlSlot}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close camera"
                    accessibilityHint="Returns to the results form"
                    hitSlop={8}
                >
                    <X size={26} color={perk.card} />
                </TouchableOpacity>
            </View>
            <View style={styles.controlSlot}>
                {shutter === "ready" ? (
                    <TouchableOpacity
                        style={styles.captureButton}
                        onPress={() => onCapture(true)}
                        accessibilityRole="button"
                        accessibilityLabel="Take photo"
                        accessibilityHint="Captures the results form for review"
                    >
                        <CameraIcon size={32} color={perk.limeInk} />
                    </TouchableOpacity>
                ) : shutter === "anyway" ? (
                    <TouchableOpacity
                        style={styles.captureAnywayButton}
                        onPress={() => onCapture(false)}
                        accessibilityRole="button"
                        accessibilityLabel="Capture anyway"
                        accessibilityHint="Takes the photo without the quality check"
                    >
                        <Text style={styles.captureAnywayText}>
                            Capture{"\n"}anyway
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <ShutterCountdown anywayAtMs={anywayAtMs} />
                )}
            </View>
            {/* The third slot keeps the capture button centred, with or without a torch. */}
            <View style={styles.controlSlot}>
                {light !== null && (
                    <LightButton light={light} lit={lit} onChange={onLightChange} />
                )}
            </View>
        </View>
    );
}

/** The live camera and its guidance, kept separate from form orchestration. */
export function LiveCameraPane({
    active,
    aspect,
    cameraError,
    light,
    onLightChange,
    captureError,
    device,
    frameOutput,
    photoOutput,
    previewAspect,
    view,
    onCameraError,
    onCapture,
    onClose,
    onRetry,
    onToggleAspect,
}: LiveCameraPaneProps) {
    const cameraAvailable = !!device && !cameraError;
    const foreground = useAppInForeground();
    // The pane unmounts on review and on close, which turns the torch off;
    // the background needs this check.
    const torchOn = view.torchOn && foreground && cameraAvailable;

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

            <CameraSurface
                active={active}
                torchOn={torchOn}
                available={cameraAvailable}
                bracketState={view.bracket}
                error={cameraError}
                device={device}
                frameOutput={frameOutput}
                photoOutput={photoOutput}
                previewAspect={previewAspect}
                onCameraError={onCameraError}
                onRetry={onRetry}
            />
            <CaptureGuidance
                guidance={view.guidance}
                cameraAvailable={cameraAvailable}
                captureError={captureError}
            />
            <CaptureControl
                shutter={cameraAvailable ? view.shutter : "waiting"}
                anywayAtMs={cameraAvailable ? view.anywayAtMs : null}
                light={cameraAvailable ? light : null}
                lit={torchOn}
                onLightChange={onLightChange}
                onCapture={onCapture}
                onClose={onClose}
            />
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
        flexDirection: "row",
        alignItems: "center",
    },
    controlSlot: {
        flex: 1,
        alignItems: "center",
    },
    closeButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: perk.red,
        justifyContent: "center",
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
    lightButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "rgba(13,13,13,0.6)",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
    },
    lightWord: {
        fontSize: 11,
        fontWeight: "800",
    },
    captureAnywayButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: perk.lime,
        justifyContent: "center",
        alignItems: "center",
    },
    captureAnywayText: {
        color: perk.lime,
        fontSize: 12,
        fontWeight: "800",
        lineHeight: 15,
        textAlign: "center",
    },
});
