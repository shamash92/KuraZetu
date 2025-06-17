import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import React, {useState} from "react";
import {blueColor, purpleColor} from "@/app/(utils)/colors";

import {Button} from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import LottieComponent from "@/components/lottieLoading";
import {apiBaseURL} from "../(utils)/apiBaseURL";
import {saveToSecureStore} from "../(utils)/secureStore";
import {useLocalSearchParams} from "expo-router";
import {useRouter} from "expo-router";
import {windowWidth} from "@/app/(utils)/screenDimensions";

export interface ISignUpData {
    phone_number: string;
    first_name: string;
    last_name: string;
    gender: "M" | "F";
    age: number;
    role:
        | "other"
        | "voter"
        | "candidate"
        | "media"
        | "observer"
        | "party_agent"
        | "party_rep"
        | "election_officer";
    password: string;
    confirm_password: string;
    polling_center?: string;
}

//TODO: Add age and gender to the signup form. For now they are hardcoded
export default function Auth() {
    const [firstName, setFirstName] = useState<string>("");
    const [lastName, setLastName] = useState<string>("");

    const [password, setPassword] = useState<string>("");
    const [password1, setPassword1] = useState<string>("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const [phoneNumber, setPhoneNumber] = useState("");
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState<string>("");

    const router = useRouter();

    const params = useLocalSearchParams();
    console.log(params, "params");

    function handleFirstNameInput(text: string) {
        setFirstName(text);
    }

    function handleLastNameInput(text: string) {
        setLastName(text);
    }

    function handlePhoneNumberInput(text: string) {
        setPhoneNumber(text);
    }

    function handlePasswordInput(text: string) {
        setPassword(text);
    }
    function handlePassword1Input(text: string) {
        setPassword1(text);
    }

    async function signUpSubmit() {
        console.log("signing up");
        if (password !== password1) {
            return Alert.alert("Your passwords do not match");
        }

        setLoading(true);
        // TODO: Add Backend API call here
        let wardCode = params.ward;
        let pollingCenterNumber = params.pollingCenter;

        let data: ISignUpData = {
            phone_number: phoneNumber,
            first_name: firstName,
            last_name: lastName,
            gender: "M",
            age: 18,
            role: "voter",
            password: password,
            confirm_password: password1,
        };

        data["polling_center"] = pollingCenterNumber.toString();

        fetch(`${apiBaseURL}/api/accounts/signup/`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                data: data,
                ward_code: wardCode,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log(data, "data from server");

                if (data["error"]) {
                    setLoading(false);

                    if (data["error"] === "Polling center not found") {
                        console.log("Polling center not found");
                        // setError(data["error"]);
                    } else if (data["details"]["phone_number"]) {
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
                } else if (data["message"] === "User signup successful") {
                    let token = data["data"]["token"];

                    console.log(token, "token from server");

                    if (typeof token === "string" && token.length > 0) {
                        saveToSecureStore("userToken", token);
                        setLoading(false);

                        router.replace("/(tabs)");
                    } else {
                        console.error("Invalid token format");
                    }

                    // navigate("/ui/signup/accounts/registration-success/");
                }
            });
    }

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{
                flex: 1,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                // backgroundColor: orangeColor,
                paddingTop: Platform.OS === "ios" ? 30 : 0,
            }}
        >
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    width: 1 * windowWidth,
                    flexDirection: "column",
                    // paddingTop: Constants.statusBarHeight,
                    // borderWidth: 4,
                }}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View
                        style={{
                            flex: 1,
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        {/* Heading */}
                        <View
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
                                    color: purpleColor,
                                }}
                            >
                                Register
                            </Text>
                        </View>

                        {loading ? (
                            <View
                                style={{
                                    flex: 4,
                                    flexDirection: "column",
                                    justifyContent: "flex-start",
                                    alignItems: "center",
                                    width: "100%",
                                    marginBottom: 40,
                                }}
                            >
                                <LottieComponent
                                    name="signup"
                                    backgroundColor={"transparent"}
                                />

                                <Text
                                    style={{
                                        marginTop: 60,
                                        color: blueColor,
                                        fontSize: 20,
                                    }}
                                >
                                    Creating your account ...
                                </Text>
                            </View>
                        ) : (
                            // {/* Forms */}

                            <View
                                style={{
                                    flex: 8,
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    width: "100%",

                                    gap: 20,
                                }}
                            >
                                {/* First Name */}
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
                                            name="person-circle"
                                            size={24}
                                            color="white"
                                            style={{
                                                margin: 0,
                                                paddingHorizontal: 20,
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
                                            value={firstName}
                                            keyboardType="default"
                                            placeholder={"First Name"}
                                            placeholderTextColor={"#9ca3af"}
                                            onChangeText={(text) =>
                                                handleFirstNameInput(text)
                                            }
                                        />
                                    </View>
                                </View>

                                {/* Last Name */}
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
                                            name="person-circle-outline"
                                            size={24}
                                            color="white"
                                            style={{
                                                margin: 0,
                                                paddingHorizontal: 20,
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
                                            value={lastName}
                                            placeholder={"Last Name"}
                                            placeholderTextColor={"#9ca3af"}
                                            onChangeText={(text) =>
                                                handleLastNameInput(text)
                                            }
                                        />
                                    </View>
                                </View>

                                {/* Email */}
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
                                            keyboardType="phone-pad"
                                            value={phoneNumber}
                                            placeholder={"+254"}
                                            placeholderTextColor={"#9ca3af"}
                                            onChangeText={(text) =>
                                                handlePhoneNumberInput(text)
                                            }
                                        />
                                    </View>
                                </View>

                                {/* Password  1*/}

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
                                            placeholder={"Password"}
                                            // keyboardType="visible-password"
                                            value={password}
                                            secureTextEntry={!isPasswordVisible}
                                            blurOnSubmit={true}
                                            placeholderTextColor={"#9ca3af"}
                                            onChangeText={(text) =>
                                                handlePasswordInput(text)
                                            }
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
                                            name={
                                                !isPasswordVisible ? "eye-off" : "eye"
                                            }
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

                                {/* Password  2*/}

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
                                            value={password1}
                                            placeholder={"Password Confirm"}
                                            secureTextEntry={!isPasswordVisible}
                                            placeholderTextColor={"#9ca3af"}
                                            onChangeText={(text) =>
                                                handlePassword1Input(text)
                                            }
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
                                            name={
                                                !isPasswordVisible ? "eye-off" : "eye"
                                            }
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

                                <View
                                    style={{
                                        flex: 1,
                                    }}
                                >
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
                                        disabled={
                                            firstName === "" ||
                                            lastName === "" ||
                                            phoneNumber === "" ||
                                            password === "" ||
                                            password1 === ""
                                        }
                                        onPress={() => signUpSubmit()}
                                    >
                                        <Text style={{fontSize: 20}}>
                                            Create an Account
                                        </Text>
                                    </Button>
                                </View>
                            </View>
                        )}
                    </View>
                </TouchableWithoutFeedback>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 40,
        padding: 12,
    },
    verticallySpaced: {
        paddingTop: 4,
        paddingBottom: 4,
        alignSelf: "stretch",
    },
    mt20: {
        marginTop: 20,
    },
});
