import {
    Keyboard,
    KeyboardAvoidingView,
    LayoutChangeEvent,
    Platform,
    Pressable,
    PressableProps,
    ScrollView,
    StyleProp,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ViewStyle,
    useWindowDimensions,
} from "react-native";
import Animated, {
    Easing,
    FadeIn,
    FadeOut,
    cubicBezier,
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
    ScanFace,
} from "lucide-react-native";
import {
    CARD,
    COPPER_DEEP,
    INK,
    LIME,
    LIME_INK,
    MUTE,
    MUTE_2,
    RED,
    RULE_16,
} from "../_utils/colors";
import {Link, router} from "expo-router";
import React, {useCallback, useEffect, useRef, useState} from "react";

import {LOGIN_SCREEN_GREETINGS as GREETINGS} from "../_utils/auth/greetings";
import {
    COUNTY_ATLAS_HEIGHT,
    COUNTY_ATLAS_PATH,
    COUNTY_ATLAS_WIDTH,
} from "@/components/auth/countyAtlas";
import LoginLockout from "@/components/auth/lockout";
import LoginLoading from "@/components/auth/login";
import Svg, {Path} from "react-native-svg";
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

const HEADING_LINE_HEIGHT = 42;
// Mask is taller than the text line so Gĩkũyũ/Kĩkamba diacritics (ĩ, ũ) and bold
// ascenders are not shaved by overflow:hidden. Slide distance = mask height.
const GREETING_MASK_HEIGHT = 54;
const SWAP_MS = 480;
const CHAR_STAGGER_MS = 22;
const HOLD_MS = 1800;
const LONGEST_GREETING = Math.max(...GREETINGS.map((g) => g.length));
// The county atlas is the hero's one image: the country in lime, its 47
// counties cut in ink. It takes all the room the hero has and runs off the
// trailing edge, stopping short of the greeting.
const ATLAS_ASPECT = COUNTY_ATLAS_HEIGHT / COUNTY_ATLAS_WIDTH;
const ATLAS_MAX_WIDTH_RATIO = 0.74;
const ATLAS_BLEED_RATIO = 0.2;
const ATLAS_TOP_GAP = 4;
// Room kept under the atlas for the greeting. The coast runs away to the
// right there, so the greeting sits in the clear below the southern border.
const ATLAS_GREETING_RESERVE = 64;
const PHONE_DIGITS = 9;
// Press feedback: 120ms and 3% is the ceiling for a control touched this often.
const PRESS_TRANSITION = {
    transitionProperty: "transform",
    transitionDuration: "120ms",
    transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
} as const;
const ATLAS_FADE = {
    transitionProperty: "opacity",
    transitionDuration: "200ms",
    transitionTimingFunction: "ease-out",
} as const;
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

/** True from the moment the keyboard starts rising until it starts leaving. */
function useKeyboardOpen() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // iOS announces the keyboard before it moves, so the screen can move
        // with it; Android only reports once it has landed.
        const isIos = Platform.OS === "ios";
        const show = Keyboard.addListener(
            isIos ? "keyboardWillShow" : "keyboardDidShow",
            () => setIsOpen(true),
        );
        const hide = Keyboard.addListener(
            isIos ? "keyboardWillHide" : "keyboardDidHide",
            () => setIsOpen(false),
        );

        return () => {
            show.remove();
            hide.remove();
        };
    }, []);

    return isOpen;
}

function PressableScale({
    style,
    containerStyle,
    children,
    ...props
}: Omit<PressableProps, "style" | "children"> & {
    style?: StyleProp<ViewStyle>;
    containerStyle?: StyleProp<ViewStyle>;
    children: React.ReactNode;
}) {
    const [pressed, setPressed] = useState(false);

    return (
        <Pressable
            {...props}
            style={containerStyle}
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            pressRetentionOffset={16}
        >
            <Animated.View
                style={[
                    style,
                    PRESS_TRANSITION,
                    {transform: [{scale: pressed ? 0.97 : 1}]},
                ]}
            >
                {children}
            </Animated.View>
        </Pressable>
    );
}

