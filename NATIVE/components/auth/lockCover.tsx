import {Alert, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {Fingerprint, ScanFace} from "lucide-react-native";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {useSafeAreaInsets} from "react-native-safe-area-context";

import {CARD, INK, LIME, MUTE} from "../../app/_utils/colors";
import {Mark} from "@/components/brand/mark";
import {
    capitalizeLabel,
    isFaceLabel,
    useBiometricLabel,
} from "../../app/_utils/auth/biometricUnlock";
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

// Covers the app in white while it is locked or not in front. When locked, it asks for
// Face ID or a fingerprint once, then shows buttons to retry or use the password.
export default function LockCover({isLocked}: {isLocked: boolean}) {
    const biometricLabel = useBiometricLabel();
    const insets = useSafeAreaInsets();
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

    const BiometricIcon = isFaceLabel(biometricLabel) ? ScanFace : Fingerprint;

    return (
        <View
            style={[
                StyleSheet.absoluteFill,
                styles.cover,
                {
                    paddingTop: insets.top + 24,
                    paddingBottom: Math.max(insets.bottom, 16) + 8,
                },
            ]}
        >
            <View style={styles.stage}>
                <Mark width={96} ground="light" />
                {isLocked ? (
                    <View style={styles.heading}>
                        <Text style={styles.title}>{capitalizeLabel(biometricLabel)} required</Text>
                        <Text style={styles.subtitle}>to open KuraZetu</Text>
                    </View>
                ) : null}
            </View>

            {isLocked ? (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.primary, isUnlocking && styles.disabled]}
                        onPress={() => void unlock()}
                        disabled={isUnlocking}
                        activeOpacity={0.85}
                    >
                        <BiometricIcon size={22} color={CARD} strokeWidth={2} />
                        <Text style={styles.primaryText}>
                            Unlock with {biometricLabel}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => void signOut("keep")}
                        disabled={isUnlocking}
                        hitSlop={12}
                    >
                        <Text style={styles.link}>Use password instead</Text>
                    </TouchableOpacity>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    cover: {
        backgroundColor: CARD,
        paddingHorizontal: 24,
    },
    stage: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 36,
    },
    heading: {
        alignItems: "center",
        gap: 6,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        letterSpacing: -0.6,
        color: INK,
    },
    subtitle: {
        fontSize: 16,
        color: MUTE,
    },
    actions: {
        alignItems: "center",
        gap: 22,
    },
    primary: {
        alignSelf: "stretch",
        height: 60,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        backgroundColor: INK,
        borderRadius: 999,
    },
    primaryText: {
        fontSize: 18,
        fontWeight: "800",
        color: CARD,
    },
    disabled: {
        opacity: 0.6,
    },
    link: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: "800",
        color: INK,
        borderBottomWidth: 2,
        borderBottomColor: LIME,
        paddingBottom: 1,
    },
});
