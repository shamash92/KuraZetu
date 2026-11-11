import {ActivityIndicator, StyleSheet, Text, View} from "react-native";
import {Check, Minus, X} from "lucide-react-native";

import type {AgreementCheck} from "./prefill";
import {perk} from "@/app/_utils/colors";

/**
 * What the server checks on a photo taken to agree with an earlier upload,
 * one line each. A line spins until its check ends, then shows a tick or a
 * cross, and any figure that differs underneath.
 */
export function AgreementChecklist({
    checks,
    ended = false,
}: {
    /** Null while the photo is still being sent. */
    checks: AgreementCheck[] | null;
    /** No more answers will come: a line still running did not finish. */
    ended?: boolean;
}) {
    if (!checks) {
        return (
            <View style={styles.list}>
                <Row label="Uploading the photo" state="running" details={[]} />
            </View>
        );
    }
    return (
        <View style={styles.list}>
            {checks.map((check) => (
                <Row
                    key={check.code}
                    label={check.label}
                    state={ended && check.state === "running" ? "failed" : check.state}
                    details={check.details}
                />
            ))}
        </View>
    );
}

function Row({
    label,
    state,
    details,
}: {
    label: string;
    state: AgreementCheck["state"];
    details: string[];
}) {
    return (
        <View
            style={styles.row}
            accessible
            accessibilityLabel={`${label}: ${STATE_NAMES[state]}`}
        >
            <View style={styles.line}>
                <Text style={[styles.label, state === "running" && styles.labelRunning]}>
                    {label}
                </Text>
                <View style={styles.icon}>
                    {state === "running" ? (
                        <ActivityIndicator size="small" color={perk.mute} />
                    ) : state === "passed" ? (
                        <Check size={20} color={perk.green} strokeWidth={3} />
                    ) : state === "failed" ? (
                        <X size={20} color={perk.coralDeep} strokeWidth={3} />
                    ) : (
                        <Minus size={20} color={perk.mute} strokeWidth={3} />
                    )}
                </View>
            </View>
            {details.map((detail) => (
                <Text key={detail} style={styles.detail}>
                    {detail}
                </Text>
            ))}
        </View>
    );
}

const STATE_NAMES: Record<AgreementCheck["state"], string> = {
    running: "checking",
    passed: "passed",
    failed: "failed",
    not_read: "not read",
};

const styles = StyleSheet.create({
    list: {
        gap: 2,
    },
    row: {
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: perk.rule16,
        gap: 4,
    },
    line: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    label: {
        flex: 1,
        fontSize: 16,
        lineHeight: 21,
        fontWeight: "600",
        color: perk.ink,
    },
    labelRunning: {
        color: perk.mute,
    },
    icon: {
        width: 24,
        alignItems: "center",
    },
    detail: {
        fontSize: 14,
        lineHeight: 19,
        color: perk.mute,
        fontVariant: ["tabular-nums"],
    },
});