export default function LoginScreen() {
    const [phoneNumber, setPhoneNumber] = useState("+254");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<"phone" | "password" | null>(null);
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
    const {width: windowWidth} = useWindowDimensions();
    const [heroHeight, setHeroHeight] = useState<number | null>(null);
    const hasCommittedPasswordSignIn = useRef(false);
    const phoneInput = useRef<TextInput>(null);
    const passwordInput = useRef<TextInput>(null);
    const isKeyboardOpen = useKeyboardOpen();
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

    const atlasTop = insets.top + ATLAS_TOP_GAP;
    const atlasHeight =
        heroHeight === null
            ? 0
            : Math.max(
                  0,
                  Math.min(
                      windowWidth * ATLAS_MAX_WIDTH_RATIO * ATLAS_ASPECT,
                      heroHeight - atlasTop - ATLAS_GREETING_RESERVE,
                  ),
              );
    const atlasWidth = atlasHeight / ATLAS_ASPECT;

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
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <UpdateCheckerModal />

            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* With the keyboard up the hero gives its room to the form:
                    the atlas and wordmark step back and the greeting stays. */}
                <View
                    style={[
                        styles.hero,
                        {paddingTop: insets.top + 14},
                        isKeyboardOpen && styles.heroCompact,
                    ]}
                    onLayout={(event: LayoutChangeEvent) => {
                        // Sized once, at rest: the keyboard shrinks the hero
                        // and the atlas is hidden by then anyway.
                        if (!isKeyboardOpen) {
                            setHeroHeight(event.nativeEvent.layout.height);
                        }
                    }}
                >
                    <Animated.View
                        style={[
                            styles.atlas,
                            {
                                top: atlasTop,
                                right: -atlasWidth * ATLAS_BLEED_RATIO,
                                opacity: isKeyboardOpen || atlasHeight === 0 ? 0 : 1,
                            },
                            ATLAS_FADE,
                        ]}
                        pointerEvents="none"
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                    >
                        <Svg
                            width={atlasWidth}
                            height={atlasHeight}
                            viewBox={`0 0 ${COUNTY_ATLAS_WIDTH} ${COUNTY_ATLAS_HEIGHT}`}
                        >
                            <Path
                                d={COUNTY_ATLAS_PATH}
                                fill={LIME}
                                stroke={INK}
                                strokeWidth={2.2}
                                strokeLinejoin="round"
                            />
                        </Svg>
                    </Animated.View>

                    {isKeyboardOpen ? (
                        <View />
                    ) : (
                        <Animated.Text
                            style={styles.wordmark}
                            entering={FadeIn.duration(200)}
                            exiting={FadeOut.duration(120)}
                        >
                            Kura Zetu<Text style={styles.wordmarkDot}>.</Text>
                        </Animated.Text>
                    )}

                    <View>
                        {isKeyboardOpen ? null : (
                            <Text style={styles.disclaimer}>
                                Citizen tally · Not an IEBC system
                            </Text>
                        )}
                        <KineticGreeting />
                    </View>
                </View>

                <View style={[styles.sheet, {paddingBottom: insets.bottom + 18}]}>
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
                                {biometricLabel === "Face ID" ? (
                                    <ScanFace size={26} color={INK} strokeWidth={1.9} />
                                ) : (
                                    <Fingerprint size={26} color={INK} strokeWidth={1.9} />
                                )}
                            </PressableScale>
                        ) : null}
                    </View>

                    <View style={styles.foot}>
                        <Text style={styles.footText}>New to Kura Zetu?</Text>
                        <Link href="/auth/signUp" asChild>
                            <TouchableOpacity hitSlop={8}>
                                <Text style={styles.footLink}>Create account</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: INK,
    },
    content: {
        flexGrow: 1,
    },
    // Brand, atlas and greeting on ink; the form rises from the bottom edge,
    // where the thumb already is.
    hero: {
        flexGrow: 1,
        minHeight: 250,
        paddingHorizontal: 24,
        paddingBottom: 22,
        justifyContent: "space-between",
        overflow: "hidden",
    },
    heroCompact: {
        minHeight: 0,
    },
    atlas: {
        position: "absolute",
    },
    wordmark: {
        fontFamily: "PublicSans-ExtraBold",
        fontSize: 22,
        letterSpacing: -0.7,
        color: CARD,
    },
    wordmarkDot: {
        color: RED,
    },
    disclaimer: {
        marginBottom: 2,
        fontFamily: "SpaceMono-Regular",
        fontSize: 10.5,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        color: MUTE_2,
    },
    heading: {
        fontSize: 34,
        fontWeight: "900",
        letterSpacing: -0.9,
        lineHeight: HEADING_LINE_HEIGHT,
        color: CARD,
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
    sheet: {
        backgroundColor: CARD,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 24,
        paddingHorizontal: 20,
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
        marginTop: 14,
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
        marginTop: 14,
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
        marginTop: 22,
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
        gap: 10,
        backgroundColor: LIME,
        borderRadius: 999,
        paddingHorizontal: 24,
    },
    primaryText: {
        fontSize: 18,
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
    foot: {
        marginTop: 20,
        flexDirection: "row",
        justifyContent: "center",
        // Top-aligned with one shared line height, so both sit on the same
        // baseline and the link's underline hangs below it.
        alignItems: "flex-start",
        gap: 8,
    },
    footText: {
        fontSize: 15,
        lineHeight: 20,
        color: MUTE,
    },
    footLink: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: "800",
        color: INK,
        borderBottomWidth: 2,
        borderBottomColor: LIME,
        paddingBottom: 1,
    },
});
