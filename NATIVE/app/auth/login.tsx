import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";
import {
    ArrowRight,
    Eye,
    EyeOff,
    Fingerprint,
    Lock,
    ScanFace,
} from "lucide-react-native";
import {
    CARD,
    COPPER,
    COPPER_DEEP,
    INK,
    LIME,
    LIME_INK,
    MUTE,
    MUTE_2,
    RULE_16,
    SURFACE,
} from "../_utils/colors";
import {Link, router} from "expo-router";
import React, {useCallback, useEffect, useRef, useState} from "react";

import {LOGIN_SCREEN_GREETINGS as GREETINGS} from "../_utils/auth/greetings";
import LoginLockout from "@/components/auth/lockout";
import LoginLoading from "@/components/auth/login";
import UpdateCheckerModal from "../_utils/updateModal";
import {apiBaseURL} from "../_utils/apiBaseURL";
import {
    afterPasswordSignIn,
    BiometricUnlock,
    getBiometricUnlock,
    useBiometricLabel,
} from "../_utils/biometricUnlock";
import {
    deleteFromSecureStore,
    getFromSecureStore,
    saveToSecureStore,
} from "../_utils/secureStore";
import useAuthStore from "../_utils/authStore";
import {useNetworkStatus} from "../_utils/useNetworkStatus";
import {useSafeAreaInsets} from "react-native-safe-area-context";

// Pins the sign-in screen on so the animation can be watched without racing a
// real request. Development only — must be false on any branch that merges.
const PREVIEW_SIGNING_IN = false;

const HEADING_LINE_HEIGHT = 38;
// Mask is taller than the text line so Gĩkũyũ/Kĩkamba diacritics (ĩ, ũ) and bold
// ascenders are not shaved by overflow:hidden. Slide distance = mask height.
const GREETING_MASK_HEIGHT = 48;
const SWAP_MS = 480;
const CHAR_STAGGER_MS = 22;
const HOLD_MS = 1800;
const LONGEST_GREETING = Math.max(...GREETINGS.map((g) => g.length));
const PASSWORD_LOGIN_LOCKOUT_EXPIRY_KEY = "passwordLoginLockoutExpiry";

function getRemainingLockoutSeconds(lockoutExpiresAt: number) {
    return Math.max(0, Math.ceil((lockoutExpiresAt - Date.now()) / 1000));
}

// Offsets are in mask heights: 1 is parked below the clip, 0 is on screen, -1
// has left through the top.
type Slot = {text: string; offset: number; animated: boolean};

