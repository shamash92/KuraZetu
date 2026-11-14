import {Alert} from "react-native";
import {useCallback, useEffect, useRef, useState} from "react";
import {router, useLocalSearchParams} from "expo-router";
import {afterPasswordSignIn} from "./biometricUnlock";
import {apiBaseURL} from "@/app/_utils/apiBaseURL";
import {useAuthStore} from "./authStore";
import {useSignupVerificationStore} from "./signupVerificationStore";

type SignupData = {
    accepted_terms: true;
    age: number;
    client: "native";
    first_name: string;
    gender: "M" | "F";
    last_name: string;
    password: string;
    polling_center: string;
    role: "voter";
    verification_ticket: string;
    ward_code: string;
};

type SignupResponse = {
    data?: {token?: string};
    details?: Record<string, unknown> | string;
    error?: string;
    message?: string;
    [field: string]: unknown;
};

type SignupField = "age" | "confirmPassword" | "firstName" | "gender" | "lastName" | "password";
type SignupFieldErrors = Partial<Record<SignupField, string>>;

const apiFieldNames = {
    age: "age",
    first_name: "firstName",
    gender: "gender",
    last_name: "lastName",
    password: "password",
} satisfies Record<string, SignupField>;

function asFieldErrors(response: SignupResponse): SignupFieldErrors {
    const source =
        response.details && typeof response.details === "object"
            ? response.details
            : response;
    const errors: SignupFieldErrors = {};

    for (const [apiField, formField] of Object.entries(apiFieldNames)) {
        const value = source[apiField];
        if (Array.isArray(value) && typeof value[0] === "string") {
            errors[formField] = value[0];
        }
    }

    return errors;
}

function responseError(response: SignupResponse, fieldErrors: SignupFieldErrors) {
    if (typeof response.details === "string") return response.details;
    return response.error ?? Object.values(fieldErrors)[0] ?? "Please review your details and try again.";
}

export function useSignup() {
    const [formData, setFormData] = useState({
        age: "",
        confirmPassword: "",
        firstName: "",
        gender: "",
        lastName: "",
        password: "",
    });
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isBallotAnimationComplete, setIsBallotAnimationComplete] = useState(false);
    const [error, setError] = useState<string>("");
    const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});
    const [successfulSignupToken, setSuccessfulSignupToken] = useState<string | null>(
        null,
    );
    const {logIn} = useAuthStore();
    const {pollingCenter, ward} = useLocalSearchParams<{
        pollingCenter?: string;
        ward?: string;
    }>();
    const verificationTicket = useSignupVerificationStore(
        (state) => state.verificationTicket,
    );
    const clearVerificationTicket = useSignupVerificationStore(
        (state) => state.clearVerificationTicket,
    );
    const hasRegistered = useRef(false);
    const hasCommittedSignup = useRef(false);

    useEffect(() => {
        if (!verificationTicket && !hasRegistered.current) {
            router.replace("/auth/signUp");
        }
    }, [verificationTicket]);

    useEffect(() => {
        if (
            !successfulSignupToken ||
            !isBallotAnimationComplete ||
            hasCommittedSignup.current
        ) {
            return;
        }

        hasCommittedSignup.current = true;
        clearVerificationTicket();
        logIn(successfulSignupToken);
        router.replace("/(tabs)");
        void afterPasswordSignIn(successfulSignupToken);
    }, [clearVerificationTicket, isBallotAnimationComplete, logIn, successfulSignupToken]);

    function updateFormData(field: keyof typeof formData, value: string) {
        setError("");
        setFieldErrors((previous) => ({...previous, [field]: undefined}));
        setFormData((previous) => ({...previous, [field]: value}));
    }

    const canSubmit =
        acceptedTerms &&
        Object.values(formData).every((value) => value.trim() !== "");

    const handleBallotAnimationComplete = useCallback(() => {
        setIsBallotAnimationComplete(true);
    }, []);

    function validateForm() {
        const {age, confirmPassword, firstName, gender, lastName, password} = formData;
        if (!firstName.trim() || !lastName.trim()) {
            Alert.alert("Add your name", "Please enter your first and last name.");
            return false;
        }
        if (password.length < 8) {
            Alert.alert("Choose a longer password", "Your password needs at least 8 characters.");
            return false;
        }
        if (password !== confirmPassword) {
            Alert.alert("Passwords do not match", "Please check and try again.");
            return false;
        }
        if (!gender) {
            Alert.alert("Select your gender", "Please choose an option to continue.");
            return false;
        }
        if (!age || Number.parseInt(age, 10) < 18 || Number.parseInt(age, 10) > 80) {
            Alert.alert("Check your age", "Please enter an age between 18 and 80.");
            return false;
        }
        return true;
    }

    async function handleSignup() {
        if (!verificationTicket || !ward || !pollingCenter) {
            router.replace("/auth/signUp");
            return;
        }
        if (!validateForm()) return;

        setError("");
        setFieldErrors({});
        hasCommittedSignup.current = false;
        setIsBallotAnimationComplete(false);
        setSuccessfulSignupToken(null);
        setIsLoading(true);
        let accountCreated = false;
        const data: SignupData = {
            accepted_terms: true,
            age: Number.parseInt(formData.age, 10),
            client: "native",
            first_name: formData.firstName.trim(),
            gender: formData.gender === "Male" ? "M" : "F",
            last_name: formData.lastName.trim(),
            password: formData.password,
            polling_center: pollingCenter,
            role: "voter",
            verification_ticket: verificationTicket,
            ward_code: ward,
        };

        try {
            const response = await fetch(
                `${apiBaseURL}/api/accounts/phone-verification/signup/complete/`,
                {
                    body: JSON.stringify(data),
                    headers: {Accept: "application/json", "Content-Type": "application/json"},
                    method: "POST",
                },
            );
            const payload = (await response.json().catch(() => ({}))) as SignupResponse;

            if (!response.ok || payload.error) {
                const errors = asFieldErrors(payload);
                const message = responseError(payload, errors);
                setFieldErrors(errors);
                setError(message);
                Alert.alert("Could not create account", message);
                return;
            }

            const token = payload.data?.token;
            if (payload.message === "User signup successful" && typeof token === "string") {
                hasRegistered.current = true;
                accountCreated = true;
                setSuccessfulSignupToken(token);
                return;
            }

            Alert.alert("Could not create account", "Please try again shortly.");
        } catch {
            Alert.alert("Connection problem", "We could not create your account. Please try again.");
        } finally {
            if (!accountCreated) setIsLoading(false);
        }
    }

    return {
        formData,
        updateFormData,
        acceptedTerms,
        setAcceptedTerms,
        canSubmit,
        handleSignup,
        isLoading,
        error,
        fieldErrors,
        handleBallotAnimationComplete,
        hasRequiredDetails: Boolean(verificationTicket && ward && pollingCenter),
    };
}
