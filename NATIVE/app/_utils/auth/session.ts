import {router} from "expo-router";

import useAuthStore from "./authStore";
import {disableBiometricUnlock, expireBiometricToken} from "./biometricUnlock";
import {BiometricCopy} from "./lockRules";

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
