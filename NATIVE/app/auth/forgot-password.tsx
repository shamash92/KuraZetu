import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {ArrowLeft, ArrowRight, Mail} from "lucide-react-native";
import React, {useState} from "react";

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
    RULE_16,
    SURFACE,
} from "../_utils/colors";

export default function ForgotPasswordScreen() {
    const [phoneNumber, setPhoneNumber] = useState("+254");

    const insets = useSafeAreaInsets();

    // National number digits only (without the +254 country code).
    const nationalNumber = phoneNumber.replace(/^\+254/, "");
    const handlePhoneChange = (text: string) => {
        const digits = text.replace(/[^0-9]/g, "").slice(0, 9);
        setPhoneNumber("+254" + digits);
    };

    const handleResetPassword = () => {
        Alert.alert(
            "This feature is not available yet",
            "Please check back later for updates.",
            [{text: "OK", onPress: () => router.back()}],
        );
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
                <TouchableOpacity
                    style={styles.back}
                    onPress={() => router.back()}
                    hitSlop={8}
                >
                    <ArrowLeft size={22} color={INK} strokeWidth={2.2} />
                </TouchableOpacity>

                <View style={styles.hero}>
                    <View style={styles.iconCircle}>
                        <Mail size={34} color={COPPER_DEEP} strokeWidth={1.8} />
                    </View>

                    <Text style={styles.heading}>Forgot password?</Text>
                    <Text style={styles.subtitle}>
                        Don&apos;t worry — enter your phone number and we&apos;ll send
                        you instructions to reset your password.
                    </Text>
                </View>

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
                            returnKeyType="send"
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.primary}
                    onPress={handleResetPassword}
                    activeOpacity={0.85}
                >
                    <Text style={styles.primaryText}>Send reset instructions</Text>
                    <ArrowRight size={18} color={LIME_INK} strokeWidth={2.4} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.backLink}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backLinkText}>Back to sign in</Text>
                </TouchableOpacity>
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
});
