import {Alert, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {Fingerprint, ScanFace} from "lucide-react-native";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {router} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";

import {CARD, INK, LIME, MUTE} from "../../app/_utils/colors";
import {Mark} from "@/components/brand/mark";
import {apiBaseURL} from "../../app/_utils/apiBaseURL";
import {
    disableBiometricUnlock,
    expireBiometricToken,
    readBiometricToken,
    capitalizeLabel,
    isFaceLabel,
    useBiometricLabel,
} from "../../app/_utils/auth/biometricUnlock";
import {isCancelledPrompt, sessionCheck} from "../../app/_utils/auth/lockRules";
import useAuthStore from "../../app/_utils/auth/authStore";

// Covers the app in white while it is locked or not in front. When locked, it asks for
// Face ID or a fingerprint once, then shows buttons to retry or use the password.
export default function LockCover({isLocked}: {isLocked: boolean}) {
    const biometricLabel = useBiometricLabel();
    const insets = useSafeAreaInsets();
    const [isUnlocking, setIsUnlocking] = useState(false);
    const hasPrompted = useRef(false);

    const signInWithPassword = useCallback(async () => {
        const {isLoggedIn, logOut} = useAuthStore.getState();
        await logOut();
        if (isLoggedIn) router.replace("/auth/login");
    }, []);

    const unlock = useCallback(async () => {
        setIsUnlocking(true);
        try {
            let token: string | null;
            try {
                token = await readBiometricToken();
            } catch (error) {
                if (!isCancelledPrompt(error)) {
                    Alert.alert("Couldn't unlock", "Try again, or use your password.");
                }
                return;
            }

            if (!token) {
                await disableBiometricUnlock();
                await signInWithPassword();
                Alert.alert(
                    "Biometrics changed on this phone",
                    "Sign in with your password.",
                );
                return;
            }

            const response = await fetch(`${apiBaseURL}/api/accounts/native/session/`, {
                headers: {Authorization: `Bearer ${token}`},
            }).catch(() => null);
            const session = sessionCheck(response?.status ?? null);

            if (session === "valid") {
                const wasLoggedIn = useAuthStore.getState().isLoggedIn;
                useAuthStore.getState().logIn(token);
                if (!wasLoggedIn) router.replace("/(tabs)");
            } else if (session === "expired") {
                await expireBiometricToken();
                await signInWithPassword();
                Alert.alert("Your session has ended", "Sign in with your password.");
            } else {
                Alert.alert(
                    "Couldn't unlock",
                    "Unable to connect to the server. " +
                        "Check your connection and try again.",
                );
            }
        } finally {
            setIsUnlocking(false);
        }
    }, [signInWithPassword]);

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
                        onPress={() => void signInWithPassword()}
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
