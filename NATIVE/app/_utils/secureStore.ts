import * as SecureStore from "expo-secure-store";

export type SecureStoreKey =
    | "userID"
    | "userFirstName"
    | "userLastName"
    | "expoPushToken"
    | "passwordLoginLockoutExpiry"
    | "lastLaunchAnimation"
    | "biometricUnlock"
    | "biometricNudgeShown";

export async function saveToSecureStore(key: SecureStoreKey, value: string) {
    await SecureStore.setItemAsync(key, value);
}

export async function getFromSecureStore(key: SecureStoreKey): Promise<string | null> {
    return SecureStore.getItemAsync(key);
}

export async function deleteFromSecureStore(key: SecureStoreKey) {
    await SecureStore.deleteItemAsync(key);
}

// Default export: a placeholder React component for routing requirements
export default function SecureStoreUtils() {
    return null;
}
