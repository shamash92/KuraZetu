import {useState} from "react";
import {StyleSheet, Text, TextInput, View} from "react-native";

import {VOTE_DIGITS, voteBoxes, voteDigits} from "./voteCount";
import {perk} from "@/app/_utils/colors";

interface VoteCountRowProps {
    label: string;
    party?: string | null;
    /** The digits typed so far, at most three; "" until something is typed. */
    value: string;
    accessibilityLabel: string;
    onChange: (digits: string) => void;
}

/**
 * A labelled vote count in three digit boxes, like the boxes on the form.
 * They start as a grey 000 and fill from the right as digits are typed. A
 * see-through input over the boxes takes the typing.
 */
export function VoteCountRow({
    label,
    party,
    value,
    accessibilityLabel,
    onChange,
}: VoteCountRowProps) {
    const [focused, setFocused] = useState(false);
    const typed = value !== "";
    const shown = voteBoxes(value);
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
            <View style={styles.boxes}>
                {Array.from({length: VOTE_DIGITS}, (_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.box,
                            typed && styles.boxTyped,
                            focused && styles.boxFocused,
                        ]}
                    >
                        <Text style={[styles.digit, !typed && styles.digitUntouched]}>
                            {shown[index]}
                        </Text>
                    </View>
                ))}
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={(text) => onChange(voteDigits(text))}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    accessibilityLabel={accessibilityLabel}
                    keyboardType="number-pad"
                    maxLength={VOTE_DIGITS}
                    caretHidden
                    hitSlop={6}
                />
            </View>
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
        fontSize: 13,
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
    boxes: {
        flexDirection: "row",
        gap: 4,
    },
    box: {
        width: 30,
        height: 38,
        borderWidth: 1.5,
        borderColor: perk.rule16,
        borderRadius: 9,
        backgroundColor: perk.card,
        alignItems: "center",
        justifyContent: "center",
    },
    boxTyped: {
        borderColor: perk.ink,
    },
    // The row being typed in. Lime Deep: plain lime is too faint as a line.
    boxFocused: {
        borderColor: perk.limeDeep,
        borderWidth: 2,
    },
    digit: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 19,
        color: perk.ink,
        fontVariant: ["tabular-nums"],
    },
    digitUntouched: {
        color: perk.mute2,
    },
    input: {
        ...StyleSheet.absoluteFill,
        color: "transparent",
        fontSize: 1,
    },
});
