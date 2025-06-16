import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import {Alert, Platform, Pressable, Text, TextInput, View} from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import {Alert, Platform, Pressable, Text, TextInput, View} from "react-native";
import Animated, {FadeInUp, FadeOut} from "react-native-reanimated";
import {Link, router} from "expo-router";
import React, {useEffect, useState} from "react";

import {Button} from "react-native-paper";
import Constants from "expo-constants";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import LottieComponent from "@/components/lottieLoading";
import {TouchableOpacity} from "react-native";
import {apiBaseURL} from "../(utils)/apiBaseURL";
import {blueColor} from "../(utils)/colors";
import {saveToSecureStore} from "../(utils)/secureStore";
import {windowWidth} from "../(utils)/screenDimensions";

function Login() {
    const [phoneNumber, setPhoneNumber] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const [isSending, setIsSending] = useState(false);

    const [error, setError] = useState<string | null>(null);

    async function signInSubmit() {
        setIsSending(true);
        console.log("sign in submit");

        // TODO: Replace this with backend login to return the auth token. The delay for now is to simulate API call
        // setTimeout(async () => {
        //     await saveToSecureStore("userToken", "userToken");

        //     router.replace("/(tabs)");
        // }, 2000);

        let data = {
            phone_number: phoneNumber,
            password: password,
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
                setIsSending(false);

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
                        saveToSecureStore("userToken", token);

                        router.replace("/(tabs)");
                    } else {
                        console.error("Invalid token format");
                    }

                    // navigate("/ui/signup/accounts/registration-success/");
                }
            });
    }
    function handlePhoneNumberInput(text: string) {
        console.log(text, "phone input");
        setPhoneNumber(text);
    }

    function handlePasswordInput(text: string) {
        // console.log(text, "password input");
        setPassword(text);
    }

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    function handleRegistrationError(errorMessage: string) {
        alert(`registrationErrorLogin:", ${errorMessage}`);
        // throw new Error(errorMessage);
    }

    useEffect(() => {
        async function registerForPushNotificationsAsync() {
            if (Platform.OS === "android") {
                Notifications.setNotificationChannelAsync("default", {
                    name: "default",
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: "#FF231F7C",
                });
            }

            if (Device.isDevice) {
                const {status: existingStatus} =
                    await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;
                if (existingStatus !== "granted") {
                    const {status} = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }
                if (finalStatus !== "granted") {
                    handleRegistrationError(
                        "Permission not granted to get push token for push notification!",
                    );
                    return;
                }
                const projectId =
                    Constants?.expoConfig?.extra?.eas?.projectId ??
                    Constants?.easConfig?.projectId;

                // console.log(projectId, "project id step 1");
                if (!projectId) {
                    handleRegistrationError("Project ID not found");
                }

                try {
                    // console.log(projectId, "projectId");
                    const pushTokenString = (
                        await Notifications.getExpoPushTokenAsync({
                            projectId: projectId,
                        })
                    ).data;
                    // console.log(pushTokenString, "pushTokenString");
                    return pushTokenString;
                } catch (e: unknown) {
                    console.log(e, "error in pushToken");
                    // handleRegistrationError(`${e}`);
                }
            } else {
                handleRegistrationError(
                    "Must use physical device for push notifications",
                );
                console.log("login.tsx: object");
            }
        }

        registerForPushNotificationsAsync()
            .then(async (token) => {
                console.log(token, "token");

                if (token !== null && token !== undefined) {
                    await saveToSecureStore("expoPushToken", token);
                }
            })
            .catch((error: any) => {
                // setExpoPushToken(`${error}`)
                console.log(error, "login.tsx: error in getting expoPushToken ");
            });
    }, []);

    return (
        <View
            style={{
                flex: 1,
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                // backgroundColor: orangeColor,

                backgroundColor: "rgba(0,0,0,0.5)",
            }}
        >
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    width: 1 * windowWidth,
                    // paddingTop: Constants.statusBarHeight,
                    // borderWidth: 4,
                }}
            >
                {/* Heading */}
                <Animated.View
                    entering={FadeInUp.duration(1000)}
                    exiting={FadeOut.duration(1000)}
                    style={{
                        flex: 2,
                        flexDirection: "column",
                        justifyContent: "center",
                    }}
                >
                    <Text
                        style={{
                            fontSize: 40,
                            fontWeight: "bold",
                            letterSpacing: 1,
                            color: "white",
                        }}
                    >
                        Welcome
                    </Text>
                </Animated.View>

                {isSending ? (
                    <View
                        style={{
                            flex: 1,
                            flexDirection: "column",
                            justifyContent: "space-around",
                            alignItems: "center",
                            width: "100%",
                            marginBottom: 40,
                        }}
                    >
                        <LottieComponent name="login" backgroundColor={"transparent"} />
                        <Text
                            style={{
                                marginTop: 20,
                                color: "white",
                                fontSize: 20,
                            }}
                        >
                            Logging you in ....
                        </Text>
                    </View>
                ) : (
                    //  {/* Login Form */}

                    <View
                        style={{
                            flex: 4,
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            width: 1 * windowWidth,
                            gap: 20,
                            // borderWidth: 1,
                        }}
                    >
                        {/* Phone Number */}
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 5,
                                paddingVertical: 0,
                                width: 1 * windowWidth,
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: blueColor,

                                    paddingVertical: 0,
                                    width: 0.2 * windowWidth,
                                    height: "100%",
                                }}
                            >
                                <Ionicons
                                    name="mail"
                                    size={24}
                                    color="white"
                                    style={{
                                        margin: 0,
                                        paddingVertical: 0,
                                    }}
                                />
                            </View>

                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: blueColor,

                                    paddingVertical: 0,

                                    width: 0.7 * windowWidth,

                                    height: "100%",
                                }}
                            >
                                <TextInput
                                    style={{
                                        width: "100%",
                                        flexDirection: "row",
                                        justifyContent: "flex-start",
                                        marginVertical: 0,
                                        paddingLeft: 10,
                                        borderRadius: 0,
                                        borderTopLeftRadius: 0,
                                        borderBottomLeftRadius: 0,
                                        fontSize: 20,
                                        paddingVertical: 18,
                                        backgroundColor: "white",
                                    }}
                                    onChangeText={(text) =>
                                        handlePhoneNumberInput(text)
                                    }
                                    value={phoneNumber ? phoneNumber : "+254"}
                                    keyboardType="phone-pad"
                                    placeholder={"+254"}
                                    returnKeyType="next"
                                    placeholderTextColor={"#9ca3af"}
                                />
                            </View>
                        </View>

                        {/* Password */}

                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 5,
                                paddingVertical: 0,
                                width: 1 * windowWidth,
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: blueColor,

                                    paddingVertical: 0,
                                    width: 0.2 * windowWidth,
                                    height: "100%",
                                }}
                            >
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={24}
                                    color="white"
                                    style={{
                                        margin: 0,
                                        // paddingHorizontal: 20,
                                        paddingVertical: 0,
                                    }}
                                />
                            </View>

                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: blueColor,

                                    paddingVertical: 0,

                                    width: 0.7 * windowWidth,

                                    height: "100%",
                                }}
                            >
                                <TextInput
                                    style={{
                                        width: "100%",
                                        flexDirection: "row",
                                        justifyContent: "flex-start",
                                        marginVertical: 0,
                                        paddingLeft: 10,
                                        borderRadius: 0,
                                        borderTopLeftRadius: 0,
                                        borderBottomLeftRadius: 0,
                                        fontSize: 20,
                                        paddingVertical: 18,
                                        backgroundColor: "white",
                                    }}
                                    value={password}
                                    placeholder={"Password"}
                                    secureTextEntry={!isPasswordVisible}
                                    placeholderTextColor={"#9ca3af"}
                                    onChangeText={(text) => handlePasswordInput(text)}
                                    returnKeyType="send"
                                    returnKeyLabel="Submit"
                                />
                            </View>

                            <TouchableOpacity
                                onPress={togglePasswordVisibility}
                                style={{
                                    position: "absolute",
                                    right: 0.05 * windowWidth,
                                    backgroundColor: "white",
                                    height: "100%",
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}
                            >
                                <Ionicons
                                    name={!isPasswordVisible ? "eye-off" : "eye"}
                                    size={24}
                                    color="black"
                                    style={{
                                        margin: 0,
                                        paddingHorizontal: 20,
                                        paddingVertical: 0,
                                    }}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Submit */}

                        <Button
                            icon="arrow-right"
                            mode="contained"
                            style={{
                                width: "85%",
                                borderRadius: 10,
                                paddingVertical: 10,
                                backgroundColor: blueColor,
                                marginTop: 24,
                            }}
                            contentStyle={{
                                flexDirection: "row-reverse",
                            }}
                            onPress={async () => {
                                setIsSending(true);
                                await signInSubmit();
                            }}
                            disabled={phoneNumber === "" || password === ""}
                        >
                            <Text style={{fontSize: 20}}>Log In</Text>
                        </Button>
                    </View>
                )}

                {/* FORGOT yOUR password */}

                {phoneNumber === "" && password === "" ? (
                    <View
                        style={{
                            flex: 1,
                            justifyContent: "center",
                            alignItems: "center",
                            width: "100%",
                            flexDirection: "column",
                            gap: 20,
                            marginTop: 24,
                        }}
                    >
                        {/* FORGOT yOUR password */}
                        <View
                            style={{
                                flex: 1,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 24,
                                    fontWeight: "bold",
                                    textDecorationStyle: "solid",
                                    textDecorationLine: "underline",
                                    color: "white",
                                }}
                            >
                                Forgot Your Password?
                            </Text>
                        </View>

                        {/* OR  row*/}

                        <View
                            style={{
                                flex: 1,
                                width: "90%",
                                flexDirection: "row",
                                alignItems: "center",
                                // backgroundColor: "red",
                            }}
                        >
                            <View
                                style={{
                                    flex: 3,
                                    borderWidth: 1,
                                    borderColor: "white",
                                    height: 2,
                                }}
                            ></View>

                            <View
                                style={{
                                    flex: 2,
                                    justifyContent: "center",
                                    flexDirection: "row",
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 24,
                                        fontWeight: "bold",
                                        color: "white",
                                    }}
                                >
                                    OR
                                </Text>
                            </View>

                            <View
                                style={{
                                    flex: 3,
                                    borderWidth: 1,
                                    borderColor: "white",
                                    height: 2,
                                }}
                            ></View>
                        </View>
                    </View>
                ) : null}

                {/* Sign Up */}
                <View
                    style={{
                        flex: 2,
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                        width: "85%",
                    }}
                >
                    {password === "" ? (
                        <Link
                            href="/auth/signUp"
                            asChild
                            style={{
                                width: "100%",
                                borderRadius: 10,
                                backgroundColor: blueColor,
                                height: 60,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                flex: 1,
                            }}
                        >
                            <Pressable
                                style={{
                                    flex: 1,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    paddingHorizontal: 0,
                                }}
                            >
                                <Text style={{fontSize: 20, color: "white"}}>
                                    Create an Account
                                </Text>

                                <Ionicons
                                    name="arrow-forward"
                                    size={24}
                                    color="white"
                                    style={{
                                        margin: 0,
                                        paddingLeft: 20,
                                        paddingVertical: 0,
                                    }}
                                />
                            </Pressable>
                        </Link>
                    ) : null}
                </View>
            </View>
        </View>
    );
}

export default Login;
