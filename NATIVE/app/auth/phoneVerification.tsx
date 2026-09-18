import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {ArrowLeft, ArrowRight} from "lucide-react-native";
import React, {useEffect, useMemo, useState} from "react";
import {router, useLocalSearchParams} from "expo-router";

import ExistingAccountRecovery from "@/components/auth/existingAccountRecovery";
import {
    PhoneVerificationRequestError,
    startSignupPhoneVerification,
    verifyPhoneCode,
} from "@/app/_utils/phoneVerification";
import {useSignupVerificationStore} from "@/app/_utils/signupVerificationStore";
import {INK, LIME, LIME_INK, MUTE, MUTE_2, PAPER, RED, RULE_16, SURFACE} from "@/app/_utils/colors";
import {useSafeAreaInsets} from "react-native-safe-area-context";

type Challenge = {
    expiresAt: number;
    id: string;
};

function nationalDigits(value: string) {
    const digits = value.replace(/\D/g, "");
    return (digits.startsWith("254") ? digits.slice(3) : digits)
        .replace(/^0+/, "")
        .slice(0, 9);
}

function formatPhone(value: string) {
    return value.replace(/(\d{3})(?=\d)/g, "$1 ");
}

function maskedPhone(phoneDigits: string) {
    return `+254 ••• ••• ${phoneDigits.slice(-3)}`;
}

function clock(seconds: number) {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function useSecondsUntil(deadline: number | null) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!deadline) return;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [deadline]);

    return deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null;
}

export default function PhoneVerificationScreen() {
    const insets = useSafeAreaInsets();
    const {pollingCenter, ward} = useLocalSearchParams<{
        pollingCenter?: string;
        ward?: string;
    }>();
    const clearVerificationTicket = useSignupVerificationStore(
        (state) => state.clearVerificationTicket,
    );
    const setVerificationTicket = useSignupVerificationStore(
        (state) => state.setVerificationTicket,
    );
    const [phoneDigits, setPhoneDigits] = useState("");
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [existingAccount, setExistingAccount] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const expiresInSeconds = useSecondsUntil(challenge?.expiresAt ?? null);
    const hasExpired = expiresInSeconds === 0;
    const canContinue = Boolean(ward && pollingCenter);

    useEffect(() => {
        clearVerificationTicket();
    }, [clearVerificationTicket]);

    useEffect(() => {
        if (!canContinue) {
            router.replace("/auth/signUp");
        }
    }, [canContinue]);

    const formattedPhone = useMemo(() => formatPhone(phoneDigits), [phoneDigits]);

    if (!canContinue) return null;

    const sendCode = async () => {
        if (phoneDigits.length !== 9) {
            setError("Enter a Kenyan mobile number with nine digits after +254.");
            return;
        }

        setError(null);
        setExistingAccount(false);
        setIsSending(true);
        try {
            const result = await startSignupPhoneVerification(`+254${phoneDigits}`);
            const now = Date.now();
            setChallenge({
                expiresAt: now + result.expires_in_seconds * 1000,
                id: result.challenge_id,
            });
            setCode("");
        } catch (requestError) {
            const error = requestError as PhoneVerificationRequestError;
            setError(error.message);
        } finally {
            setIsSending(false);
        }
    };

    const verifyCode = async () => {
        if (!challenge || code.length !== 6) {
            setError("Enter the six-digit code from your SMS.");
            return;
        }
        if (hasExpired) {
            setError("That code has expired. Send a new one to continue.");
            return;
        }

        setError(null);
        setIsVerifying(true);
        try {
            const result = await verifyPhoneCode(challenge.id, code);
            if (result.outcome === "existing_account") {
                setChallenge(null);
                setCode("");
                setExistingAccount(true);
                return;
            }
            setVerificationTicket(result.verification_ticket);
            router.replace({
                pathname: "/auth/signUpForm",
                params: {pollingCenter, ward},
            });
        } catch (requestError) {
            setError((requestError as PhoneVerificationRequestError).message);
        } finally {
            setIsVerifying(false);
        }
    };

    const useAnotherNumber = () => {
        setChallenge(null);
        setCode("");
        setError(null);
        setExistingAccount(false);
    };

    return (
        <View style={styles.screen}>
            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    {paddingBottom: insets.bottom + 28, paddingTop: insets.top + 18},
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {existingAccount ? (
                    <ExistingAccountRecovery
                        onResetPassword={() => router.replace("/auth/forgot-password")}
                        onSignIn={() => router.replace("/auth/login")}
                        onUseAnotherNumber={useAnotherNumber}
                    />
                ) : challenge ? (
                    <CodeStep
                        code={code}
                        error={error}
                        expiresInSeconds={expiresInSeconds ?? 0}
                        hasExpired={hasExpired}
                        isSending={isSending}
                        isVerifying={isVerifying}
                        onChangeNumber={useAnotherNumber}
                        onCodeChange={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
                        onResend={() => void sendCode()}
                        onVerify={() => void verifyCode()}
                        phoneNumber={maskedPhone(phoneDigits)}
                    />
                ) : (
                    <PhoneStep
                        error={error}
                        formattedPhone={formattedPhone}
                        isSending={isSending}
                        onBack={() => router.replace("/auth/signUp")}
                        onPhoneChange={(value) => setPhoneDigits(nationalDigits(value))}
                        onSend={() => void sendCode()}
                    />
                )}
            </ScrollView>
        </View>
    );
}

function PhoneStep({
    error,
    formattedPhone,
    isSending,
    onBack,
    onPhoneChange,
    onSend,
}: {
    error: string | null;
    formattedPhone: string;
    isSending: boolean;
    onBack: () => void;
    onPhoneChange: (value: string) => void;
    onSend: () => void;
}) {
    return (
        <View style={styles.flow}>
            <Text style={styles.title}>Your phone, first.</Text>
            <Text style={styles.subtitle}>
                We&apos;ll send a six-digit code before collecting your account details.
            </Text>

            <View style={styles.field}>
                <Text style={styles.label}>Phone number</Text>
                <View style={styles.phoneShell}>
                    <View style={styles.prefix}>
                        <Text accessibilityElementsHidden style={styles.flag}>
                            🇰🇪
                        </Text>
                        <Text style={styles.prefixText}>+254</Text>
                    </View>
                    <TextInput
                        accessibilityLabel="Phone number after +254"
                        autoFocus
                        autoComplete="tel"
                        keyboardType="phone-pad"
                        maxLength={16}
                        onChangeText={onPhoneChange}
                        placeholder="712 345 678"
                        placeholderTextColor={MUTE_2}
                        returnKeyType="send"
                        style={styles.phoneInput}
                        value={formattedPhone}
                    />
                </View>
                {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            </View>

            <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{disabled: isSending}}
                activeOpacity={0.85}
                disabled={isSending}
                onPress={onSend}
                style={[styles.primaryButton, isSending && styles.buttonDisabled]}
            >
                {isSending ? <ActivityIndicator color={LIME_INK} /> : <><Text style={styles.primaryText}>Send six-digit code</Text><ArrowRight color={LIME_INK} size={18} strokeWidth={2.4} /></>}
            </TouchableOpacity>

            <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.75}
                onPress={onBack}
                style={styles.backButton}
            >
                <ArrowLeft color={MUTE} size={17} strokeWidth={2} />
                <Text style={styles.backButtonText}>Back to location</Text>
            </TouchableOpacity>
        </View>
    );
}

