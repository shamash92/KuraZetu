import {Linking} from "react-native";
import {useCameraPermission} from "react-native-vision-camera";
import React, {useState} from "react";

import {getCameraPermissionRecovery} from "./cameraPermission";

/** Camera permission, and asking again or opening Settings when it is missing. */
export function usePermissionRecovery() {
    const {hasPermission, canRequestPermission, requestPermission} =
        useCameraPermission();
    const [error, setError] = useState<string | null>(null);

    const recovery = getCameraPermissionRecovery(canRequestPermission);
    const recover = React.useCallback(async () => {
        setError(null);
        try {
            if (recovery.action === "request") {
                const granted = await requestPermission();
                if (!granted) {
                    setError(
                        "Camera permission was not granted. Open Settings to enable it.",
                    );
                }
            } else {
                await Linking.openSettings();
            }
        } catch (error) {
            console.warn("[form34a] permission recovery failed", error);
            setError(
                recovery.action === "request"
                    ? "The permission request could not be opened. Please try again."
                    : "Settings could not be opened. Open this app in device Settings.",
            );
        }
    }, [recovery.action, requestPermission]);

    const reset = () => setError(null);

    return {hasPermission, recovery, error, recover, reset};
}
