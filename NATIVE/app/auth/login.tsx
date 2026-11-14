import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    ArrowRight,
    Eye,
    EyeOff,
    Fingerprint,
    ScanFace,
} from "lucide-react-native";
import {
    CARD,
    COPPER_DEEP,
    INK,
    LIME,
    LIME_INK,
    MUTE,
    RED,
    RULE_16,
} from "@/app/_utils/colors";
import {Link, Stack} from "expo-router";
import React, {useEffect, useRef, useState} from "react";

import {KineticGreeting} from "@/components/auth/kineticGreeting";
import {PressableScale} from "@/components/auth/pressableScale";
import {usePasswordLogin} from "@/app/_utils/auth/usePasswordLogin";
import LoginLockout from "@/components/auth/lockout";
import LoginLoading from "@/components/auth/login";
import UpdateCheckerModal from "@/components/updateModal";
import {
    BiometricUnlock,
    getBiometricUnlock,
    isFaceLabel,
    useBiometricLabel,
} from "@/app/_utils/auth/biometricUnlock";
import useAuthStore from "@/app/_utils/auth/authStore";
import {useNetworkStatus} from "@/app/_utils/device/useNetworkStatus";
import {useSafeAreaInsets} from "react-native-safe-area-context";

// Pins the sign-in screen on so the animation can be watched without racing a
// real request. Development only — must be false on any branch that merges.
const PREVIEW_SIGNING_IN = false;

const PHONE_DIGITS = 9;

