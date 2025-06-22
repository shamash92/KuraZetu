import {
    Alert,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {ArrowLeft, Eye, EyeOff, Lock, Phone, User} from "lucide-react-native";
import {Link, router, useLocalSearchParams} from "expo-router";
import React, {useState} from "react";

import {ISignUpData} from "./signUpFormOLD";
import {LinearGradient} from "expo-linear-gradient";
import LottieComponent from "@/components/lottieLoading";
import {apiBaseURL} from "../(utils)/apiBaseURL";
import {blueColor} from "../(utils)/colors";
import useAuthStore from "../(utils)/authStore";
import {windowWidth} from "../(utils)/screenDimensions";

export default function SignupScreen() {
    const [formData, setFormData] = useState({
        phoneNumber: "+254",
        firstName: "",
        lastName: "",
        password: "",
        confirmPassword: "",
        gender: "",
        age: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [showGenderDropdown, setShowGenderDropdown] = useState(false);

    const [error, setError] = useState<string>("");

    const {logIn} = useAuthStore();

    const params = useLocalSearchParams();
    console.log(params, "params");

    const genders = ["Male", "Female"];

    const updateFormData = (field: string, value: string) => {
        if (field === "phoneNumber" && !value.startsWith("+254")) {
            value = "+254";
        }
        setFormData((prev) => ({...prev, [field]: value}));
    };

    const validateForm = () => {
        const {
            phoneNumber,
            firstName,
            lastName,
            password,
            confirmPassword,
            gender,
            age,
        } = formData;

        // Phone number must start with "+254" and be exactly 13 characters (e.g., +2547XXXXXXXX)
        if (
            !phoneNumber ||
            (!phoneNumber.startsWith("+2547") && !phoneNumber.startsWith("+2541")) ||
            phoneNumber.length !== 13
        ) {
            Alert.alert(
                "Error",
                "Please enter a valid Kenyan phone number (e.g., +254 7XX XXX XXX or +254 1XX XXX XXX)",
            );
            return false;
        }
        if (!firstName.trim()) {
            Alert.alert("Error", "Please enter your first name");
            return false;
        }
        if (!lastName.trim()) {
            Alert.alert("Error", "Please enter your last name");
            return false;
        }
        if (password.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters");
            return false;
        }
        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match");
            return false;
        }
        if (!gender) {
            Alert.alert("Error", "Please select your gender");
            return false;
        }

        if (age && parseInt(age) >= 80) {
            Alert.alert("Error", "Uko aje na smartphone at this age?");
            return false;
        }
        if (!age || parseInt(age) < 18 || parseInt(age) > 80) {
            Alert.alert("Error", "Please enter a valid age");
            return false;
        }

        return true;
    };

    const handleSignup = () => {
        if (!validateForm()) return;

        setIsLoading(true);

        // TODO: Add Backend API call here
        let wardCode = params.ward;
        let pollingCenterNumber = params.pollingCenter;

        let data: ISignUpData = {
            phone_number: formData.phoneNumber,
            first_name: formData.firstName,
            last_name: formData.lastName,
            gender: formData.gender === "Male" ? "M" : "F",
            age: parseInt(formData.age),
            role: "voter",
            password: formData.password,
            confirm_password: formData.confirmPassword,
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
                    setIsLoading(false);

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
                        setTimeout(() => {
                            logIn(token);
                            setIsLoading(false);
                            router.replace("/(tabs)");
                        }, 5000); // just to create a delay for the animation
                    } else {
                        console.error("Invalid token format");
                    }
                }
            });
    };

    if (isLoading) {
        return (
            <View
                style={{
                    flex: 1,
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    width: "100%",
                }}
            >
                <LottieComponent
                    name="wave"
                    backgroundColor={"transparent"}
                    width={0.6 * windowWidth}
                />
                <LottieComponent
                    name="tea"
                    backgroundColor={"transparent"}
                    width={0.3 * windowWidth}
                />

                <Animated.Text
                    style={{
                        textAlign: "center",
                        marginTop: 40,
                        opacity: 0.9,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 16,
                            color: blueColor,
                            marginTop: 20,
                        }}
                    >
                        Things are boiling nicely
                    </Text>
                </Animated.Text>
            </View>
        );
    }

    return (
        <LinearGradient
            colors={["#DC143C", "#006B3C", "#1E40AF"]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.container}
        >
            <ScrollView style={styles.overlay} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <ArrowLeft size={24} color="#DC143C" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join our community today</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputWrapper}>
                        <Phone size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Phone Number"
                            placeholderTextColor="#666"
                            value={formData.phoneNumber}
                            onChangeText={(text) => updateFormData("phoneNumber", text)}
                            keyboardType="phone-pad"
                            maxLength={13}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputWrapper, styles.halfWidth]}>
                            <User size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="First Name"
                                placeholderTextColor="#666"
                                value={formData.firstName}
                                maxLength={20} // because the backend enforces a max length of 20
                                onChangeText={(text) =>
                                    updateFormData("firstName", text)
                                }
                            />
                        </View>
                        <View style={[styles.inputWrapper, styles.halfWidth]}>
                            <User size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Last Name"
                                placeholderTextColor="#666"
                                maxLength={20} // because the backend enforces a max length of 20
                                value={formData.lastName}
                                onChangeText={(text) =>
                                    updateFormData("lastName", text)
                                }
                            />
                        </View>
                    </View>

                    <View style={styles.inputWrapper}>
                        <Lock size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#666"
                            value={formData.password}
                            onChangeText={(text) => updateFormData("password", text)}
                            secureTextEntry={!showPassword}
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

                    <View style={styles.inputWrapper}>
                        <Lock size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            placeholderTextColor="#666"
                            value={formData.confirmPassword}
                            onChangeText={(text) =>
                                updateFormData("confirmPassword", text)
                            }
                            secureTextEntry={!showConfirmPassword}
                        />
                        <TouchableOpacity
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={styles.eyeIcon}
                        >
                            {showConfirmPassword ? (
                                <EyeOff size={20} color="#666" />
                            ) : (
                                <Eye size={20} color="#666" />
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputWrapper, styles.halfWidth]}>
                            {/* <Users size={20} color="#666" style={styles.inputIcon} /> */}
                            <View style={{flex: 1}}>
                                <TouchableOpacity
                                    style={[
                                        styles.genderOption,
                                        formData.gender ? styles.selectedGender : null,
                                        {
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                        },
                                    ]}
                                    onPress={() =>
                                        setShowGenderDropdown((prev) => !prev)
                                    }
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            styles.genderText,
                                            formData.gender
                                                ? styles.selectedGenderText
                                                : null,
                                        ]}
                                    >
                                        {formData.gender || "Select Gender"}
                                    </Text>
                                    <Text style={{color: "#666", fontSize: 16}}>▼</Text>
                                </TouchableOpacity>
                                {showGenderDropdown && (
                                    <View
                                        style={{
                                            backgroundColor: "#fff",
                                            borderRadius: 8,
                                            marginTop: 4,
                                            borderWidth: 1,
                                            borderColor: "#E9ECEF",
                                            zIndex: 10,
                                            elevation: 2,
                                        }}
                                    >
                                        {genders.map((gender) => (
                                            <TouchableOpacity
                                                key={gender}
                                                style={[
                                                    styles.genderOption,
                                                    formData.gender === gender &&
                                                        styles.selectedGender,
                                                ]}
                                                onPress={() => {
                                                    updateFormData("gender", gender);
                                                    setShowGenderDropdown(false);
                                                }}
                                            >
                                                <Text
                                                    style={[
                                                        styles.genderText,
                                                        formData.gender === gender &&
                                                            styles.selectedGenderText,
                                                    ]}
                                                >
                                                    {gender}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </View>
                        <View style={[styles.inputWrapper, styles.halfWidth]}>
                            <TextInput
                                style={styles.input}
                                placeholder="Age"
                                placeholderTextColor="#666"
                                value={formData.age}
                                onChangeText={(text) => updateFormData("age", text)}
                                keyboardType="numeric"
                                maxLength={3}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.signupButton,
                            isLoading && styles.buttonDisabled,
                        ]}
                        onPress={handleSignup}
                        disabled={isLoading}
                    >
                        <Text style={styles.signupButtonText}>
                            {isLoading ? "Creating Account..." : "Create Account"}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>Already have an account? </Text>
                        <Link href="/auth/login" asChild>
                            <TouchableOpacity>
                                <Text style={styles.loginLink}>Sign In</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 32,
    },
    backButton: {
        alignSelf: "flex-start",
        padding: 8,
        marginBottom: 16,
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
    },
    formContainer: {
        paddingHorizontal: 24,
        paddingBottom: 32,
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
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    halfWidth: {
        width: "48%",
    },
    pickerContainer: {
        flex: 1,
    },
    genderOption: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        marginBottom: 4,
    },
    selectedGender: {
        backgroundColor: "#DC143C",
    },
    genderText: {
        fontSize: 14,
        color: "#666",
    },
    selectedGenderText: {
        color: "#FFF",
        fontWeight: "600",
    },
    signupButton: {
        backgroundColor: "#DC143C",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 24,
        marginBottom: 24,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    signupButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "bold",
    },
    loginContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    loginText: {
        color: "#666",
        fontSize: 16,
    },
    loginLink: {
        color: "#DC143C",
        fontSize: 16,
        fontWeight: "bold",
    },
});
