import {useState} from "react";
import {StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {ArrowRight, Camera as CameraIcon, ChevronLeft} from "lucide-react-native";
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
    type EntryExitAnimationFunction,
    useReducedMotion,
    withTiming,
} from "react-native-reanimated";

import {CaptureTipArt, type CaptureTipArtKind} from "./CaptureTipArt";
import {perk} from "@/app/_utils/colors";

/** In the order the citizen acts: before raising the phone, then framing. */
const TIPS: ReadonlyArray<{art: CaptureTipArtKind; title: string; body: string}> = [
    {
        art: "wipe",
        title: "Wipe your camera for a clear shot",
        body: "A smudge on the camera can make the numbers hard to read.",
    },
    {
        art: "fill",
        title: "Fill the brackets with the form",
        body: "Get close. The corners should almost touch.",
    },
    {
        art: "qr",
        title: "Keep the whole QR code in view",
        body: "It confirms your polling station and stream.",
    },
    {
        art: "tap",
        title: "Hold steady, then tap",
        body: "The button appears when the form is sharp.",
    },
];

/** How far a swipe must travel to change tips. */
const SWIPE_DISTANCE = 50;

/** A tip slides in a little from the side it was swiped from. */
function tipEntering(fromX: number): EntryExitAnimationFunction {
    return () => {
        "worklet";
        return {
            initialValues: {opacity: 0, transform: [{translateX: fromX}]},
            animations: {
                opacity: withTiming(1, {duration: 220}),
                transform: [{translateX: withTiming(0, {duration: 220})}],
            },
        };
    };
}

/**
 * Tips shown each time the results form camera is opened from the form.
 * The parent owns `step` so the Android back button can step back through
 * the tips; Skip and Start camera both finish them.
 */
export function CaptureTips({
    step,
    onStepChange,
    onFinish,
}: {
    step: number;
    onStepChange: (step: number) => void;
    onFinish: () => void;
}) {
    const reduceMotion = useReducedMotion();
    const [shownStep, setShownStep] = useState(step);
    const [direction, setDirection] = useState(1);
    // Render-phase adjustment: whichever way the step changed, including the
    // Android back button, the next tip enters from that side.
    if (step !== shownStep) {
        setDirection(step > shownStep ? 1 : -1);
        setShownStep(step);
    }

    const tip = TIPS[step];
    const last = step === TIPS.length - 1;

    const swipe = Gesture.Pan()
        .activeOffsetX([-20, 20])
        .failOffsetY([-20, 20])
        .runOnJS(true)
        .onEnd((event) => {
            if (event.translationX <= -SWIPE_DISTANCE && !last) {
                onStepChange(step + 1);
            } else if (event.translationX >= SWIPE_DISTANCE && step > 0) {
                onStepChange(step - 1);
            }
        });

    return (
        <GestureHandlerRootView style={styles.container}>
            <GestureDetector gesture={swipe}>
                <View style={styles.container}>
                    <View style={styles.progress}>
                        <View style={styles.segments}>
                            {TIPS.map((item, index) => (
                                <View
                                    key={item.art}
                                    style={[
                                        styles.segment,
                                        index <= step && styles.segmentDone,
                                    ]}
                                />
                            ))}
                        </View>
                    </View>

                    <Animated.View
                        key={step}
                        entering={
                            reduceMotion ? undefined : tipEntering(12 * direction)
                        }
                        style={styles.tip}
                    >
                        <CaptureTipArt art={tip.art} />
                        <View style={styles.copy}>
                            <Text style={styles.title} accessibilityRole="header">
                                {tip.title}
                            </Text>
                            <Text style={styles.body}>{tip.body}</Text>
                        </View>
                    </Animated.View>

                    <View style={styles.controls}>
                        {step > 0 ? (
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => onStepChange(step - 1)}
                                accessibilityRole="button"
                                accessibilityLabel="Previous tip"
                            >
                                <ChevronLeft size={22} color={perk.ink} />
                            </TouchableOpacity>
                        ) : null}
                        {last ? (
                            <TouchableOpacity
                                style={styles.startButton}
                                onPress={onFinish}
                                accessibilityRole="button"
                            >
                                <CameraIcon size={20} color={perk.limeInk} />
                                <Text style={styles.startText}>Start camera</Text>
                            </TouchableOpacity>
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={styles.skipButton}
                                    onPress={onFinish}
                                    accessibilityRole="button"
                                    accessibilityHint="Opens the camera"
                                >
                                    <Text style={styles.skipText}>Skip</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.nextButton}
                                    onPress={() => onStepChange(step + 1)}
                                    accessibilityRole="button"
                                    accessibilityLabel="Next tip"
                                >
                                    <Text style={styles.nextText}>Next</Text>
                                    <ArrowRight size={20} color={perk.paper} />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </GestureDetector>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1},
    progress: {
        paddingHorizontal: 22,
        paddingTop: 6,
        paddingBottom: 14,
    },
    segments: {flexDirection: "row", gap: 4},
    segment: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        backgroundColor: perk.rule16,
    },
    segmentDone: {backgroundColor: perk.ink},
    tip: {flex: 1},
    copy: {paddingHorizontal: 24, paddingTop: 24},
    title: {
        fontFamily: "PublicSans-ExtraBold",
        fontSize: 28,
        lineHeight: 31,
        letterSpacing: -0.8,
        color: perk.ink,
    },
    body: {
        marginTop: 10,
        fontSize: 17,
        lineHeight: 25,
        color: perk.inkSoft,
    },
    controls: {
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
    },
    backButton: {
        width: 56,
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: perk.rule16,
        alignItems: "center",
        justifyContent: "center",
    },
    skipButton: {
        height: 56,
        paddingHorizontal: 18,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: perk.rule16,
        alignItems: "center",
        justifyContent: "center",
    },
    skipText: {fontSize: 17, fontWeight: "700", color: perk.ink},
    nextButton: {
        flex: 1,
        height: 56,
        borderRadius: 12,
        backgroundColor: perk.ink,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    nextText: {fontSize: 17, fontWeight: "700", color: perk.paper},
    startButton: {
        flex: 1,
        height: 56,
        borderRadius: 12,
        backgroundColor: perk.lime,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    startText: {fontSize: 17, fontWeight: "800", color: perk.limeInk},
});