export default function LoginScreen() {
    const [phoneNumber, setPhoneNumber] = useState("+254");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<"phone" | "password" | null>(null);
    const {
        submit,
        error,
        setError,
        isSubmitting,
        isTallyAnimationVisible,
        isLockoutRestored,
        lockoutExpiresAt,
        handleLockoutComplete,
        handleTallyAnimationComplete,
    } = usePasswordLogin();
    const [biometricUnlock, setBiometricUnlock] = useState<BiometricUnlock>("off");
    const biometricLabel = useBiometricLabel();

    const {lock} = useAuthStore();

    const insets = useSafeAreaInsets();
    const phoneInput = useRef<TextInput>(null);
    const passwordInput = useRef<TextInput>(null);
    const isOffline = useNetworkStatus() === "offline";

    useEffect(() => {
        void getBiometricUnlock().then(setBiometricUnlock);
    }, []);

    const handleLogin = () => {
        if (nationalNumber.length === 0) {
            setError("Enter your phone number.");
            phoneInput.current?.focus();
            return;
        }
        if (nationalNumber.length < PHONE_DIGITS) {
            setError(`Your phone number needs ${PHONE_DIGITS} digits after +254.`);
            phoneInput.current?.focus();
            return;
        }
        if (!password) {
            setError("Enter your password.");
            passwordInput.current?.focus();
            return;
        }

        submit(phoneNumber, password);
    };

    // National number digits only (without the +254 country code).
    const nationalNumber = phoneNumber.replace(/^\+254/, "");
    // Shown in threes, the way the number is read out: 712 345 678.
    const groupedNumber = nationalNumber.replace(/(\d{3})(?=\d)/g, "$1 ");
    const handlePhoneChange = (text: string) => {
        const digits = text.replace(/[^0-9]/g, "").slice(0, PHONE_DIGITS);
        setPhoneNumber("+254" + digits);
        setError(null);
        // The number pad has no next key, so a full number moves on by itself.
        if (digits.length === PHONE_DIGITS && nationalNumber.length < PHONE_DIGITS) {
            passwordInput.current?.focus();
        }
    };
    const handlePasswordChange = (text: string) => {
        setPassword(text);
        setError(null);
    };

    if (!isLockoutRestored) return null;

    if (lockoutExpiresAt !== null) {
        return (
            <>
                <Stack.Screen options={{statusBarStyle: "auto"}} />
                <LoginLockout
                    lockoutExpiresAt={lockoutExpiresAt}
                    onComplete={handleLockoutComplete}
                />
            </>
        );
    }

    if (isTallyAnimationVisible || PREVIEW_SIGNING_IN) {
        return (
            <>
                <Stack.Screen options={{statusBarStyle: "auto"}} />
                <LoginLoading onTallyAnimationComplete={handleTallyAnimationComplete} />
            </>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <Stack.Screen options={{statusBarStyle: "dark"}} />
            <UpdateCheckerModal />

            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    {
                        paddingTop: insets.top + 40,
                        paddingBottom: Math.max(insets.bottom, 12) + 2,
                    },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                <KineticGreeting />

                <View style={styles.form}>
                    <Text style={styles.label}>Phone number</Text>
                    <Pressable
                        style={[
                            styles.fieldShell,
                            focusedField === "phone" && styles.fieldFocused,
                        ]}
                        onPress={() => phoneInput.current?.focus()}
                        accessible={false}
                    >
                        <View style={styles.prefix}>
                            <Text style={styles.flag}>🇰🇪</Text>
                            <Text style={styles.prefixText}>+254</Text>
                        </View>
                        <View style={styles.fieldBody}>
                            <TextInput
                                ref={phoneInput}
                                style={styles.fieldInput}
                                accessibilityLabel="Phone number"
                                placeholder="712 345 678"
                                placeholderTextColor={MUTE}
                                value={groupedNumber}
                                onChangeText={handlePhoneChange}
                                keyboardType="number-pad"
                                textContentType="telephoneNumber"
                                autoComplete="tel-national"
                                onFocus={() => setFocusedField("phone")}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>
                    </Pressable>

                    <Text style={[styles.label, styles.labelGap]}>Password</Text>
                    <Pressable
                        style={[
                            styles.fieldShell,
                            focusedField === "password" && styles.fieldFocused,
                        ]}
                        onPress={() => passwordInput.current?.focus()}
                        accessible={false}
                    >
                        <View style={[styles.fieldBody, styles.fieldBodyLead]}>
                            <TextInput
                                ref={passwordInput}
                                style={styles.fieldInput}
                                accessibilityLabel="Password"
                                value={password}
                                onChangeText={handlePasswordChange}
                                secureTextEntry={!showPassword}
                                textContentType="password"
                                autoComplete="current-password"
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="go"
                                onSubmitEditing={() => handleLogin()}
                                onFocus={() => setFocusedField("password")}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>
                        <TouchableOpacity
                            style={styles.trail}
                            onPress={() => setShowPassword(!showPassword)}
                            hitSlop={12}
                            accessibilityRole="button"
                            accessibilityLabel={
                                showPassword ? "Hide password" : "Show password"
                            }
                        >
                            {showPassword ? (
                                <EyeOff size={22} color={MUTE} strokeWidth={1.9} />
                            ) : (
                                <Eye size={22} color={MUTE} strokeWidth={1.9} />
                            )}
                        </TouchableOpacity>
                    </Pressable>

                    <Link href="/auth/forgot-password" asChild>
                        <TouchableOpacity style={styles.forgotRow} hitSlop={8}>
                            <Text style={styles.forgot}>Forgot password?</Text>
                        </TouchableOpacity>
                    </Link>

                    {isOffline ? (
                        <Text style={styles.offline} accessibilityLiveRegion="polite">
                            You&apos;re offline. Connect to the internet to sign in.
                        </Text>
                    ) : error ? (
                        <Text
                            style={styles.error}
                            accessibilityRole="alert"
                            accessibilityLiveRegion="assertive"
                        >
                            {error}
                        </Text>
                    ) : null}

                    <View style={styles.actions}>
                        <PressableScale
                            containerStyle={styles.primaryHost}
                            style={[
                                styles.primary,
                                (isSubmitting || isOffline) && styles.disabled,
                            ]}
                            onPress={() => handleLogin()}
                            disabled={isSubmitting || isOffline}
                            accessibilityRole="button"
                        >
                            <Text style={styles.primaryText}>
                                {isSubmitting ? "Signing in…" : "Sign in"}
                            </Text>
                            <ArrowRight size={20} color={LIME_INK} strokeWidth={2.4} />
                        </PressableScale>

                        {biometricUnlock === "on" ? (
                            <PressableScale
                                style={[styles.biometric, isOffline && styles.disabled]}
                                onPress={lock}
                                disabled={isOffline}
                                accessibilityRole="button"
                                accessibilityLabel={`Unlock with ${biometricLabel}`}
                            >
                                {isFaceLabel(biometricLabel) ? (
                                    <ScanFace size={26} color={INK} strokeWidth={1.9} />
                                ) : (
                                    <Fingerprint size={26} color={INK} strokeWidth={1.9} />
                                )}
                            </PressableScale>
                        ) : null}
                    </View>
                </View>

                <Text style={styles.disclaimer}>Citizen tally · Not an IEBC system</Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: CARD,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: 24,
    },
    form: {
        marginTop: 24,
    },
    // Pushed to the foot of the screen.
    disclaimer: {
        marginTop: "auto",
        paddingTop: 24,
        textAlign: "center",
        fontFamily: "SpaceMono-Regular",
        fontSize: 10.5,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        color: MUTE,
    },
    label: {
        marginBottom: 6,
        marginLeft: 2,
        fontSize: 14,
        lineHeight: 18,
        fontWeight: "600",
        color: INK,
    },
    labelGap: {
        marginTop: 12,
    },
    // White fields drawn with a line, not a grey fill: the sheet stays one
    // clean surface and the focused field is the only heavy stroke on it.
    fieldShell: {
        flexDirection: "row",
        alignItems: "stretch",
        minHeight: 58,
        backgroundColor: CARD,
        borderWidth: 1.5,
        borderColor: RULE_16,
        borderRadius: 16,
        overflow: "hidden",
    },
    fieldFocused: {
        borderColor: INK,
    },
    prefix: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        borderRightWidth: 1,
        borderRightColor: RULE_16,
    },
    flag: {
        fontSize: 18,
    },
    prefixText: {
        fontSize: 17,
        fontWeight: "700",
        color: INK,
    },
    fieldBody: {
        flex: 1,
        minWidth: 0,
        justifyContent: "center",
        paddingHorizontal: 14,
    },
    fieldBodyLead: {
        paddingLeft: 16,
    },
    fieldInput: {
        padding: 0,
        fontSize: 18,
        fontWeight: "600",
        color: INK,
        letterSpacing: 0.2,
    },
    trail: {
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    forgotRow: {
        alignSelf: "flex-end",
        marginTop: 12,
    },
    forgot: {
        fontSize: 15,
        fontWeight: "700",
        color: INK,
    },
    offline: {
        marginTop: 18,
        fontSize: 14,
        fontWeight: "700",
        lineHeight: 20,
        color: COPPER_DEEP,
    },
    error: {
        marginTop: 18,
        fontSize: 14,
        fontWeight: "700",
        lineHeight: 20,
        color: RED,
    },
    actions: {
        marginTop: 28,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    primaryHost: {
        flex: 1,
    },
    primary: {
        height: 60,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: LIME,
        borderRadius: 999,
        paddingHorizontal: 24,
    },
    primaryText: {
        fontSize: 18,
        lineHeight: 22,
        fontWeight: "800",
        color: LIME_INK,
    },
    biometric: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: RULE_16,
    },
    disabled: {
        opacity: 0.6,
    },
});
