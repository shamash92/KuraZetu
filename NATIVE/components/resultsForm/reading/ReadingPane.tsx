import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {Image} from "expo-image";
import {Camera as CameraIcon} from "lucide-react-native";

import {StepBar} from "./StepBar";
import {perk} from "@/app/_utils/colors";

interface ReadingPaneProps {
    formName: string;
    imageUri: string;
    /** The photo is still being sent to the server. */
    sending: boolean;
    /** Why the photo cannot be used; null while it is being read. */
    retakeMessage: string | null;
    onRetake: () => void;
}

/** The photo while the server reads it, or why it must be taken again. */
export function ReadingPane({
    formName,
    imageUri,
    sending,
    retakeMessage,
    onRetake,
}: ReadingPaneProps) {
    const reading = retakeMessage === null;
    return (
        <View style={styles.body}>
            <Image
                source={{uri: imageUri}}
                style={[styles.photo, reading && styles.photoReading]}
                contentFit="contain"
                accessibilityIgnoresInvertColors
            />
            <View style={styles.panel}>
                <StepBar step={2} />
                {reading ? (
                    <View style={styles.status} accessibilityLiveRegion="polite">
                        <ActivityIndicator size="small" color={perk.ink} />
                        <Text style={styles.heading}>
                            {sending ? "Uploading the photo" : `Reading ${formName} with AI`}
                        </Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.heading} accessibilityRole="alert">
                            {retakeMessage}
                        </Text>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={onRetake}
                            accessibilityRole="button"
                        >
                            <CameraIcon size={18} color={perk.lime} />
                            <Text style={styles.buttonText}>Retake photo</Text>
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
    photoReading: {
        opacity: 0.55,
    },
    panel: {
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 16,
        gap: 16,
        backgroundColor: perk.card,
    },
    status: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
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
});
