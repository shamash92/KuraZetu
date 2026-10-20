import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {ArrowRight, Check} from "lucide-react-native";
import React, {useState} from "react";
import * as WebBrowser from "expo-web-browser";
import {useSafeAreaInsets} from "react-native-safe-area-context";

import {apiBaseURL} from "@/app/_utils/apiBaseURL";
import {perk} from "@/app/_utils/colors";
import {useAuthStore} from "@/app/_utils/auth/authStore";
import {signOut} from "@/app/_utils/auth/session";

// Shown instead of the tabs while the person has not accepted the current
// terms version. Accepting or signing out are the only ways on.
export default function AcceptTerms() {
    const insets = useSafeAreaInsets();
    const [accepted, setAccepted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const accept = async () => {
        setIsSaving(true);
        setError(null);
        const {userToken, setTermsOutdated} = useAuthStore.getState();
        const response = await fetch(`${apiBaseURL}/api/accounts/terms/accept/`, {
            method: "POST",
            headers: {Authorization: `Bearer ${userToken}`},
        }).catch(() => null);
        setIsSaving(false);

        if (response?.status === 204) {
            setTermsOutdated(false);
        } else if (response?.status === 401) {
            await signOut("expire");
        } else {
            setError("Could not save. Check your connection and try again.");
        }
    };

    const leave = async () => {
        const {userToken} = useAuthStore.getState();
        // Revoke the token if the server can be reached; signing out here
        // never waits on it.
        await fetch(`${apiBaseURL}/api/accounts/native/logout/`, {
            method: "POST",
            headers: {Authorization: `Bearer ${userToken}`},
        }).catch(() => null);
        await signOut("expire");
    };

    const canAccept = accepted && !isSaving;

    return (
        <ScrollView
            contentContainerStyle={[
                styles.content,
                {paddingBottom: insets.bottom + 24, paddingTop: insets.top + 32},
            ]}
            style={styles.screen}
        >
            <Text accessibilityRole="header" style={styles.title}>
                The terms have changed
            </Text>
            <Text style={styles.body}>
                Read the new Terms of use and Privacy policy. Accept them to keep using
                KuraZetu.
            </Text>

            {error ? (
                <Text accessibilityRole="alert" style={styles.error}>
                    {error}
                </Text>
            ) : null}

            <TouchableOpacity
                accessibilityRole="checkbox"
                accessibilityState={{checked: accepted}}
                activeOpacity={0.7}
                onPress={() => setAccepted((value) => !value)}
                style={styles.termsRow}
            >
                <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
                    {accepted ? <Check color={perk.card} size={15} strokeWidth={3} /> : null}
                </View>
                <Text style={styles.termsText}>
                    I am 18 or older and accept the{" "}
                    <Text
                        accessibilityRole="link"
                        onPress={() =>
                            void WebBrowser.openBrowserAsync(`${apiBaseURL}/legal/terms/`)
                        }
                        style={styles.termsLink}
                    >
                        Terms of use
                    </Text>{" "}
                    and{" "}
                    <Text
                        accessibilityRole="link"
                        onPress={() =>
                            void WebBrowser.openBrowserAsync(`${apiBaseURL}/legal/privacy/`)
                        }
                        style={styles.termsLink}
                    >
                        Privacy policy
                    </Text>
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{disabled: !canAccept}}
                activeOpacity={0.85}
                disabled={!canAccept}
                onPress={() => void accept()}
                style={[styles.acceptButton, !canAccept && styles.acceptButtonDisabled]}
            >
                <Text style={styles.acceptText}>Accept</Text>
                <ArrowRight color={perk.limeInk} size={20} strokeWidth={2} />
            </TouchableOpacity>

            <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.7}
                onPress={() => void leave()}
                style={styles.signOutButton}
            >
                <Text style={styles.signOutText}>Sign out</Text>
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
    termsRow: {alignItems: "flex-start", flexDirection: "row", gap: 12, marginTop: 8},
    checkbox: {
        alignItems: "center",
        borderColor: perk.rule16,
        borderRadius: 6,
        borderWidth: 1.5,
        height: 22,
        justifyContent: "center",
        marginTop: 1,
        width: 22,
    },
    checkboxChecked: {backgroundColor: perk.ink, borderColor: perk.ink},
    termsText: {color: perk.inkSoft, flex: 1, fontSize: 14, lineHeight: 21},
    termsLink: {color: perk.ink, fontWeight: "600", textDecorationLine: "underline"},
    acceptButton: {
        alignItems: "center",
        backgroundColor: perk.lime,
        borderRadius: 14,
        flexDirection: "row",
        gap: 12,
        justifyContent: "center",
        marginTop: 8,
        minHeight: 54,
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    acceptButtonDisabled: {opacity: 0.4},
    acceptText: {color: perk.limeInk, fontSize: 16, fontWeight: "700"},
    signOutButton: {alignItems: "center", minHeight: 48, justifyContent: "center"},
    signOutText: {color: perk.ink, fontSize: 16, fontWeight: "600"},
});
