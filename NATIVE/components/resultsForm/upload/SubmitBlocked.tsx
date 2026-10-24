import {Linking, StyleSheet, Text, TouchableOpacity, View} from "react-native";

import {perk} from "@/app/_utils/colors";

interface SubmitBlockedProps {
    reason: "offline" | "location";
    onRetry: () => void;
}

const COPY = {
    offline: {
        title: "No internet connection",
        body: "Uploading results needs internet. Connect, then tap Retry.",
    },
    location: {
        title: "Location is off for Kura Zetu",
        body: "Uploads need your location to check you are at the polling centre. Allow location in Settings, then tap Retry.",
    },
} as const;

/** Shown instead of the submit screen until internet and location work. */
export function SubmitBlocked({reason, onRetry}: SubmitBlockedProps) {
    const {title, body} = COPY[reason];
    return (
        <View style={styles.body}>
            <Text style={styles.title} accessibilityRole="header">
                {title}
            </Text>
            <Text style={styles.text}>{body}</Text>
            <TouchableOpacity
                style={styles.retry}
                onPress={onRetry}
                accessibilityRole="button"
            >
                <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
            {reason === "location" && (
                <TouchableOpacity
                    style={styles.settings}
                    onPress={() => void Linking.openSettings()}
                    accessibilityRole="button"
                >
                    <Text style={styles.settingsText}>Open Settings</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    body: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
        gap: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: "900",
        color: perk.ink,
    },
    text: {
        fontSize: 15,
        lineHeight: 22,
        color: perk.ink,
        marginBottom: 8,
    },
    retry: {
        paddingVertical: 16,
        borderRadius: 999,
        backgroundColor: perk.lime,
        alignItems: "center",
    },
    retryText: {
        color: perk.limeInk,
        fontSize: 15,
        fontWeight: "700",
    },
    settings: {
        paddingVertical: 16,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: perk.rule16,
        alignItems: "center",
    },
    settingsText: {
        color: perk.ink,
        fontSize: 15,
        fontWeight: "700",
    },
});
