import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from "react-native";

import {StepBar} from "./StepBar";
import {perk} from "@/app/_utils/colors";

/**
 * The photo shows exactly the results of an earlier upload: offer to agree
 * with it instead of typing the same results again.
 */
export function SameResultsPane({
    sending,
    onAgree,
    onType,
}: {
    /** The agreement is being started. */
    sending: boolean;
    onAgree: () => void;
    /** Type the results anyway. */
    onType: () => void;
}) {
    return (
        <View style={styles.body}>
            <View style={styles.top}>
                <StepBar step={3} />
                <Text style={styles.title} accessibilityRole="header">
                    Same results as the first upload
                </Text>
                <Text style={styles.text}>
                    Your photo shows the same results as an upload already made for this
                    station. Agree with it instead of typing them again.
                </Text>
            </View>
            <View style={styles.panel}>
                <View style={styles.row}>
                    <TouchableOpacity
                        style={[styles.button, styles.half, styles.secondary]}
                        onPress={onType}
                        disabled={sending}
                        accessibilityRole="button"
                    >
                        <Text style={styles.secondaryText}>Type results</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.half, styles.agree]}
                        onPress={onAgree}
                        disabled={sending}
                        accessibilityRole="button"
                        accessibilityState={{busy: sending}}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color={perk.limeInk} />
                        ) : (
                            <Text style={styles.agreeText}>Agree</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    body: {flex: 1, justifyContent: "space-between"},
    top: {
        paddingHorizontal: 20,
        paddingTop: 4,
        gap: 16,
    },
    title: {
        fontSize: 28,
        lineHeight: 32,
        fontWeight: "900",
        letterSpacing: -0.6,
        color: perk.ink,
    },
    text: {
        fontSize: 16,
        lineHeight: 22,
        color: perk.ink,
    },
    panel: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: perk.card,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: perk.rule16,
    },
    row: {
        flexDirection: "row",
        gap: 12,
    },
    half: {
        flex: 1,
        flexBasis: 0,
    },
    button: {
        flexDirection: "row",
        paddingVertical: 16,
        borderRadius: 999,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    secondary: {
        backgroundColor: perk.surface,
    },
    secondaryText: {
        color: perk.ink,
        fontSize: 15,
        fontWeight: "800",
    },
    agree: {
        backgroundColor: perk.lime,
    },
    agreeText: {
        color: perk.limeInk,
        fontSize: 15,
        fontWeight: "800",
    },
});
