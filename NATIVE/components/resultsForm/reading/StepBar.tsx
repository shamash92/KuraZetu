import {StyleSheet, View} from "react-native";

import {perk} from "@/app/_utils/colors";

const STEPS = 3;

/** Photo, reading, check and submit: done steps ink, the current one lime. */
export function StepBar({step}: {step: 1 | 2 | 3}) {
    return (
        <View
            style={styles.bar}
            accessibilityRole="progressbar"
            accessibilityLabel={`Step ${step} of ${STEPS}`}
        >
            {Array.from({length: STEPS}, (_, index) => (
                <View
                    key={index}
                    style={[
                        styles.segment,
                        index + 1 < step && styles.done,
                        index + 1 === step && styles.current,
                    ]}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    bar: {
        flexDirection: "row",
        gap: 6,
    },
    segment: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        backgroundColor: perk.surface,
    },
    done: {backgroundColor: perk.ink},
    current: {backgroundColor: perk.limeDeep},
});
