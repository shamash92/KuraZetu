import {router} from "expo-router";

import {apiBaseURL} from "../apiBaseURL";
import useAuthStore from "./authStore";
import {
    disableBiometricUnlock,
    expireBiometricToken,
    readBiometricToken,
} from "./biometricUnlock";
import {BiometricCopy, unlockOutcome} from "./lockRules";

// The only way to sign out. Each caller says what happens to the biometric
// copy of the token; a copy that cannot be dropped never blocks the sign-out.
export async function signOut(biometricCopy: BiometricCopy) {
    if (biometricCopy === "expire") await expireBiometricToken().catch(() => {});
    if (biometricCopy === "turn_off") await disableBiometricUnlock().catch(() => {});

    // Read after the awaits, so when several sign-outs race only the first
    // one navigates. Already signed out means an auth screen is showing.
    const {isLoggedIn, logOut} = useAuthStore.getState();
    await logOut();
    if (isLoggedIn) router.replace("/auth/login");
}

// Asks for Face ID or a fingerprint and signs in or out on the result. The
// caller only tells the user what happened.
export function unlockWithBiometrics() {
    return unlockOutcome({
        readToken: readBiometricToken,
        async checkSession(token) {
            const response = await fetch(`${apiBaseURL}/api/accounts/native/session/`, {
                headers: {Authorization: `Bearer ${token}`},
            }).catch(() => null);
            return response?.status ?? null;
        },
        logIn(token) {
            const wasLoggedIn = useAuthStore.getState().isLoggedIn;
            useAuthStore.getState().logIn(token);
            if (!wasLoggedIn) router.replace("/(tabs)");
        },
        signOut,
    });
}
