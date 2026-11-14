import {useCallback, useEffect, useRef, useState} from "react";
import {router} from "expo-router";
import {apiBaseURL} from "@/app/_utils/apiBaseURL";
import {afterPasswordSignIn} from "./biometricUnlock";
import useAuthStore from "./authStore";
import {
    deleteFromSecureStore,
    getFromSecureStore,
    saveToSecureStore,
} from "@/app/_utils/device/secureStore";

const PASSWORD_LOGIN_LOCKOUT_EXPIRY_KEY = "passwordLoginLockoutExpiry";

function getRemainingLockoutSeconds(lockoutExpiresAt: number) {
    return Math.max(0, Math.ceil((lockoutExpiresAt - Date.now()) / 1000));
}

export function usePasswordLogin() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTallyAnimationVisible, setIsTallyAnimationVisible] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const [isTallyAnimationComplete, setIsTallyAnimationComplete] = useState(false);
    const [successfulPasswordToken, setSuccessfulPasswordToken] = useState<string | null>(
        null,
    );
    const [lockoutExpiresAt, setLockoutExpiresAt] = useState<number | null>(null);
    const [isLockoutRestored, setIsLockoutRestored] = useState(false);
    const {logIn} = useAuthStore();
    const hasCommittedPasswordSignIn = useRef(false);

    const handleTallyAnimationComplete = useCallback(() => {
        setIsTallyAnimationComplete(true);
    }, []);

    const handleLockoutComplete = useCallback(() => {
        setLockoutExpiresAt(null);
        void deleteFromSecureStore(PASSWORD_LOGIN_LOCKOUT_EXPIRY_KEY);
    }, []);

    const showLockout = useCallback((retryAfterSeconds: number) => {
        const expiresAt = Date.now() + retryAfterSeconds * 1000;

        setLockoutExpiresAt(expiresAt);
        void saveToSecureStore(PASSWORD_LOGIN_LOCKOUT_EXPIRY_KEY, String(expiresAt));
    }, []);

    useEffect(() => {
        let isCurrent = true;

        async function restoreLockout() {
            try {
                const storedExpiry = await getFromSecureStore(
                    PASSWORD_LOGIN_LOCKOUT_EXPIRY_KEY,
                );
                const lockoutExpiry = Number(storedExpiry);

                if (
                    Number.isSafeInteger(lockoutExpiry) &&
                    getRemainingLockoutSeconds(lockoutExpiry) > 0
                ) {
                    if (isCurrent) setLockoutExpiresAt(lockoutExpiry);
                } else {
                    await deleteFromSecureStore(PASSWORD_LOGIN_LOCKOUT_EXPIRY_KEY);
                }
            } finally {
                if (isCurrent) setIsLockoutRestored(true);
            }
        }

        void restoreLockout();

        return () => {
            isCurrent = false;
        };
    }, []);

    useEffect(() => {
        if (
            !successfulPasswordToken ||
            !isTallyAnimationComplete ||
            hasCommittedPasswordSignIn.current
        ) {
            return;
        }

        hasCommittedPasswordSignIn.current = true;
        logIn(successfulPasswordToken);
        router.replace("/(tabs)");
        void afterPasswordSignIn(successfulPasswordToken);
    }, [isTallyAnimationComplete, logIn, successfulPasswordToken]);

    function submit(phoneNumber: string, password: string) {
        const nationalNumber = phoneNumber.replace(/^\+254/, "");

        setError(null);

        hasCommittedPasswordSignIn.current = false;
        setIsTallyAnimationComplete(false);
        setSuccessfulPasswordToken(null);
        setIsSubmitting(true);

        let data = {
            phone_number: phoneNumber,
            password: password,
        };

        fetch(`${apiBaseURL}/api/accounts/native/login/`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data["code"] === "phone_verification_required") {
                    setIsSubmitting(false);
                    router.replace({
                        pathname: "/auth/forgot-password",
                        params: {
                            phone: nationalNumber,
                            reason: "phone_unverified",
                        },
                    });
                } else if (data["error"]) {
                    setIsSubmitting(false);

                    if (data["code"] === "login_temporarily_blocked") {
                        const retryAfterSeconds = data["retry_after_seconds"];

                        if (
                            typeof retryAfterSeconds === "number" &&
                            Number.isInteger(retryAfterSeconds) &&
                            retryAfterSeconds > 0
                        ) {
                            showLockout(retryAfterSeconds);
                            return;
                        }

                        setError(data["error"]);
                    } else if (data["error"] === "Invalid credentials") {
                        setError("Wrong phone number or password.");
                    } else if (
                        data["error"] === "Invalid data" &&
                        data["details"]["phone_number"]
                    ) {
                        setError(data["details"]["phone_number"][0]);
                    } else {
                        setError(data["error"]);
                    }
                } else if (data["message"] === "User login successful") {
                    let token = data["data"]["token"];
                    useAuthStore
                        .getState()
                        .setTermsOutdated(data["data"]["terms_outdated"] === true);

                    if (typeof token === "string" && token.length > 0) {
                        setIsSubmitting(false);
                        setIsTallyAnimationVisible(true);
                        setSuccessfulPasswordToken(token);
                    } else if (typeof token === "object" && token !== null) {
                        setIsSubmitting(false);
                    } else {
                        console.error("Invalid token format");
                        setIsSubmitting(false);
                    }
                } else {
                    setIsSubmitting(false);
                    setError("Could not sign you in. Try again.");
                }
            })
            .catch(() => {
                setIsSubmitting(false);
                setError("Could not sign you in. Check your connection and try again.");
            });
    }

    return {
        submit,
        error,
        setError,
        isSubmitting,
        isTallyAnimationVisible,
        isLockoutRestored,
        lockoutExpiresAt,
        handleLockoutComplete,
        handleTallyAnimationComplete,
    };
}
