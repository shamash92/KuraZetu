import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

import {Alert, Platform} from "react-native";
import {useEffect, useState} from "react";
import {
    deleteFromSecureStore,
    getFromSecureStore,
    saveToSecureStore,
} from "./secureStore";

// A copy of the Knox token that only Face ID or a fingerprint can read. The
// preference is stored apart from it, so an expired token can be dropped
// without turning biometric unlock off:
//   on             - the copy is stored; the login screen offers unlock.
//   needs_password - the copy was dropped; the next password sign-in stores a new one.
//   off            - no copy.
export type BiometricUnlock = "on" | "needs_password" | "off";

const TOKEN_KEY = "biometricToken";
const PROTECTED = {
    requireAuthentication: true,
    authenticationPrompt: "Unlock KuraZetu",
};

export async function getBiometricUnlock(): Promise<BiometricUnlock> {
    const value = await getFromSecureStore("biometricUnlock");
    return value === "on" || value === "needs_password" ? value : "off";
}

// True when the phone has strong biometrics enrolled.
export function canUseBiometricUnlock() {
    return SecureStore.canUseBiometricAuthentication();
}

async function biometricLabel() {
    if (Platform.OS === "android") return "fingerprint";

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
        ? "Face ID"
        : "Touch ID";
}

export function useBiometricLabel() {
    const [label, setLabel] = useState(
        Platform.OS === "ios" ? "Face ID" : "fingerprint",
    );

    useEffect(() => {
        void biometricLabel().then(setLabel);
    }, []);

    return label;
}

// Android asks for a fingerprint to save; iOS saves without asking.
async function storeBiometricToken(token: string) {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.setItemAsync(TOKEN_KEY, token, PROTECTED);
    await saveToSecureStore("biometricUnlock", "on");
}

// Prompts. Resolves null when the biometrics changed since the copy was saved.
export function readBiometricToken() {
    return SecureStore.getItemAsync(TOKEN_KEY, PROTECTED);
}

export async function enableBiometricUnlock(token: string) {
    try {
        await storeBiometricToken(token);
        // iOS only asks on read, so read the copy back to prove Face ID works.
        if (Platform.OS === "ios" && (await readBiometricToken()) !== token) {
            throw new Error("The saved token could not be read back");
        }
    } catch (error) {
        await disableBiometricUnlock();
        throw error;
    }
}

export async function disableBiometricUnlock() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await deleteFromSecureStore("biometricUnlock");
}

// The token was revoked or rejected: drop the copy but keep the preference.
export async function expireBiometricToken() {
    if ((await getBiometricUnlock()) !== "on") return;

    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await saveToSecureStore("biometricUnlock", "needs_password");
}

// Every password sign-in replaces the Knox token, so an enabled unlock stores
// the new one. Otherwise, offer biometric unlock once.
export async function afterPasswordSignIn(token: string) {
    const label = await biometricLabel();

    if ((await getBiometricUnlock()) !== "off") {
        try {
            await storeBiometricToken(token);
        } catch {
            await disableBiometricUnlock();
            Alert.alert(
                `${label} unlock is off`,
                `Turn it on again in Settings to unlock KuraZetu with ${label}.`,
            );
        }
        return;
    }

    if (!canUseBiometricUnlock() || (await getFromSecureStore("biometricNudgeShown"))) {
        return;
    }
    await saveToSecureStore("biometricNudgeShown", "true");

    Alert.alert(
        `Unlock with ${label}?`,
        `Open KuraZetu with ${label} instead of typing your password.`,
        [
            {text: "Not now", style: "cancel"},
            {
                text: "Turn on",
                onPress: () => void enableBiometricUnlock(token).catch(() => {}),
            },
        ],
    );
}
