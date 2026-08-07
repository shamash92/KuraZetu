export interface CameraPermissionRecovery {
    action: "request" | "settings";
    message: string;
    buttonLabel: string;
}

/** Describe the recovery action that the operating system still permits. */
export function getCameraPermissionRecovery(
    canRequestPermission: boolean,
): CameraPermissionRecovery {
    if (canRequestPermission) {
        return {
            action: "request",
            message: "We need camera permission to capture Form 34A",
            buttonLabel: "Grant Permission",
        };
    }

    return {
        action: "settings",
        message:
            "Camera access is turned off. Enable it in Settings to capture Form 34A.",
        buttonLabel: "Open Settings",
    };
}
