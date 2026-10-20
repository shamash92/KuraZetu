import {Alert, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {BlurView} from "expo-blur";
import {Fingerprint, ScanFace} from "lucide-react-native";
import React, {useCallback, useEffect, useRef, useState} from "react";

import {COPPER_DEEP, INK, LIME, LIME_INK, MUTE} from "../../app/_utils/colors";
import {useBiometricLabel} from "../../app/_utils/auth/biometricUnlock";
import {UnlockOutcome} from "../../app/_utils/auth/lockRules";
import {signOut, unlockWithBiometrics} from "../../app/_utils/auth/session";

// Title and message for the outcomes the user needs to hear about.
const UNLOCK_ALERTS: Partial<Record<UnlockOutcome, [string, string]>> = {
    prompt_failed: ["Couldn't unlock", "Try again, or use your password."],
    biometrics_changed: [
        "Biometrics changed on this phone",
        "Sign in with your password.",
    ],
    session_ended: ["Your session has ended", "Sign in with your password."],
    unreachable: [
        "Couldn't unlock",
        "Unable to connect to the server. Check your connection and try again.",
    ],
};

// Blurs the app while it is locked or not in front. When locked, it asks for
// Face ID or a fingerprint once, then shows buttons to retry or use the password.
export default function LockCover({isLocked}: {isLocked: boolean}) {
    const biometricLabel = useBiometricLabel();
    const [isUnlocking, setIsUnlocking] = useState(false);
    const hasPrompted = useRef(false);

    const unlock = useCallback(async () => {
        setIsUnlocking(true);
        try {
            const alert = UNLOCK_ALERTS[await unlockWithBiometrics()];
            if (alert) Alert.alert(alert[0], alert[1]);
        } finally {
            setIsUnlocking(false);
        }
    }, []);

    useEffect(() => {
        if (!isLocked || hasPrompted.current) return;

        hasPrompted.current = true;
        void unlock();
    }, [isLocked, unlock]);

    return (
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill}>
            {isLocked ? (
                <View style={styles.content}>
                    {biometricLabel === "Face ID" ? (
                        <ScanFace size={40} color={INK} strokeWidth={1.8} />
                    ) : (
                        <Fingerprint size={40} color={INK} strokeWidth={1.8} />
                    )}
                    <Text style={styles.title}>{biometricLabel} required</Text>
                    <Text style={styles.subtitle}>to open KuraZetu</Text>

                    <TouchableOpacity
                        style={[styles.primary, isUnlocking && styles.disabled]}
                        onPress={() => void unlock()}
                        disabled={isUnlocking}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.primaryText}>
                            Unlock with {biometricLabel}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => void signOut("keep")}
                        disabled={isUnlocking}
                        hitSlop={8}
                    >
                        <Text style={styles.link}>Use password instead</Text>
                    </TouchableOpacity>
                </View>
            ) : null}
        </BlurView>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
    },
    title: {
        marginTop: 16,
        fontSize: 20,
        fontWeight: "800",
        color: INK,
    },
    subtitle: {
        marginTop: 4,
        fontSize: 15,
        color: MUTE,
    },
    primary: {
        marginTop: 32,
        alignSelf: "stretch",
        alignItems: "center",
        backgroundColor: LIME,
        borderRadius: 14,
        paddingVertical: 16,
    },
    primaryText: {
        fontSize: 15,
        fontWeight: "800",
        color: LIME_INK,
    },
    disabled: {
        opacity: 0.6,
    },
    link: {
        marginTop: 20,
        fontSize: 13,
        fontWeight: "800",
        color: COPPER_DEEP,
    },
});
