import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import React, {useState} from "react";
import {router} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";

import {apiBaseURL} from "@/app/_utils/apiBaseURL";
import {perk} from "@/app/_utils/colors";
import {useAuthStore} from "@/app/_utils/auth/authStore";
import {signOut} from "@/app/_utils/auth/session";

// Two steps: what is deleted and kept, then the password. Success signs out
// and shows the done message over the sign-in screen.
export default function DeleteAccount() {
    const insets = useSafeAreaInsets();
    const [step, setStep] = useState<"about" | "password">("about");
    const [password, setPassword] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const deleteAccount = async () => {
        if (!password) {
            setError("Enter your password.");
            return;
        }

        setIsDeleting(true);
        setError(null);
        const {userToken} = useAuthStore.getState();
        const response = await fetch(`${apiBaseURL}/api/accounts/native/delete/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${userToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({password}),
        }).catch(() => null);
        setIsDeleting(false);

        if (response?.status === 204) {
            // The server deleted the token with the account. Drop this phone's
            // copies too, including the one kept for Face ID or a fingerprint.
            await signOut("turn_off");
            Alert.alert(
                "Your account is deleted",
                "Your personal data is deleted, and you are signed out on every device.",
            );
            return;
        }
        if (response?.status === 401) {
            await signOut("expire");
            return;
        }

        const data = await response?.json().catch(() => null);
        if (response?.status === 400) {
            setError("Wrong password. Nothing was deleted.");
        } else if (response?.status === 403) {
            setError(
                "This account can only be deleted by an administrator. Ask one to delete it.",
            );
        } else if (response?.status === 429 && typeof data?.error === "string") {
            setError(data.error);
        } else {
            setError("Could not delete your account. Check your connection and try again.");
        }
    };

    return (
        <ScrollView
            contentContainerStyle={[
                styles.content,
                {paddingBottom: insets.bottom + 24, paddingTop: insets.top + 32},
            ]}
            keyboardShouldPersistTaps="handled"
            style={styles.screen}
        >
            {step === "about" ? (
                <>
                    <Text accessibilityRole="header" style={styles.title}>
                        Delete your account
                    </Text>
                    <Text style={styles.body}>
                        Your account is deleted at once. This cannot be undone.
                    </Text>

                    <View style={styles.section}>
                        <Text style={styles.heading}>What is deleted</Text>
                        <Text style={styles.body}>
                            {"•"} Your phone number, name, age, gender, role, and polling
                            centre.
                        </Text>
                        <Text style={styles.body}>
                            {"•"} Your sign-ins on every phone and browser.
                        </Text>
                        <Text style={styles.body}>
                            {"•"} Your phone verification records.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.heading}>What is kept</Text>
                        <Text style={styles.body}>
                            Results forms and polling centre checks you uploaded stay
                            published, without your name or phone number.
                        </Text>
                    </View>

                    <TouchableOpacity
                        accessibilityRole="button"
                        activeOpacity={0.85}
                        onPress={() => setStep("password")}
                        style={[styles.button, styles.nextButton]}
                    >
                        <Text style={styles.nextText}>Next</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <Text accessibilityRole="header" style={styles.title}>
                        Enter your password
                    </Text>
                    <Text style={styles.body}>
                        Enter your password to delete your account.
                    </Text>

                    {error ? (
                        <Text accessibilityRole="alert" style={styles.error}>
                            {error}
                        </Text>
                    ) : null}

                    <TextInput
                        accessibilityLabel="Password"
                        autoCapitalize="none"
                        autoComplete="current-password"
                        autoCorrect={false}
                        autoFocus
                        onChangeText={setPassword}
                        onSubmitEditing={() => void deleteAccount()}
                        returnKeyType="go"
                        secureTextEntry
                        style={styles.input}
                        textContentType="password"
                        value={password}
                    />

                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityState={{disabled: isDeleting}}
                        activeOpacity={0.85}
                        disabled={isDeleting}
                        onPress={() => void deleteAccount()}
                        style={[
                            styles.button,
                            styles.deleteButton,
                            isDeleting && styles.buttonDisabled,
                        ]}
                    >
                        <Text style={styles.deleteText}>
                            {isDeleting ? "Deleting…" : "Delete account"}
                        </Text>
                    </TouchableOpacity>
                </>
            )}

            <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.7}
                disabled={isDeleting}
                onPress={() => router.back()}
                style={styles.cancelButton}
            >
                <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {backgroundColor: perk.card, flex: 1},
    content: {gap: 20, paddingHorizontal: 24},
    title: {
        color: perk.ink,
        fontFamily: "PublicSans-ExtraBold",
        fontSize: 30,
        letterSpacing: -0.7,
        lineHeight: 38,
    },
    section: {gap: 6},
    heading: {color: perk.ink, fontSize: 17, fontWeight: "700"},
    body: {color: perk.inkSoft, fontSize: 16, lineHeight: 24},
    error: {
        backgroundColor: perk.coral,
        borderRadius: 10,
        color: perk.ink,
        fontSize: 13,
        fontWeight: "600",
        lineHeight: 18,
        paddingHorizontal: 14,
        paddingVertical: 11,
    },
    input: {
        borderColor: perk.rule16,
        borderRadius: 12,
        borderWidth: 1.5,
        color: perk.ink,
        fontSize: 18,
        fontWeight: "600",
        minHeight: 54,
        paddingHorizontal: 16,
    },
    button: {
        alignItems: "center",
        borderRadius: 14,
        justifyContent: "center",
        marginTop: 8,
        minHeight: 54,
        paddingHorizontal: 20,
    },
    buttonDisabled: {opacity: 0.4},
    nextButton: {backgroundColor: perk.lime},
    nextText: {color: perk.limeInk, fontSize: 16, fontWeight: "700"},
    deleteButton: {backgroundColor: perk.coralDeep},
    deleteText: {color: perk.paper, fontSize: 16, fontWeight: "700"},
    cancelButton: {alignItems: "center", justifyContent: "center", minHeight: 48},
    cancelText: {color: perk.ink, fontSize: 16, fontWeight: "600"},
});
