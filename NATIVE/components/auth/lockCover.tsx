import {Alert, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {BlurView} from "expo-blur";
import {Fingerprint, ScanFace} from "lucide-react-native";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {router} from "expo-router";

import {COPPER_DEEP, INK, LIME, LIME_INK, MUTE} from "../../app/_utils/colors";
import {apiBaseURL} from "../../app/_utils/apiBaseURL";
import {
    disableBiometricUnlock,
    expireBiometricToken,
    readBiometricToken,
    useBiometricLabel,
} from "../../app/_utils/biometricUnlock";
import {isCancelledPrompt, sessionCheck} from "../../app/_utils/lockRules";
import useAuthStore from "../../app/_utils/authStore";

// Blurs the app while it is locked or not in front. When locked, it asks for
// Face ID or a fingerprint once, then shows buttons to retry or use the password.
export default function LockCover({isLocked}: {isLocked: boolean}) {
    const biometricLabel = useBiometricLabel();
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
                        onPress={() => void signInWithPassword()}
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
