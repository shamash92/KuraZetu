// Rules for the Native app lock. No React Native imports, so node --test can
// load this file directly.

// Password-only users would retype their password on every lock, so they get
// five minutes. With biometric unlock on, the app locks whenever it is left;
// the 10 seconds skip Android permission dialogs, which background the app.
export const PASSWORD_LOCK_AFTER_MS = 5 * 60 * 1000;
export const BIOMETRIC_LOCK_AFTER_MS = 10 * 1000;

export function shouldLock(
    backgroundedAt: number | null,
    now: number,
    biometricUnlock: boolean,
): boolean {
    if (backgroundedAt === null) return false;

    const away = now - backgroundedAt;
    return away >= (biometricUnlock ? BIOMETRIC_LOCK_AFTER_MS : PASSWORD_LOCK_AFTER_MS);
}

export type SessionCheck = "valid" | "expired" | "unreachable";

// No response (null) or a server error keeps the stored token for a retry.
export function sessionCheck(status: number | null): SessionCheck {
    if (status === 200) return "valid";
    if (status === 401) return "expired";
    return "unreachable";
}

// What a sign-out does with the biometric copy of the token:
//   expire   - drop the copy, keep the preference (see BiometricUnlock).
//   turn_off - drop the copy and the preference.
//   keep     - leave both, so the login screen still offers biometric unlock.
export type BiometricCopy = "expire" | "turn_off" | "keep";

// iOS and Android report a dismissed biometric prompt only in the error message.
export function isCancelledPrompt(error: unknown): boolean {
    return error instanceof Error && /cancel/i.test(error.message);
}
