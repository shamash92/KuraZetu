import * as LocalAuthentication from "expo-local-authentication";

import {
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {ArrowRight, Eye, EyeOff, Fingerprint, Lock} from "lucide-react-native";
import {Link, router} from "expo-router";
import React, {useEffect, useRef, useState} from "react";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";
import {windowHeight, windowWidth} from "../_utils/screenDimensions";

import {ActivityIndicator} from "react-native-paper";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import LottieComponent from "@/components/lottieLoading";
import RegisterPushNotifications from "../_utils/registerPushNotifications";
import UpdateCheckerModal from "../_utils/updateModal";
import {LOGIN_SCREEN_GREETINGS as GREETINGS} from "../_utils/auth/greetings";
import {apiBaseURL} from "../_utils/apiBaseURL";
import useAuthStore from "../_utils/authStore";
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

const HEADING_LINE_HEIGHT = 38;
// Mask is taller than the text line so Gĩkũyũ/Kĩkamba diacritics (ĩ, ũ) and bold
// ascenders are not shaved by overflow:hidden. Slide distance = mask height.
const GREETING_MASK_HEIGHT = 48;
const SWAP_MS = 480;
const CHAR_STAGGER_MS = 22;
const HOLD_MS = 1800;
const LONGEST_GREETING = Math.max(...GREETINGS.map((g) => g.length));

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
    const [isLoading, setIsLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const [shouldRedirect, setShouldRedirect] = useState(false);

    const {logIn, hasSavedUserToken, userToken, expoPushToken} = useAuthStore();

    const insets = useSafeAreaInsets();

    const handleBiometricAuth = async (userTokenValue: string) => {
        if (Platform.OS === "web") {
            Alert.alert(
                "Info",
                "Biometric authentication is not available on web platform",
            );
            return;
        }

        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();

            console.log(hasHardware, "has hardware");
            if (!hasHardware) {
                Alert.alert("Error", "Biometric hardware not available");
                return;
            }

            const supportedAuthTypes =
                await LocalAuthentication.supportedAuthenticationTypesAsync();

            console.log(supportedAuthTypes, "supported auth types");
            if (supportedAuthTypes.length === 0) {
                Alert.alert("Error", "No biometric authentication methods available");
                return;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: "Authenticate to login",
                fallbackLabel: "Use passcode",
            });

            console.log(result, "biometric auth result");

            if (result.success) {
                // Navigate to tabs on successful authentication
                setShouldRedirect(true);

                setTimeout(() => {
                    logIn(userTokenValue);
                }, 2000); // just to create a delay for the animation
            } else if (result.error === "not_enrolled") {
                Alert.alert(
                    "Error",
                    "No biometric credentials found. Please set up biometrics in your device settings.",
                );
            } else {
                Alert.alert("Error", "Biometric authentication failed");
            }
        } catch (error) {
            Alert.alert("Error", "Biometric authentication failed");
        }
    };

    const handleLogin = () => {
        if (!phoneNumber || phoneNumber === "+254") {
            Alert.alert("Error", "Please enter your phone number");
            return;
        }
        if (!password) {
            Alert.alert("Error", "Please enter your password");
            return;
        }

        setIsLoading(true);

        let data = {
            phone_number: phoneNumber,
            password: password,
            expo_push_token: expoPushToken, // so that we update the notifications for this user for the current device.
        };

        console.log(apiBaseURL, "API Base URL");

        fetch(`${apiBaseURL}/api/accounts/login/`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log(data, "data from server");
                setIsLoading(false);

                if (data["error"]) {
                    if (data["error"] === "Invalid credentials") {
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
                        // setError(data["details"]);
                        console.log("Error: ", data["details"]);
                        Alert.alert(JSON.stringify(data["details"]));
                    }
                } else if (data["message"] === "User login successful") {
                    let token = data["data"]["token"];

                    console.log(token, "token from server");

                    if (typeof token === "string" && token.length > 0) {
                        console.log("login you in");
                        logIn(token);

                        setTimeout(() => {
                            setIsLoading(false);

                            router.replace("/(tabs)");
                        }, 3000); // just to create a delay for the animation
                    } else if (typeof token === "object" && token !== null) {
                    } else {
                        console.error("Invalid token format");
                    }
                }
            });
    };

    // National number digits only (without the +254 country code).
    const nationalNumber = phoneNumber.replace(/^\+254/, "");
    const handlePhoneChange = (text: string) => {
        const digits = text.replace(/[^0-9]/g, "").slice(0, 9);
        setPhoneNumber("+254" + digits);
    };

    useEffect(() => {}, [shouldRedirect]);

    if (isLoading && !shouldRedirect) {
        return (
            <View style={{flex: 1}}>
                <Modal
                    transparent
                    animationType="slide"
                    visible={isLoading}
                    onRequestClose={() => {}}
                >
                    <View
                        style={{
                            flex: 1,
                            justifyContent: "flex-end",
                            backgroundColor: "rgba(0,0,0,0.3)",
                        }}
                    >
                        <View
                            style={{
                                height: 0.5 * windowHeight,
                                backgroundColor: "rgba(255,255,255,0.97)",
                                borderTopLeftRadius: 24,
                                borderTopRightRadius: 24,
                                alignItems: "center",
                                justifyContent: "center",
                                shadowColor: "#000",
                                shadowOffset: {width: 0, height: -2},
                                shadowOpacity: 0.2,
                                shadowRadius: 8,
                                elevation: 8,
                            }}
                        >
                            <LottieComponent
                                name="login"
                                backgroundColor="transparent"
                                width={0.75 * windowWidth}
                            />

                            <View>
                                <Text style={{fontSize: 14, color: "#000"}}>
                                    Signing In ...
                                </Text>
                                <ActivityIndicator
                                    size="small"
                                    color={COPPER_DEEP}
                                    style={{marginTop: 8}}
                                />
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <RegisterPushNotifications />

            <UpdateCheckerModal />

            <Modal
                transparent
                animationType="slide"
                visible={shouldRedirect}
                onRequestClose={() => {}}
            >
                <View style={{flex: 1, justifyContent: "flex-end"}}>
                    <View
                        style={{
                            height: 0.5 * windowHeight,
                            backgroundColor: "rgba(255,255,255,0.97)",
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            alignItems: "center",
                            justifyContent: "center",
                            shadowColor: "#000",
                            shadowOffset: {width: 0, height: -2},
                            shadowOpacity: 0.2,
                            shadowRadius: 8,
                            elevation: 8,
                        }}
                    >
                        <LottieComponent
                            name="login-fingerprint"
                            backgroundColor="transparent"
                            width={200}
                        />
                    </View>
                </View>
            </Modal>

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

                <TouchableOpacity
                    style={[styles.primary, isLoading && styles.disabled]}
                    onPress={() => handleLogin()}
                    disabled={isLoading}
                    activeOpacity={0.85}
                >
                    <Text style={styles.primaryText}>
                        {isLoading ? "Signing in…" : "Sign in"}
                    </Text>
                    <ArrowRight size={18} color={LIME_INK} strokeWidth={2.4} />
                </TouchableOpacity>

                <View style={styles.orDiv}>
                    <View style={styles.orLine} />
                    <Text style={styles.orText}>or</Text>
                    <View style={styles.orLine} />
                </View>

                {hasSavedUserToken && userToken ? (
                    <TouchableOpacity
                        style={styles.bioBtn}
                        onPress={() => handleBiometricAuth(userToken)}
                        activeOpacity={0.85}
                    >
                        <Fingerprint size={19} color={COPPER_DEEP} strokeWidth={1.8} />
                        <Text style={styles.bioText}>Use biometrics</Text>
                    </TouchableOpacity>
                ) : (
                    <>
                        <Text style={styles.bioHint}>
                            No saved biometric credentials yet. Sign in with your phone
                            number and password first to enable biometrics.
                        </Text>

                        <TouchableOpacity
                            style={[styles.bioBtn, styles.bioBtnDisabled]}
                            disabled
                        >
                            <Fingerprint size={19} color={MUTE_2} strokeWidth={1.8} />
                            <Text style={[styles.bioText, {color: MUTE_2}]}>
                                Biometrics unavailable
                            </Text>
                        </TouchableOpacity>
                    </>
                )}

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
    disabled: {
        opacity: 0.6,
    },
    primaryText: {
        fontSize: 15,
        fontWeight: "800",
        color: LIME_INK,
    },
    orDiv: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginTop: 28,
        marginBottom: 24,
    },
    orLine: {
        flex: 1,
        height: 1,
        backgroundColor: RULE_16,
    },
    orText: {
        fontSize: 10.5,
        fontWeight: "700",
        letterSpacing: 2.4,
        textTransform: "uppercase",
        color: MUTE_2,
    },
    bioBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        backgroundColor: CARD,
        borderWidth: 1.5,
        borderColor: INK,
        borderRadius: 12,
        paddingVertical: 13,
        paddingHorizontal: 18,
    },
    bioBtnDisabled: {
        borderColor: RULE_16,
        opacity: 0.7,
    },
    bioText: {
        fontSize: 13.5,
        fontWeight: "800",
        color: INK,
    },
    bioHint: {
        fontSize: 12.5,
        color: MUTE,
        lineHeight: 18,
        textAlign: "center",
        marginBottom: 12,
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
