import {ArrowRight} from "lucide-react-native";
import {Path, Svg} from "react-native-svg";
import {StyleSheet, Text, TouchableOpacity, View} from "react-native";

import {COPPER, CORAL, INK, LIME, LIME_INK, MUTE, RED} from "@/app/_utils/colors";

type ExistingAccountRecoveryProps = {
    onResetPassword: () => void;
    onSignIn: () => void;
    onUseAnotherNumber: () => void;
};

/**
 * This appears only after the person has proved control of a phone number
 * that belongs to an existing account. The matching web illustration lives in
 * `src/ui/src/auth/signup/ExistingAccountRecovery.tsx`.
 */
export default function ExistingAccountRecovery({
    onResetPassword,
    onSignIn,
    onUseAnotherNumber,
}: ExistingAccountRecoveryProps) {
    return (
        <View style={styles.container}>
            <AccountRecoveryIllustration />
            <Text style={styles.heading}>Choose how to continue.</Text>
            <Text style={styles.warning}>This number already has an account.</Text>

            <View style={styles.options} accessibilityLabel="Choose how to continue">
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Sign in"
                    activeOpacity={0.85}
                    onPress={onSignIn}
                    style={[styles.choice, styles.signIn]}
                >
                    <Text style={styles.signInText}>Sign in</Text>
                    <ArrowRight color={LIME_INK} size={18} strokeWidth={2.4} />
                </TouchableOpacity>
                <Text accessibilityElementsHidden style={styles.or}>
                    OR
                </Text>
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Reset password"
                    activeOpacity={0.85}
                    onPress={onResetPassword}
                    style={[styles.choice, styles.reset]}
                >
                    <Text style={styles.resetText}>Reset password</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Use another number"
                activeOpacity={0.75}
                onPress={onUseAnotherNumber}
                style={styles.useAnotherNumber}
            >
                <Text style={styles.useAnotherNumberText}>Use another number</Text>
            </TouchableOpacity>
        </View>
    );
}

function AccountRecoveryIllustration() {
    return (
        <Svg
            accessible={false}
            height={225}
            style={styles.illustration}
            viewBox="0 0 400 300"
            width="100%"
        >
            <Path d="M-10 274 C58 262 118 276 198 280 C278 284 338 272 412 262" {...inkStroke} />
            <Path d="M156 36 L244 36 A18 18 0 0 1 262 54 L262 242 A18 18 0 0 1 244 260 L156 260 A18 18 0 0 1 138 242 L138 54 A18 18 0 0 1 156 36 Z" {...inkStroke} />
            <Path d="M160 60 L240 60 A10 10 0 0 1 250 70 L250 226 A10 10 0 0 1 240 236 L160 236 A10 10 0 0 1 150 226 L150 70 A10 10 0 0 1 160 60 Z" {...mutedStroke} />
            <Path d="M186 48 L214 48" {...inkStroke} />
            <Path d="M166 86 L212 86" {...mutedStroke} />
            <Path d="M171 98 L229 98 A5 5 0 0 1 234 103 L234 115 A5 5 0 0 1 229 120 L171 120 A5 5 0 0 1 166 115 L166 103 A5 5 0 0 1 171 98 Z" {...inkStroke} />
            <Path d="M175 109 L225 109" {...limeStroke} />
            <Path d="M166 142 L222 142" {...mutedStroke} />
            <Path d="M166 158 L200 158" {...mutedStroke} />
            <Path d="M222 228 A30 30 0 1 0 282 228 A30 30 0 1 0 222 228" {...copperStroke} />
            <Path d="M241 217 L263 239" {...inkStroke} />
            <Path d="M263 217 L241 239" {...inkStroke} />
            <Path d="M300 252 C342 242 358 214 350 188" {...arrowStroke} />
            <Path d="M342 196 L350 184 L359 192" {...arrowStroke} />
            <Path d="M84 113 C85.12 117.62 86.38 118.88 91 120 C86.38 121.12 85.12 122.38 84 127 C82.88 122.38 81.62 121.12 77 120 C81.62 118.88 82.88 117.62 84 113 Z" {...mutedStroke} />
            <Path d="M330 91 C330.8 94.3 331.7 95.2 335 96 C331.7 96.8 330.8 97.7 330 101 C329.2 97.7 328.3 96.8 325 96 C328.3 95.2 329.2 94.3 330 91 Z" {...mutedStroke} />
        </Svg>
    );
}

const lineDefaults = {
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
};
const inkStroke = {...lineDefaults, stroke: INK, strokeWidth: 1.5};
const mutedStroke = {...lineDefaults, stroke: MUTE, strokeWidth: 1};
const limeStroke = {...lineDefaults, stroke: LIME, strokeWidth: 1.5};
const copperStroke = {...lineDefaults, stroke: COPPER, strokeWidth: 1.5};
const arrowStroke = {...lineDefaults, stroke: MUTE, strokeWidth: 1.25};

const styles = StyleSheet.create({
    container: {alignItems: "center", paddingHorizontal: 22},
    illustration: {maxWidth: 300, marginBottom: 8},
    heading: {
        color: INK,
        fontFamily: "PublicSans-ExtraBold",
        fontSize: 30,
        letterSpacing: -1.1,
        lineHeight: 34,
        maxWidth: 320,
        textAlign: "center",
    },
    warning: {color: RED, fontSize: 14, fontWeight: "700", lineHeight: 20, marginTop: 14},
    options: {alignItems: "center", flexDirection: "row", gap: 8, marginTop: 28},
    choice: {
        alignItems: "center",
        borderRadius: 14,
        flexDirection: "row",
        height: 52,
        justifyContent: "center",
        paddingHorizontal: 14,
    },
    signIn: {backgroundColor: LIME, flex: 1, gap: 12, justifyContent: "space-between"},
    signInText: {color: LIME_INK, fontSize: 13, fontWeight: "800"},
    reset: {backgroundColor: CORAL, flex: 1},
    resetText: {color: INK, fontSize: 13, fontWeight: "800"},
    or: {
        color: MUTE,
        fontFamily: "SpaceMono-Regular",
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1.2,
    },
    useAnotherNumber: {marginTop: 18, paddingHorizontal: 12, paddingVertical: 10},
    useAnotherNumberText: {
        color: INK,
        fontFamily: "SpaceMono-Regular",
        fontSize: 11,
        fontWeight: "700",
        textDecorationLine: "underline",
    },
});
