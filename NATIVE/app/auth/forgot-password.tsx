import {Alert, StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";
import {ArrowLeft, Mail, Phone} from "lucide-react-native";
import React, {useState} from "react";

import {LinearGradient} from "expo-linear-gradient";
import {router} from "expo-router";

export default function ForgotPasswordScreen() {
    const [phoneNumber, setPhoneNumber] = useState("+254");
    const [isLoading, setIsLoading] = useState(false);

    const formatPhoneNumber = (text: string) => {
        if (!text.startsWith("+254")) {
            return "+254";
        }
        return text;
    };

    const handleResetPassword = () => {
        Alert.alert(
            "This feature is not available yet",
            "Please check back later for updates.",
            [{text: "OK", onPress: () => router.back()}],
        );
        return;

        // if (!phoneNumber || phoneNumber === "+254") {
        //     Alert.alert("Error", "Please enter your phone number");
        //     return;
        // }

        // setIsLoading(true);
        // // Simulate password reset process
        // setTimeout(() => {
        //     setIsLoading(false);
        //     Alert.alert(
        //         "Success",
        //         "Password reset instructions have been sent to your phone number.",
        //         [{text: "OK", onPress: () => router.back()}],
        //     );
        // }, 2000);
    };

    return (
        <LinearGradient
            colors={["#DC143C", "#006B3C", "#1E40AF"]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.container}
        >
            <View style={styles.overlay}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <ArrowLeft size={24} color="#DC143C" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Mail size={64} color="#DC143C" />
                    </View>

                    <Text style={styles.title}>Forgot Password?</Text>
                    <Text style={styles.subtitle}>
                        {
                            "Don't worry! Enter your phone number and we'll send you instructions to reset your password."
                        }
                    </Text>

                    <View style={styles.inputWrapper}>
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
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.resetButton, isLoading && styles.buttonDisabled]}
                        onPress={handleResetPassword}
                        disabled={isLoading}
                    >
                        <Text style={styles.resetButtonText}>
                            {isLoading ? "Sending..." : "Send Reset Instructions"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.backToLoginButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backToLoginText}>Back to Sign In</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
    },
    backButton: {
        alignSelf: "flex-start",
        padding: 8,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#F8F9FA",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#000",
        marginBottom: 16,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 32,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8F9FA",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#E9ECEF",
        width: "100%",
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: "#000",
    },
    resetButton: {
        backgroundColor: "#DC143C",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        width: "100%",
        marginBottom: 16,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    resetButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "bold",
    },
    backToLoginButton: {
        paddingVertical: 12,
    },
    backToLoginText: {
        color: "#DC143C",
        fontSize: 16,
        fontWeight: "600",
    },
});
