import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {ArrowLeft, ChevronDown, Eye, EyeOff, Lock, User} from "lucide-react-native";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {router, useLocalSearchParams} from "expo-router";

import SignupLoading from "@/components/auth/signup";
import {apiBaseURL} from "@/app/_utils/apiBaseURL";
import {perk} from "@/app/_utils/colors";
import {useAuthStore} from "@/app/_utils/authStore";
import {useSignupVerificationStore} from "@/app/_utils/signupVerificationStore";

type SignupData = {
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

export default function SignupScreen() {
    const [formData, setFormData] = useState({
        age: "",
        confirmPassword: "",
        firstName: "",
        gender: "",
        lastName: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showGenderDropdown, setShowGenderDropdown] = useState(false);
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
    const genders = ["Male", "Female"];

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
    }, [clearVerificationTicket, isBallotAnimationComplete, logIn, successfulSignupToken]);

    const updateFormData = (field: keyof typeof formData, value: string) => {
        setError("");
        setFieldErrors((previous) => ({...previous, [field]: undefined}));
        setFormData((previous) => ({...previous, [field]: value}));
    };

    const handleBallotAnimationComplete = useCallback(() => {
        setIsBallotAnimationComplete(true);
    }, []);

    const validateForm = () => {
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
    };

    const handleSignup = async () => {
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
    };

    if (!verificationTicket || !ward || !pollingCenter) return null;
    if (isLoading) {
        return (
            <SignupLoading
                onBallotAnimationComplete={handleBallotAnimationComplete}
            />
        );
    }

    return (
        <View style={styles.screen}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <TouchableOpacity
                    accessibilityLabel="Go back"
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <ArrowLeft color={perk.ink} size={20} />
                </TouchableOpacity>
                <Text style={styles.title}>Final step</Text>
                {error ? <Text accessibilityRole="alert" style={styles.formError}>{error}</Text> : null}

                <View style={styles.form}>
                    <View style={styles.nameRow}>
                        <View style={styles.half}>
                            <FieldLabel label="First name" />
                            <Input
                                accessibilityLabel="First name"
                                error={fieldErrors.firstName}
                                icon={<User color={perk.mute} size={17} />}
                                onChangeText={(value: string) => updateFormData("firstName", value)}
                                value={formData.firstName}
                            />
                        </View>
                        <View style={styles.half}>
                            <FieldLabel label="Last name" />
                            <Input
                                accessibilityLabel="Last name"
                                error={fieldErrors.lastName}
                                icon={<User color={perk.mute} size={17} />}
                                onChangeText={(value: string) => updateFormData("lastName", value)}
                                value={formData.lastName}
                            />
                        </View>
                    </View>

                    <View style={styles.demographicRow}>
                        <View style={styles.gender}>
                            <FieldLabel label="Gender" />
                            <TouchableOpacity
                                accessibilityRole="button"
                                onPress={() => setShowGenderDropdown((value) => !value)}
                                style={[styles.selectShell, fieldErrors.gender && styles.inputShellError]}
                            >
                                <Text style={[styles.selectText, formData.gender && styles.selectedText]}>
                                    {formData.gender || "Select"}
                                </Text>
                                <ChevronDown color={perk.ink} size={17} />
                            </TouchableOpacity>
                            {showGenderDropdown ? (
                                <View style={styles.dropdown}>
                                    {genders.map((gender) => (
                                        <TouchableOpacity
                                            key={gender}
                                            onPress={() => {
                                                updateFormData("gender", gender);
                                                setShowGenderDropdown(false);
                                            }}
                                            style={styles.dropdownOption}
                                        >
                                            <Text style={styles.dropdownText}>{gender}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : null}
                            {fieldErrors.gender ? <FieldError message={fieldErrors.gender} /> : null}
                        </View>
                        <View style={styles.age}>
                            <FieldLabel label="Age" />
                            <Input
                                keyboardType="numeric"
                                error={fieldErrors.age}
                                onChangeText={(value: string) =>
                                    updateFormData("age", value.replace(/\D/g, "").slice(0, 2))
                                }
                                placeholder="18"
                                value={formData.age}
                            />
                        </View>
                    </View>

                    <FieldLabel label="Password" />
                    <Input
                        autoComplete="new-password"
                        error={fieldErrors.password}
                        icon={<Lock color={perk.mute} size={17} />}
                        onChangeText={(value: string) => updateFormData("password", value)}
                        placeholder="At least 8 characters"
                        secureTextEntry={!showPassword}
                        textContentType="newPassword"
                        trailing={
                            <TouchableOpacity onPress={() => setShowPassword((value) => !value)}>
                                {showPassword ? (
                                    <EyeOff color={perk.mute} size={18} />
                                ) : (
                                    <Eye color={perk.mute} size={18} />
                                )}
                            </TouchableOpacity>
                        }
                        value={formData.password}
                    />
                    <FieldLabel label="Confirm password" />
                    <Input
                        autoComplete="new-password"
                        error={fieldErrors.confirmPassword}
                        icon={<Lock color={perk.mute} size={17} />}
                        onChangeText={(value: string) => updateFormData("confirmPassword", value)}
                        placeholder="Repeat your password"
                        secureTextEntry={!showConfirmPassword}
                        textContentType="newPassword"
                        trailing={
                            <TouchableOpacity onPress={() => setShowConfirmPassword((value) => !value)}>
                                {showConfirmPassword ? (
                                    <EyeOff color={perk.mute} size={18} />
                                ) : (
                                    <Eye color={perk.mute} size={18} />
                                )}
                            </TouchableOpacity>
                        }
                        value={formData.confirmPassword}
                    />
                </View>

                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => void handleSignup()}
                    style={styles.createButton}
                >
                    <Text style={styles.createText}>Create account</Text>
                    <Text style={styles.arrow}>→</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

function FieldLabel({label}: {label: string}) {
    return <Text style={styles.label}>{label}</Text>;
}

function FieldError({message}: {message: string}) {
    return <Text accessibilityRole="alert" style={styles.fieldError}>{message}</Text>;
}

function Input({error, icon, trailing, ...props}: any) {
    return (
        <View style={styles.inputGroup}>
            <View style={[styles.inputShell, error && styles.inputShellError]}>
                {icon ? <View style={styles.leading}>{icon}</View> : null}
                <TextInput {...props} placeholderTextColor={perk.mute2} style={styles.input} />
                {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
            </View>
            {error ? <FieldError message={error} /> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {backgroundColor: perk.card, flex: 1},
    scrollContent: {paddingBottom: 36, paddingHorizontal: 22, paddingTop: 56},
    backButton: {alignItems: "center", backgroundColor: perk.surface, borderRadius: 19, height: 38, justifyContent: "center", marginBottom: 17, width: 38},
    title: {color: perk.ink, fontFamily: "PublicSans-ExtraBold", fontSize: 31, letterSpacing: -1, lineHeight: 35},
    form: {marginTop: 27},
    formError: {backgroundColor: perk.coral, borderRadius: 10, color: perk.ink, fontSize: 13, fontWeight: "800", lineHeight: 18, marginTop: 18, paddingHorizontal: 14, paddingVertical: 11},
    label: {color: perk.copper, fontFamily: "SpaceMono-Regular", fontSize: 10, fontWeight: "700", letterSpacing: 1.7, marginBottom: 8, textTransform: "uppercase"},
    nameRow: {flexDirection: "row", gap: 10},
    half: {flex: 1},
    inputGroup: {marginBottom: 18},
    inputShell: {alignItems: "center", backgroundColor: perk.card, borderColor: perk.ink, borderRadius: 14, borderWidth: 1.5, flexDirection: "row", height: 51},
    inputShellError: {borderColor: perk.coralDeep, borderWidth: 2},
    leading: {paddingLeft: 13, paddingRight: 9},
    input: {color: perk.ink, flex: 1, fontSize: 15, fontWeight: "600", height: "100%", paddingHorizontal: 13},
    trailing: {paddingRight: 13},
    demographicRow: {flexDirection: "row", gap: 10},
    gender: {flex: 1.25, zIndex: 2},
    age: {flex: 0.75},
    selectShell: {alignItems: "center", borderColor: perk.ink, borderRadius: 14, borderWidth: 1.5, flexDirection: "row", height: 51, justifyContent: "space-between", paddingHorizontal: 14},
    selectText: {color: perk.mute, fontSize: 15},
    selectedText: {color: perk.ink},
    dropdown: {backgroundColor: perk.card, borderColor: perk.rule16, borderRadius: 12, borderWidth: 1, elevation: 6, left: 0, paddingVertical: 4, position: "absolute", right: 0, shadowColor: perk.ink, shadowOpacity: 0.14, shadowRadius: 12, top: 72},
    dropdownOption: {paddingHorizontal: 14, paddingVertical: 12},
    dropdownText: {color: perk.ink, fontSize: 14, fontWeight: "700"},
    fieldError: {color: perk.coralDeep, fontSize: 12, fontWeight: "700", lineHeight: 17, marginTop: 6},
    createButton: {alignItems: "center", backgroundColor: perk.lime, borderRadius: 14, flexDirection: "row", height: 53, justifyContent: "space-between", marginTop: 20, paddingHorizontal: 20},
    createText: {color: perk.limeInk, fontSize: 15, fontWeight: "800"},
    arrow: {color: perk.limeInk, fontSize: 21, fontWeight: "800", lineHeight: 22},
});