function GreetingChar({
    char,
    index,
    offset,
    animated,
}: {
    char: string;
    index: number;
    offset: number;
    animated: boolean;
}) {
    const y = useSharedValue(offset);

    useEffect(() => {
        y.value = animated
            ? withDelay(
                  index * CHAR_STAGGER_MS,
                  withTiming(offset, {
                      duration: SWAP_MS,
                      easing: Easing.out(Easing.cubic),
                  }),
              )
            : offset;
        // y is a stable shared value; listing it would make this a hook
        // argument, which the immutability rule forbids assigning to.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [offset, animated, index]);

    const style = useAnimatedStyle(() => ({
        transform: [{translateY: y.value * GREETING_MASK_HEIGHT}],
    }));

    return (
        <Animated.Text style={[styles.heading, styles.greetingChar, style]}>
            {char === " " ? " " : char}
        </Animated.Text>
    );
}

function GreetingRow({slot}: {slot: Slot}) {
    return (
        <View style={styles.greetingRow}>
            {Array.from(slot.text).map((char, i) => (
                <GreetingChar
                    key={i}
                    char={char}
                    index={i}
                    offset={slot.offset}
                    animated={slot.animated}
                />
            ))}
        </View>
    );
}

// Two rows leapfrog forever: both slide up one mask height, then whichever one
// has left the top is recycled to the bottom carrying the next greeting. The
// recycled row is outside the clip when its text and position change, so that
// jump can never be seen — which is the whole point, since a row that swapped
// text on screen would flash for a frame.
function KineticGreeting() {
    const [cycle, setCycle] = useState(0);
    const nextGreeting = useRef(2 % GREETINGS.length);
    const [slots, setSlots] = useState<Slot[]>(() => [
        {text: GREETINGS[0], offset: 0, animated: false},
        {text: GREETINGS[1 % GREETINGS.length], offset: 1, animated: false},
    ]);

    useEffect(() => {
        const swapMs = SWAP_MS + LONGEST_GREETING * CHAR_STAGGER_MS;

        const slide = setTimeout(() => {
            setSlots((prev) =>
                prev.map((slot) => ({
                    ...slot,
                    offset: slot.offset - 1,
                    animated: true,
                })),
            );
        }, HOLD_MS);

        const recycle = setTimeout(() => {
            setSlots((prev) =>
                prev.map((slot) =>
                    slot.offset < 0
                        ? {
                              text: GREETINGS[nextGreeting.current],
                              offset: 1,
                              animated: false,
                          }
                        : slot,
                ),
            );
            nextGreeting.current = (nextGreeting.current + 1) % GREETINGS.length;
            setCycle((c) => c + 1);
        }, HOLD_MS + swapMs);

        return () => {
            clearTimeout(slide);
            clearTimeout(recycle);
        };
    }, [cycle]);

    return (
        <View style={styles.greetingMask}>
            {slots.map((slot, i) => (
                <GreetingRow key={i} slot={slot} />
            ))}
        </View>
    );
}

export default function LoginScreen() {
    const [phoneNumber, setPhoneNumber] = useState("+254");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTallyAnimationVisible, setIsTallyAnimationVisible] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const [isTallyAnimationComplete, setIsTallyAnimationComplete] = useState(false);
    const [successfulPasswordToken, setSuccessfulPasswordToken] = useState<string | null>(
        null,
    );
    const [lockoutExpiresAt, setLockoutExpiresAt] = useState<number | null>(null);
    const [isLockoutRestored, setIsLockoutRestored] = useState(false);
    const [biometricUnlock, setBiometricUnlock] = useState<BiometricUnlock>("off");
    const biometricLabel = useBiometricLabel();

    const {logIn, lock} = useAuthStore();

    const insets = useSafeAreaInsets();
    const hasCommittedPasswordSignIn = useRef(false);
    const isOffline = useNetworkStatus() === "offline";

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

    useEffect(() => {
        void getBiometricUnlock().then(setBiometricUnlock);
    }, []);

    const handleLogin = () => {
        if (!phoneNumber || phoneNumber === "+254") {
            Alert.alert("Error", "Please enter your phone number");
            return;
        }
        if (!password) {
            Alert.alert("Error", "Please enter your password");
            return;
        }

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
                        Alert.alert("Please try again later", data["error"]);
                    } else if (data["error"] === "Invalid credentials") {
                        console.log("Invalid credentials");
                        setError(data["error"]);
                        Alert.alert(
                            "Invalid credentials",
                            "Please check your phone number and password.",
                        );
                    } else if (
                        data["error"] === "Invalid data" &&
                        data["details"]["phone_number"]
                    ) {
                        console.log("Phone number error");
                        setError(data["details"]["phone_number"]);
                        Alert.alert(
                            "Phone number error",
                            data["details"]["phone_number"][0],
                        );
                    } else {
                        setError(data["error"]);
                        Alert.alert("Unable to log in", data["error"]);
                    }
                } else if (data["message"] === "User login successful") {
                    let token = data["data"]["token"];

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
                    Alert.alert("Unable to log in", "Please try again.");
                }
            })
            .catch(() => {
                setIsSubmitting(false);
                Alert.alert("Unable to log in", "Check your connection and try again.");
            });
    };

    // National number digits only (without the +254 country code).
    const nationalNumber = phoneNumber.replace(/^\+254/, "");
    const handlePhoneChange = (text: string) => {
        const digits = text.replace(/[^0-9]/g, "").slice(0, 9);
        setPhoneNumber("+254" + digits);
    };

    if (!isLockoutRestored) return null;

    if (lockoutExpiresAt !== null) {
        return (
            <LoginLockout
                lockoutExpiresAt={lockoutExpiresAt}
                onComplete={handleLockoutComplete}
            />
        );
    }

    if (isTallyAnimationVisible || PREVIEW_SIGNING_IN) {
        return <LoginLoading onTallyAnimationComplete={handleTallyAnimationComplete} />;
    }

    return (
        <View style={styles.screen}>
            <UpdateCheckerModal />

            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    {
                        paddingTop: insets.top + 24,
                        paddingBottom: insets.bottom + 28,
                    },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <KineticGreeting />

                <View style={styles.formBlock}>
                    {/* Phone number */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Phone number</Text>
                        <View style={styles.phoneInput}>
                            <View style={styles.prefix}>
                                <Text style={styles.flag}>🇰🇪</Text>
                                <Text style={styles.prefixText}>+254</Text>
                            </View>
                            <TextInput
                                style={styles.phoneField}
                                placeholder="712 345 678"
                                placeholderTextColor={MUTE_2}
                                value={nationalNumber}
                                onChangeText={handlePhoneChange}
                                keyboardType="phone-pad"
                                maxLength={9}
                                returnKeyType="next"
                            />
                        </View>
                    </View>

                    {/* Password */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.fieldShell}>
                            <View style={styles.lead}>
                                <Lock size={18} color={MUTE} strokeWidth={1.9} />
                            </View>
                            <TextInput
                                style={styles.pwField}
                                placeholder="••••••••"
                                placeholderTextColor={MUTE_2}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                returnKeyType="send"
                                returnKeyLabel="Submit"
                            />
                            <TouchableOpacity
                                style={styles.trail}
                                onPress={() => setShowPassword(!showPassword)}
                                hitSlop={8}
                            >
                                {showPassword ? (
                                    <EyeOff size={18} color={MUTE} strokeWidth={1.9} />
                                ) : (
                                    <Eye size={18} color={MUTE} strokeWidth={1.9} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <Link href="/auth/forgot-password" asChild>
                    <TouchableOpacity style={styles.forgotRow}>
                        <Text style={styles.forgot}>Forgot password?</Text>
                    </TouchableOpacity>
                </Link>

                {isOffline ? (
                    <Text style={styles.offline} accessibilityLiveRegion="polite">
                        You&apos;re offline. Connect to the internet to sign in.
                    </Text>
                ) : null}

                <TouchableOpacity
                    style={[
                        styles.primary,
                        (isSubmitting || isOffline) && styles.disabled,
                    ]}
                    onPress={() => handleLogin()}
                    disabled={isSubmitting || isOffline}
                    activeOpacity={0.85}
                >
                    <Text style={styles.primaryText}>
                        {isSubmitting ? "Signing in…" : "Sign in"}
                    </Text>
                    <ArrowRight size={18} color={LIME_INK} strokeWidth={2.4} />
                </TouchableOpacity>

                {biometricUnlock === "on" ? (
                    <TouchableOpacity
                        style={[styles.secondary, isOffline && styles.disabled]}
                        onPress={lock}
                        disabled={isOffline}
                        activeOpacity={0.85}
                    >
                        {biometricLabel === "Face ID" ? (
                            <ScanFace size={18} color={INK} strokeWidth={2.2} />
                        ) : (
                            <Fingerprint size={18} color={INK} strokeWidth={2.2} />
                        )}
                        <Text style={styles.secondaryText}>
                            Unlock with {biometricLabel}
                        </Text>
                    </TouchableOpacity>
                ) : null}

                <View style={styles.foot}>
                    <Text style={styles.footText}>Don&apos;t have an account? </Text>
                    <Link href="/auth/signUp" asChild>
                        <TouchableOpacity>
                            <Text style={styles.footLink}>Create account</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </ScrollView>
        </View>
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
    heading: {
        fontSize: 30,
        fontWeight: "900",
        letterSpacing: -0.7,
        lineHeight: HEADING_LINE_HEIGHT,
        color: INK,
    },
    langLabel: {
        fontSize: 10.5,
        fontWeight: "700",
        letterSpacing: 2,
        textTransform: "uppercase",
        color: COPPER,
        marginBottom: 6,
    },
    greetingMask: {
        height: GREETING_MASK_HEIGHT,
        overflow: "hidden",
    },
    greetingRow: {
        position: "absolute",
        left: 0,
        top: 0,
        flexDirection: "row",
    },
    greetingChar: {
        lineHeight: GREETING_MASK_HEIGHT,
        includeFontPadding: false,
        textAlignVertical: "bottom",
    },
    formBlock: {
        marginTop: 40,
        gap: 24,
    },
    field: {
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
    fieldShell: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: CARD,
        borderWidth: 1.5,
        borderColor: INK,
        borderRadius: 14,
        overflow: "hidden",
    },
    lead: {
        paddingLeft: 14,
        paddingRight: 10,
    },
    pwField: {
        flex: 1,
        minWidth: 0,
        paddingVertical: 16,
        paddingRight: 14,
        fontSize: 16,
        fontWeight: "600",
        color: INK,
        letterSpacing: 0.3,
    },
    trail: {
        paddingLeft: 8,
        paddingRight: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    forgotRow: {
        alignSelf: "flex-end",
        marginTop: 18,
    },
    forgot: {
        fontSize: 13,
        fontWeight: "800",
        color: COPPER_DEEP,
    },
    offline: {
        marginTop: 24,
        fontSize: 13,
        fontWeight: "700",
        lineHeight: 18,
        color: COPPER_DEEP,
        textAlign: "center",
    },
    primary: {
        marginTop: 30,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        backgroundColor: LIME,
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 22,
    },
    secondary: {
        marginTop: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        backgroundColor: CARD,
        borderWidth: 1.5,
        borderColor: INK,
        borderRadius: 14,
        paddingVertical: 15,
        paddingHorizontal: 22,
    },
    secondaryText: {
        fontSize: 15,
        fontWeight: "800",
        color: INK,
    },
    disabled: {
        opacity: 0.6,
    },
    primaryText: {
        fontSize: 15,
        fontWeight: "800",
        color: LIME_INK,
    },
    foot: {
        marginTop: "auto",
        paddingTop: 22,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    footText: {
        fontSize: 13,
        color: MUTE,
    },
    footLink: {
        fontSize: 13,
        fontWeight: "800",
        color: INK,
        borderBottomWidth: 2,
        borderBottomColor: LIME,
        paddingBottom: 1,
    },
});
