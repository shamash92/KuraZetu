import {StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {Camera as CameraIcon} from "lucide-react-native";

import {CaptureTipArt} from "../tips/CaptureTipArt";
import {StepBar} from "./StepBar";
import {perk} from "@/app/_utils/colors";

interface PhotoStepPaneProps {
    /** The results form being captured, e.g. "Form 36A". */
    formName: string;
    onCapture: () => void;
}

/** The first step: photograph the form. The figures are read from the photo. */
export function PhotoStepPane({formName, onCapture}: PhotoStepPaneProps) {
    return (
        <View style={styles.body}>
            <StepBar step={1} />
            <Text style={styles.heading} accessibilityRole="header">
                Step 1
            </Text>
            <CaptureTipArt art="fill" style={styles.art} />
            <TouchableOpacity
                style={styles.button}
                onPress={onCapture}
                accessibilityRole="button"
            >
                <CameraIcon size={18} color={perk.lime} />
                <Text style={styles.buttonText}>Capture {formName}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    body: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 16,
        gap: 20,
    },
    heading: {
        fontSize: 40,
        fontWeight: "900",
        letterSpacing: -1,
        color: perk.ink,
    },
    // The drawing fills the space between the heading and the button.
    art: {
        flex: 1,
        height: undefined,
        marginHorizontal: 0,
        borderRadius: 24,
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
