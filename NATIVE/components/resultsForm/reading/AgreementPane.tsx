import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {Image} from "expo-image";
import {Camera as CameraIcon} from "lucide-react-native";

import {StepBar} from "./StepBar";
import {perk} from "@/app/_utils/colors";

interface AgreementPaneProps {
    imageUri: string;
    /** The server's sentence about the photo. */
    message: string;
    /** The photo matches the earlier upload: it can be submitted. */
    agrees: boolean;
    submitting: boolean;
    onSubmit: () => void;
    onRetake: () => void;
    /** Type the results from this photo instead. */
    onDisagree: () => void;
}

/**
 * Step 3 of agreeing with an earlier upload:
 * Submit when the photo matches; otherwise Retake photo or Disagree.
 */
export function AgreementPane({
    imageUri,
    message,
    agrees,
    submitting,
    onSubmit,
    onRetake,
    onDisagree,
}: AgreementPaneProps) {
    return (
        <View style={styles.body}>
            <Image
                source={{uri: imageUri}}
                style={styles.photo}
                contentFit="contain"
                accessibilityIgnoresInvertColors
            />
            <View style={styles.panel}>
                <StepBar step={3} />
                <Text style={styles.heading} accessibilityRole="alert">
                    {message}
                </Text>
                {agrees ? (
                    <TouchableOpacity
                        style={[styles.button, styles.submit]}
                        onPress={onSubmit}
                        disabled={submitting}
                        accessibilityRole="button"
                        accessibilityState={{busy: submitting}}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color={perk.limeInk} />
                        ) : (
                            <Text style={styles.submitText}>Submit</Text>
                        )}
                    </TouchableOpacity>
                ) : (
                    <>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={onRetake}
                            accessibilityRole="button"
                        >
                            <CameraIcon size={18} color={perk.lime} />
                            <Text style={styles.buttonText}>Retake photo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.secondary]}
                            onPress={onDisagree}
                            accessibilityRole="button"
                        >
                            <Text style={styles.secondaryText}>Disagree</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    body: {flex: 1},
    photo: {
        flex: 1,
        backgroundColor: perk.ink,
    },
    panel: {
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 16,
        gap: 12,
        backgroundColor: perk.card,
    },
    heading: {
        fontSize: 19,
        fontWeight: "900",
        letterSpacing: -0.3,
        lineHeight: 25,
        color: perk.ink,
    },
    button: {
        flexDirection: "row",
        backgroundColor: perk.ink,
        paddingVertical: 16,
        borderRadius: 999,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    buttonText: {
        color: perk.lime,
        fontSize: 15,
        fontWeight: "800",
    },
    submit: {
        backgroundColor: perk.lime,
    },
    submitText: {
        color: perk.limeInk,
        fontSize: 15,
        fontWeight: "800",
    },
    secondary: {
        backgroundColor: perk.surface,
    },
    secondaryText: {
        color: perk.ink,
        fontSize: 15,
        fontWeight: "800",
    },
});