function CodeStep({
    code,
    error,
    expiresInSeconds,
    hasExpired,
    isSending,
    isVerifying,
    onChangeNumber,
    onCodeChange,
    onResend,
    onVerify,
    phoneNumber,
}: {
    code: string;
    error: string | null;
    expiresInSeconds: number;
    hasExpired: boolean;
    isSending: boolean;
    isVerifying: boolean;
    onChangeNumber: () => void;
    onCodeChange: (value: string) => void;
    onResend: () => void;
    onVerify: () => void;
    phoneNumber: string;
}) {
    const canResend = hasExpired && !isSending;

    return (
        <View style={styles.flow}>
            <Text style={styles.title}>Check your messages.</Text>
            <Text style={styles.subtitle}>
                Enter the six-digit code sent to {phoneNumber}.
            </Text>

            <View style={styles.field}>
                <Text style={styles.label}>Six-digit code</Text>
                <View style={styles.otpShell}>
                    <TextInput
                        accessibilityLabel="Six-digit verification code"
                        autoFocus
                        autoComplete="sms-otp"
                        caretHidden
                        keyboardType="number-pad"
                        maxLength={6}
                        onChangeText={onCodeChange}
                        style={styles.otpHiddenInput}
                        textContentType="oneTimeCode"
                        value={code}
                    />
                    <View pointerEvents="none" style={styles.otpCells}>
                        {Array.from({length: 6}, (_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.otpCell,
                                    code[index] && styles.otpCellFilled,
                                    index === code.length && code.length < 6 && styles.otpCellActive,
                                ]}
                            >
                                <Text style={styles.otpDigit}>{code[index] ?? ""}</Text>
                            </View>
                        ))}
                    </View>
                </View>
                <Text style={styles.codeHelp}>
                    {hasExpired
                        ? "This code has expired. Request another one below."
                        : `Code expires in ${clock(expiresInSeconds)}.`}
                </Text>
                {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            </View>

            <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{disabled: isVerifying || code.length !== 6 || hasExpired}}
                activeOpacity={0.85}
                disabled={isVerifying || code.length !== 6 || hasExpired}
                onPress={onVerify}
                style={[
                    styles.primaryButton,
                    (isVerifying || code.length !== 6 || hasExpired) && styles.buttonDisabled,
                ]}
            >
                {isVerifying ? <ActivityIndicator color={LIME_INK} /> : <><Text style={styles.primaryText}>Verify and continue</Text><ArrowRight color={LIME_INK} size={18} strokeWidth={2.4} /></>}
            </TouchableOpacity>

            <View style={styles.codeActions}>
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityState={{disabled: !canResend}}
                    disabled={!canResend}
                    onPress={onResend}
                    style={styles.textAction}
                >
                    <Text style={[styles.textActionText, !canResend && styles.textActionDisabled]}>
                        {isSending ? "Sending…" : "Resend code"}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" onPress={onChangeNumber} style={styles.textAction}>
                    <Text style={styles.textActionText}>Change number</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {backgroundColor: PAPER, flex: 1},
    content: {alignItems: "center", flexGrow: 1, paddingHorizontal: 22},
    flow: {maxWidth: 430, paddingTop: 56, width: "100%"},
    title: {color: INK, fontFamily: "PublicSans-ExtraBold", fontSize: 34, letterSpacing: -1.2, lineHeight: 38, textAlign: "center"},
    subtitle: {color: MUTE, fontSize: 15, lineHeight: 22, marginTop: 8, textAlign: "center"},
    field: {marginTop: 34},
    label: {color: MUTE, fontFamily: "SpaceMono-Regular", fontSize: 10, fontWeight: "700", letterSpacing: 1.6, marginBottom: 9, textTransform: "uppercase"},
    phoneShell: {alignItems: "center", backgroundColor: PAPER, borderColor: INK, borderRadius: 14, borderWidth: 1.5, flexDirection: "row", height: 54, overflow: "hidden"},
    prefix: {alignItems: "center", alignSelf: "stretch", backgroundColor: SURFACE, borderRightColor: RULE_16, borderRightWidth: 1, flexDirection: "row", gap: 7, justifyContent: "center", paddingHorizontal: 13},
    flag: {fontSize: 16},
    prefixText: {color: INK, fontFamily: "SpaceMono-Regular", fontSize: 14, fontWeight: "700"},
    phoneInput: {color: INK, flex: 1, fontSize: 16, fontWeight: "600", height: "100%", paddingHorizontal: 14},
    error: {color: RED, fontSize: 13, fontWeight: "700", lineHeight: 19, marginTop: 10},
    primaryButton: {alignItems: "center", backgroundColor: LIME, borderRadius: 14, flexDirection: "row", height: 54, justifyContent: "space-between", marginTop: 22, paddingHorizontal: 20},
    primaryText: {color: LIME_INK, fontSize: 15, fontWeight: "800"},
    buttonDisabled: {opacity: 0.48},
    backButton: {alignItems: "center", borderColor: RULE_16, borderRadius: 14, borderWidth: 1, flexDirection: "row", height: 54, justifyContent: "center", marginTop: 10, paddingHorizontal: 20},
    backButtonText: {color: MUTE, flex: 1, fontSize: 14, fontWeight: "800", textAlign: "center", transform: [{translateX: -8}]},
    otpShell: {height: 60, position: "relative"},
    otpHiddenInput: {bottom: 0, color: "transparent", fontSize: 1, left: 0, position: "absolute", right: 0, top: 0, zIndex: 1},
    otpCells: {flexDirection: "row", gap: 8, height: "100%"},
    otpCell: {alignItems: "center", backgroundColor: PAPER, borderColor: RULE_16, borderRadius: 10, borderWidth: 1, flex: 1, justifyContent: "center"},
    otpCellFilled: {borderColor: INK, borderWidth: 1.5},
    otpCellActive: {borderColor: LIME_INK, borderWidth: 2},
    otpDigit: {color: INK, fontFamily: "SpaceMono-Regular", fontSize: 20, fontWeight: "700"},
    codeHelp: {color: MUTE, fontSize: 13, lineHeight: 19, marginTop: 10},
    codeActions: {flexDirection: "row", justifyContent: "space-between", marginTop: 18},
    textAction: {paddingVertical: 9},
    textActionText: {color: INK, fontFamily: "SpaceMono-Regular", fontSize: 11, fontWeight: "700", textDecorationLine: "underline"},
    textActionDisabled: {color: MUTE, textDecorationLine: "none"},
});
