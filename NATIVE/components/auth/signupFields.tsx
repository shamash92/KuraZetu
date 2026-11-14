import React, {useState} from "react";
import {StyleSheet, Text, TextInput, View} from "react-native";
import type {TextInputProps} from "react-native";
import {perk} from "@/app/_utils/colors";

export function FieldLabel({label}: {label: string}) {
    return <Text style={styles.label}>{label}</Text>;
}

export function FieldError({message}: {message: string}) {
    return <Text accessibilityRole="alert" style={styles.fieldError}>{message}</Text>;
}

export function Input({error, trailing, onFocus, onBlur, ...props}: TextInputProps & {
    error?: string;
    trailing?: React.ReactNode;
}) {
    const [focused, setFocused] = useState(false);

    return (
        <View>
            <View style={[
                styles.inputShell,
                focused && styles.inputShellFocused,
                error && styles.inputShellError,
            ]}>
                <TextInput
                    {...props}
                    onBlur={(event) => {
                        setFocused(false);
                        onBlur?.(event);
                    }}
                    onFocus={(event) => {
                        setFocused(true);
                        onFocus?.(event);
                    }}
                    placeholderTextColor={perk.mute}
                    selectionColor={perk.ink}
                    style={styles.input}
                />
                {trailing}
            </View>
            {error ? <FieldError message={error} /> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    label: {color: perk.inkSoft, fontSize: 14, fontWeight: "500", lineHeight: 20, marginBottom: 8},
    inputShell: {alignItems: "center", backgroundColor: perk.card, borderColor: perk.rule16, borderRadius: 12, borderWidth: 1, flexDirection: "row", minHeight: 52},
    inputShellFocused: {borderColor: perk.ink},
    inputShellError: {borderColor: perk.coralDeep},
    input: {color: perk.ink, flex: 1, fontSize: 16, fontWeight: "400", minHeight: 50, paddingHorizontal: 14, paddingVertical: 12},
    fieldError: {color: perk.coralDeep, fontSize: 12, fontWeight: "500", lineHeight: 17, marginTop: 6},
});
