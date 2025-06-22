import * as LocalAuthentication from "expo-local-authentication";

import {
    Alert,
    Image,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {Eye, EyeOff, Fingerprint, Lock, Phone} from "lucide-react-native";
import {Link, router} from "expo-router";
import React, {useEffect, useState} from "react";
import {windowHeight, windowWidth} from "../(utils)/screenDimensions";

import {ActivityIndicator} from "react-native-paper";
import LottieComponent from "@/components/lottieLoading";
import RegisterPushNotifications from "../(utils)/registerPushNotifications";
import UpdateCheckerModal from "../(utils)/updateModal";
import {apiBaseURL} from "../(utils)/apiBaseURL";
import useAuthStore from "../(utils)/authStore";

export default function LoginScreen() {
    const [phoneNumber, setPhoneNumber] = useState("+254");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const [shouldRedirect, setShouldRedirect] = useState(false);

    const {logIn, hasSavedUserToken, userToken, expoPushToken} = useAuthStore();

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

            let x = {
                error: "not_enrolled",
                success: false,
                warning: "KeyguardManager#isDeviceSecure() returned false",
            };

            let y = {success: true};

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

    const formatPhoneNumber = (text: string) => {
        if (!text.startsWith("+254")) {
            return "+254";
        }
        return text;
    };

    useEffect(() => {}, [shouldRedirect]);

    if (isLoading && !shouldRedirect) {
        return (
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
                            <Text
                                style={{
                                    fontSize: 14,
                                    // fontWeight: "bold",
                                    color: "#000",
                                    // marginTop: 16,
                                }}
                            >
                                Signing In ...
                            </Text>
                            <ActivityIndicator
                                size="small"
                                color="#DC143C"
                                style={{marginTop: 8}}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <View
            style={{
                flex: 1,
                flexDirection: "column",
                justifyContent: "space-evenly",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                paddingHorizontal: 24,
                paddingTop: 30,
                //borderWidth: 1,
                borderColor: "red",
                paddingBottom: 30,
            }}
        >
            <RegisterPushNotifications />

            <UpdateCheckerModal />

            <Modal
                transparent
                animationType="slide"
                visible={shouldRedirect}
                onRequestClose={() => {}}
            >
                <View
                    style={{
                        flex: 1,
                        justifyContent: "flex-end",
                        // backgroundColor: "rgba(0,0,0,0.3)",
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
                            name="login-fingerprint"
                            backgroundColor="transparent"
                            width={200}
                        />
                    </View>
                </View>
            </Modal>
            {/* image */}
            <View
                style={{
                    alignItems: "center",
                    justifyContent: "center",
                    //borderWidth: 1,
                    borderColor: "blue",
                    flex: 1,
                }}
            >
                <Image
                    source={require("../../assets/images/icon.png")}
                    style={{
                        width: 0.3 * windowWidth,
                        height: 80,
                        // height: 0.2 * windowHeight,
                    }}
                    resizeMode="cover"
                />
            </View>

            {/* Body */}
            <View
                style={{
                    flex: 4,
                    flexDirection: "column",
                    justifyContent: "space-evenly",
                    //borderWidth: 1,
                    borderColor: "yellow",
                }}
            >
                <Text
                    style={{
                        fontSize: 24,
                        fontWeight: "bold",
                        color: "#000",
                        // marginBottom: 32,
                    }}
                >
                    Welcome Back
                </Text>
                {/* <Text
                    style={{
                        fontSize: 16,
                        color: "#666",
                        marginBottom: 12,
                    }}
                >
                    Sign in to continue
                </Text> */}

                <View
                    style={{
                        marginBottom: 12,
                    }}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "#F8F9FA",
                            borderRadius: 12,
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            marginBottom: 8,
                            //borderWidth: 1,
                            borderColor: "#E9ECEF",
                        }}
                    >
                        <Phone size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Phone Number"
                            placeholderTextColor="#666"
                            value={phoneNumber}
                            onChangeText={(text) =>
                                setPhoneNumber(formatPhoneNumber(text))
                            }
                            keyboardType="phone-pad"
                            maxLength={13}
                            returnKeyType="next"
                        />
                    </View>

                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "#F8F9FA",
                            borderRadius: 12,
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            marginBottom: 8,
                            //borderWidth: 1,
                            borderColor: "#E9ECEF",
                        }}
                    >
                        <Lock size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={{
                                flex: 1,
                                fontSize: 16,
                                color: "#000",
                            }}
                            placeholder="Password"
                            placeholderTextColor="#666"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            returnKeyType="send"
                            returnKeyLabel="Submit"
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeIcon}
                        >
                            {showPassword ? (
                                <EyeOff size={20} color="#666" />
                            ) : (
                                <Eye size={20} color="#666" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <Link href="/auth/forgot-password" asChild>
                    <TouchableOpacity
                        style={{
                            alignSelf: "flex-end",
                            marginBottom: 12,
                        }}
                    >
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>
                </Link>

                <TouchableOpacity
                    style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                    onPress={() => handleLogin()}
                    disabled={isLoading}
                >
                    <Text style={styles.loginButtonText}>
                        {isLoading ? "Signing In..." : "Sign In"}
                    </Text>
                </TouchableOpacity>

                {/* Biometrics */}
                <View
                    style={{
                        // flex: 1,
                        //borderWidth: 1,
                        borderColor: "green",
                    }}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 8,
                        }}
                    >
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {hasSavedUserToken && userToken ? (
                        <>
                            <TouchableOpacity
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: "#F8F9FA",
                                    borderRadius: 12,
                                    paddingVertical: 12,
                                    borderWidth: 1,
                                    borderColor: "#DC143C",
                                    marginTop: 24,
                                }}
                                onPress={() => handleBiometricAuth(userToken)}
                            >
                                <Fingerprint size={24} color="#DC143C" />
                                <Text style={styles.biometricButtonText}>
                                    Use Biometrics
                                </Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: "#666",
                                    marginBottom: 16,
                                    textAlign: "center",
                                }}
                            >
                                No saved biometric credentials found. Please login with
                                your phone number and password first to enable
                                biometrics.
                            </Text>

                            <TouchableOpacity
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: "#E9ECEF",
                                    borderRadius: 12,
                                    paddingVertical: 12,
                                    borderWidth: 1,
                                    borderColor: "#B0B0B0",
                                    opacity: 0.6,
                                }}
                                disabled
                            >
                                <Fingerprint size={24} color="#B0B0B0" />
                                <Text
                                    style={[
                                        styles.biometricButtonText,
                                        {color: "#B0B0B0"},
                                    ]}
                                >
                                    Biometrics Unavailable
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            {/* Sign Up */}
            <View
                style={{
                    flex: 1,
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    //borderWidth: 1,
                    borderColor: "purple",
                }}
            >
                <Text style={styles.signupText}>Don&apos;t have an account? </Text>
                <Link href="/auth/signUp" asChild>
                    <TouchableOpacity>
                        <Text style={styles.signupLink}>Create Account</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        paddingHorizontal: 24,
        paddingTop: 30,
    },
    logoContainer: {
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        height: 0.15 * windowHeight,
    },
    logo: {
        width: 0.3 * windowWidth,
        height: 0.2 * windowHeight,
    },
    appName: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#DC143C",
    },
    formContainer: {
        flex: 1,
        borderWidth: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#000",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        marginBottom: 32,
    },
    inputContainer: {
        marginBottom: 24,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8F9FA",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E9ECEF",
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: "#000",
    },
    eyeIcon: {
        padding: 4,
    },
    forgotPassword: {
        alignSelf: "flex-end",
        marginBottom: 32,
    },
    forgotPasswordText: {
        color: "#DC143C",
        fontSize: 14,
        fontWeight: "600",
    },
    loginButton: {
        backgroundColor: "#DC143C",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        // marginBottom: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    loginButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "bold",
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#E9ECEF",
    },
    dividerText: {
        marginHorizontal: 16,
        color: "#666",
        fontSize: 14,
    },
    biometricButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F8F9FA",
        borderRadius: 12,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: "#DC143C",
        marginBottom: 32,
    },
    biometricButtonText: {
        color: "#DC143C",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
    },
    signupContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "auto",
        paddingBottom: 32,
    },
    signupText: {
        color: "#666",
        fontSize: 16,
    },
    signupLink: {
        color: "#DC143C",
        fontSize: 16,
        fontWeight: "bold",
    },
});
