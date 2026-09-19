import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail} from "lucide-react-native";
import React, {useEffect, useMemo, useState} from "react";

import {router} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {
    CARD,
    COPPER,
    COPPER_DEEP,
    INK,
    LIME,
    LIME_INK,
    MUTE,
    MUTE_2,
    PAPER,
    RED,
    RULE_16,
    SURFACE,
} from "../_utils/colors";
import {
    completePasswordReset,
    PhoneVerificationRequestError,
    startPasswordResetVerification,
    verifyPhoneCode,
} from "../_utils/phoneVerification";

type Challenge = {
    expiresAt: number;
    id: string;
};

type Step = "phone" | "code" | "password" | "complete";

function clock(seconds: number) {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatPhone(value: string) {
    return value.replace(/(\d{3})(?=\d)/g, "$1 ");
}

function maskedPhone(phoneDigits: string) {
    return `+254 ••• ••• ${phoneDigits.slice(-3)}`;
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

export default function ForgotPasswordScreen() {
    const [step, setStep] = useState<Step>("phone");
    const [phoneDigits, setPhoneDigits] = useState("");
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [code, setCode] = useState("");
    const [verificationTicket, setVerificationTicket] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const insets = useSafeAreaInsets();
    const expiresInSeconds = useSecondsUntil(challenge?.expiresAt ?? null);
    const hasExpired = expiresInSeconds === 0;
    const formattedPhone = useMemo(() => formatPhone(phoneDigits), [phoneDigits]);

    const handlePhoneChange = (text: string) => {
        const digits = text.replace(/[^0-9]/g, "").slice(0, 9);
        setPhoneDigits(digits);
    };

    const sendCode = async () => {
        if (phoneDigits.length !== 9) {
            setError("Enter a Kenyan mobile number with nine digits after +254.");
            return;
        }

        setError(null);
        setIsSending(true);
        try {
            const result = await startPasswordResetVerification(`+254${phoneDigits}`);
            setChallenge({
                expiresAt: Date.now() + result.expires_in_seconds * 1000,
                id: result.challenge_id,
            });
            setCode("");
            setStep("code");
        } catch (requestError) {
            setError((requestError as PhoneVerificationRequestError).message);
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
            if (result.outcome !== "verified") {
                setError("This verification cannot reset your password. Start again.");
                return;
            }
            setVerificationTicket(result.verification_ticket);
            setStep("password");
        } catch (requestError) {
            setError((requestError as PhoneVerificationRequestError).message);
        } finally {
            setIsVerifying(false);
        }
    };

    const updatePassword = async () => {
        if (!verificationTicket) {
            startAgain();
            setError("This verification has expired. Start again.");
            return;
        }
        if (newPassword.length < 8) {
            setError("Your password needs at least 8 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("The passwords do not match.");
            return;
        }

        setError(null);
        setIsResetting(true);
        try {
            await completePasswordReset(verificationTicket, newPassword);
            setVerificationTicket(null);
            setStep("complete");
        } catch (requestError) {
            setError((requestError as PhoneVerificationRequestError).message);
        } finally {
            setIsResetting(false);
        }
    };

    const startAgain = () => {
        setChallenge(null);
        setCode("");
        setVerificationTicket(null);
        setNewPassword("");
        setConfirmPassword("");
        setError(null);
        setStep("phone");
    };

    return (
        <View style={styles.screen}>
            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    {
                        paddingTop: insets.top + 12,
                        paddingBottom: insets.bottom + 28,
                    },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {step === "complete" ? (
                    <CompleteStep onSignIn={() => router.replace("/auth/login")} />
                ) : step === "password" ? (
                    <PasswordStep
                        confirmPassword={confirmPassword}
                        error={error}
                        isResetting={isResetting}
                        newPassword={newPassword}
                        onConfirmPasswordChange={setConfirmPassword}
                        onNewPasswordChange={setNewPassword}
                        onResetPassword={() => void updatePassword()}
                        onToggleConfirmPassword={() => setShowConfirmPassword((value) => !value)}
                        onToggleNewPassword={() => setShowNewPassword((value) => !value)}
                        showConfirmPassword={showConfirmPassword}
                        showNewPassword={showNewPassword}
                    />
                ) : step === "code" ? (
                    <CodeStep
                        code={code}
                        error={error}
                        expiresInSeconds={expiresInSeconds ?? 0}
                        hasExpired={hasExpired}
                        isSending={isSending}
                        isVerifying={isVerifying}
                        onChangeNumber={startAgain}
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
                        onBack={() => router.back()}
                        onPhoneChange={handlePhoneChange}
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
            <TouchableOpacity accessibilityRole="button" hitSlop={8} onPress={onBack} style={styles.back}>
                <ArrowLeft color={INK} size={22} strokeWidth={2.2} />
            </TouchableOpacity>
            <View style={styles.hero}>
                <View style={styles.iconCircle}>
                    <Mail color={COPPER_DEEP} size={34} strokeWidth={1.8} />
                </View>
                <Text style={styles.heading}>Forgot password?</Text>
                <Text style={styles.subtitle}>
                    Enter your number and we&apos;ll send a six-digit code if it has an account.
                </Text>
            </View>
            <View style={styles.field}>
                <Text style={styles.label}>Phone number</Text>
                <View style={styles.phoneInput}>
                    <View style={styles.prefix}>
                        <Text accessibilityElementsHidden style={styles.flag}>🇰🇪</Text>
                        <Text style={styles.prefixText}>+254</Text>
                    </View>
                    <TextInput
                        accessibilityLabel="Phone number after +254"
                        autoComplete="tel"
                        autoFocus
                        keyboardType="phone-pad"
                        maxLength={16}
                        onChangeText={onPhoneChange}
                        placeholder="712 345 678"
                        placeholderTextColor={MUTE_2}
                        returnKeyType="send"
                        style={styles.phoneField}
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
                style={[styles.primary, isSending && styles.buttonDisabled]}
            >
                {isSending ? <ActivityIndicator color={LIME_INK} /> : <><Text style={styles.primaryText}>Send six-digit code</Text><ArrowRight color={LIME_INK} size={18} strokeWidth={2.4} /></>}
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" onPress={onBack} style={styles.backLink}>
                <Text style={styles.backLinkText}>Back to sign in</Text>
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
            <Text style={styles.stepHeading}>Check your messages.</Text>
            <Text style={styles.stepSubtitle}>Enter the six-digit code sent to {phoneNumber}.</Text>
            <View style={styles.field}>
                <Text style={styles.label}>Six-digit code</Text>
                <View style={styles.otpShell}>
                    <TextInput
                        accessibilityLabel="Six-digit verification code"
                        autoComplete="sms-otp"
                        autoFocus
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
                            <View key={index} style={[styles.otpCell, code[index] && styles.otpCellFilled, index === code.length && code.length < 6 && styles.otpCellActive]}>
                                <Text style={styles.otpDigit}>{code[index] ?? ""}</Text>
                            </View>
                        ))}
                    </View>
                </View>
                <Text style={styles.codeHelp}>
                    {hasExpired ? "This code has expired. Request another one below." : `Code expires in ${clock(expiresInSeconds)}.`}
                </Text>
                {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            </View>
            <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{disabled: isVerifying || code.length !== 6 || hasExpired}}
                activeOpacity={0.85}
                disabled={isVerifying || code.length !== 6 || hasExpired}
                onPress={onVerify}
                style={[styles.primary, (isVerifying || code.length !== 6 || hasExpired) && styles.buttonDisabled]}
            >
                {isVerifying ? <ActivityIndicator color={LIME_INK} /> : <><Text style={styles.primaryText}>Verify and continue</Text><ArrowRight color={LIME_INK} size={18} strokeWidth={2.4} /></>}
            </TouchableOpacity>
            <View style={styles.codeActions}>
                <TouchableOpacity accessibilityRole="button" accessibilityState={{disabled: !canResend}} disabled={!canResend} onPress={onResend} style={styles.textAction}>
                    <Text style={[styles.textActionText, !canResend && styles.textActionDisabled]}>{isSending ? "Sending…" : "Resend code"}</Text>
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" onPress={onChangeNumber} style={styles.textAction}>
                    <Text style={styles.textActionText}>Change number</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function PasswordStep({
    confirmPassword,
    error,
    isResetting,
    newPassword,
    onConfirmPasswordChange,
    onNewPasswordChange,
    onResetPassword,
    onToggleConfirmPassword,
    onToggleNewPassword,
    showConfirmPassword,
    showNewPassword,
}: {
    confirmPassword: string;
    error: string | null;
    isResetting: boolean;
    newPassword: string;
    onConfirmPasswordChange: (value: string) => void;
    onNewPasswordChange: (value: string) => void;
    onResetPassword: () => void;
    onToggleConfirmPassword: () => void;
    onToggleNewPassword: () => void;
    showConfirmPassword: boolean;
    showNewPassword: boolean;
}) {
    return (
        <View style={styles.flow}>
            <Text style={styles.stepHeading}>Set a new password.</Text>
            <View style={styles.passwordFields}>
                <PasswordField label="New password" onChangeText={onNewPasswordChange} onToggleVisibility={onToggleNewPassword} showPassword={showNewPassword} value={newPassword} />
                <PasswordField label="Confirm new password" onChangeText={onConfirmPasswordChange} onToggleVisibility={onToggleConfirmPassword} showPassword={showConfirmPassword} value={confirmPassword} />
            </View>
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <TouchableOpacity accessibilityRole="button" accessibilityState={{disabled: isResetting || !newPassword || !confirmPassword}} activeOpacity={0.85} disabled={isResetting || !newPassword || !confirmPassword} onPress={onResetPassword} style={[styles.primary, (isResetting || !newPassword || !confirmPassword) && styles.buttonDisabled]}>
                {isResetting ? <ActivityIndicator color={LIME_INK} /> : <><Text style={styles.primaryText}>Update password</Text><ArrowRight color={LIME_INK} size={18} strokeWidth={2.4} /></>}
            </TouchableOpacity>
        </View>
    );
}

function PasswordField({
    label,
    onChangeText,
    onToggleVisibility,
    showPassword,
    value,
}: {
    label: string;
    onChangeText: (value: string) => void;
    onToggleVisibility: () => void;
    showPassword: boolean;
    value: string;
}) {
    return (
        <View style={styles.passwordField}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.passwordInput}>
                <Lock color={MUTE} size={18} strokeWidth={1.8} style={styles.lock} />
                <TextInput autoComplete="new-password" onChangeText={onChangeText} placeholder="At least 8 characters" placeholderTextColor={MUTE_2} secureTextEntry={!showPassword} style={styles.passwordTextInput} textContentType="newPassword" value={value} />
                <TouchableOpacity accessibilityLabel={showPassword ? "Hide password" : "Show password"} accessibilityRole="button" hitSlop={8} onPress={onToggleVisibility} style={styles.visibilityButton}>
                    {showPassword ? <EyeOff color={MUTE} size={19} strokeWidth={1.8} /> : <Eye color={MUTE} size={19} strokeWidth={1.8} />}
                </TouchableOpacity>
            </View>
        </View>
    );
}

function CompleteStep({onSignIn}: {onSignIn: () => void}) {
    return (
        <View style={styles.complete}>
            <View style={styles.iconCircle}>
                <Lock color={COPPER_DEEP} size={34} strokeWidth={1.8} />
            </View>
            <Text style={styles.heading}>Password updated.</Text>
            <Text style={styles.subtitle}>You can now sign in with your new password.</Text>
            <TouchableOpacity accessibilityRole="button" activeOpacity={0.85} onPress={onSignIn} style={styles.primary}>
                <Text style={styles.primaryText}>Sign in</Text>
                <ArrowRight color={LIME_INK} size={18} strokeWidth={2.4} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: PAPER,
    },
    content: {
        alignItems: "center",
        flexGrow: 1,
        paddingHorizontal: 24,
    },
    flow: {maxWidth: 430, paddingTop: 12, width: "100%"},
    back: {
        alignSelf: "flex-start",
        marginLeft: -4,
        padding: 4,
    },
    hero: {
        alignItems: "center",
        marginTop: 40,
    },
    iconCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: RULE_16,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 26,
    },
    heading: {
        fontSize: 28,
        fontWeight: "900",
        letterSpacing: -0.6,
        color: INK,
        textAlign: "center",
    },
    subtitle: {
        marginTop: 12,
        fontSize: 14,
        lineHeight: 21,
        color: MUTE,
        textAlign: "center",
        paddingHorizontal: 6,
    },
    field: {
        marginTop: 40,
        gap: 10,
    },
    label: {
        fontSize: 10.5,
        fontWeight: "700",
        letterSpacing: 2,
        textTransform: "uppercase",
        color: COPPER,
    },
    phoneInput: {
        flexDirection: "row",
        alignItems: "stretch",
        backgroundColor: CARD,
        borderWidth: 1.5,
        borderColor: INK,
        borderRadius: 14,
        overflow: "hidden",
    },
    prefix: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        backgroundColor: SURFACE,
        borderRightWidth: 1,
        borderRightColor: RULE_16,
    },
    flag: {
        fontSize: 16,
    },
    prefixText: {
        fontSize: 14,
        fontWeight: "700",
        color: INK,
        letterSpacing: 0.5,
    },
    phoneField: {
        flex: 1,
        minWidth: 0,
        paddingHorizontal: 14,
        paddingVertical: 16,
        fontSize: 16,
        fontWeight: "600",
        color: INK,
        letterSpacing: 0.3,
    },
    primary: {
        marginTop: 28,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        backgroundColor: LIME,
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 22,
    },
    primaryText: {
        fontSize: 15,
        fontWeight: "800",
        color: LIME_INK,
    },
    backLink: {
        marginTop: 22,
        alignSelf: "center",
        paddingVertical: 6,
    },
    backLinkText: {
        fontSize: 13,
        fontWeight: "800",
        color: COPPER_DEEP,
    },
    buttonDisabled: {opacity: 0.48},
    codeActions: {flexDirection: "row", justifyContent: "space-between", marginTop: 18},
    codeHelp: {color: MUTE, fontSize: 13, lineHeight: 19, marginTop: 10},
    complete: {alignItems: "center", maxWidth: 430, paddingTop: 72, width: "100%"},
    error: {color: RED, fontSize: 13, fontWeight: "700", lineHeight: 19, marginTop: 10},
    otpCell: {alignItems: "center", backgroundColor: CARD, borderColor: RULE_16, borderRadius: 10, borderWidth: 1, flex: 1, justifyContent: "center"},
    otpCellActive: {borderColor: LIME_INK, borderWidth: 2},
    otpCellFilled: {borderColor: INK, borderWidth: 1.5},
    otpCells: {flexDirection: "row", gap: 8, height: "100%"},
    otpDigit: {color: INK, fontFamily: "SpaceMono-Regular", fontSize: 20, fontWeight: "700"},
    otpHiddenInput: {bottom: 0, color: "transparent", fontSize: 1, left: 0, position: "absolute", right: 0, top: 0, zIndex: 1},
    otpShell: {height: 60, position: "relative"},
    passwordField: {gap: 10},
    passwordFields: {gap: 26, marginTop: 36},
    passwordInput: {alignItems: "center", backgroundColor: CARD, borderColor: INK, borderRadius: 14, borderWidth: 1.5, flexDirection: "row", height: 54},
    passwordTextInput: {color: INK, flex: 1, fontSize: 16, fontWeight: "600", height: "100%", paddingHorizontal: 12},
    lock: {marginLeft: 14},
    stepHeading: {color: INK, fontFamily: "PublicSans-ExtraBold", fontSize: 34, letterSpacing: -1.2, lineHeight: 38, marginTop: 62, textAlign: "center"},
    stepSubtitle: {color: MUTE, fontSize: 15, lineHeight: 22, marginTop: 8, textAlign: "center"},
    textAction: {paddingVertical: 9},
    textActionDisabled: {color: MUTE, textDecorationLine: "none"},
    textActionText: {color: INK, fontFamily: "SpaceMono-Regular", fontSize: 11, fontWeight: "700", textDecorationLine: "underline"},
    visibilityButton: {paddingRight: 14},
});
