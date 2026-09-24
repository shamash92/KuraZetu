// Rules for the Native app lock. No React Native imports, so node --test can
// load this file directly.

// iOS and Android report a dismissed biometric prompt only in the error message.
export function isCancelledPrompt(error: unknown): boolean {
    return error instanceof Error && /cancel/i.test(error.message);
}
