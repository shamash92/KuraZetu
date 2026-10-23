import {StyleSheet, Text, TextInput, View} from "react-native";

import {parseVoteCount} from "./voteCount";
import {perk} from "@/app/_utils/colors";

interface VoteCountRowProps {
    label: string;
    party?: string | null;
    /** Null until a number is typed; 0 is a typed number. */
    value: number | null;
    accessibilityLabel: string;
    onChange: (value: number | null) => void;
}

/** A labelled, sanitized vote input shared by every tally row. */
export function VoteCountRow({
    label,
    party,
    value,
    accessibilityLabel,
    onChange,
}: VoteCountRowProps) {
    return (
        <View style={styles.row}>
            <View style={styles.who}>
                <Text style={styles.name} numberOfLines={1}>
                    {label}
                </Text>
                {!!party && (
                    <Text style={styles.party} numberOfLines={1}>
                        {party}
                    </Text>
                )}
            </View>
            <TextInput
                style={[styles.input, value !== null && styles.inputSet]}
                value={value === null ? "" : String(value)}
                onChangeText={(text) => onChange(parseVoteCount(text))}
                accessibilityLabel={accessibilityLabel}
                hitSlop={5}
                keyboardType="numeric"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: perk.rule08,
    },
    who: {
        flex: 1,
        paddingRight: 12,
    },
    name: {
        fontSize: 12.5,
        fontWeight: "800",
        color: perk.ink,
    },
    party: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 9,
        color: perk.mute,
        letterSpacing: 0.6,
        marginTop: 1,
        textTransform: "uppercase",
    },
    input: {
        width: 52,
        height: 34,
        borderWidth: 1.5,
        borderColor: perk.rule16,
        borderRadius: 9,
        paddingHorizontal: 4,
        fontFamily: "SpaceMono-Regular",
        fontSize: 12,
        fontWeight: "700",
        textAlign: "center",
        color: perk.mute2,
        backgroundColor: perk.card,
    },
    inputSet: {
        borderColor: perk.ink,
        color: perk.ink,
    },
});
