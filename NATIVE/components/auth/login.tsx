import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import {INK, LIME, MUTE, PAPER, PAPER_DEEP, RULE_08} from "../../app/_utils/colors";
import {useEffect, useState} from "react";
import {StyleSheet, Text, View} from "react-native";
import Svg, {Path} from "react-native-svg";

import {LinearGradient} from "expo-linear-gradient";
import MeshGrid from "../meshGrid";
import TallyScene from "./tallyScene";
import {useSafeAreaInsets} from "react-native-safe-area-context";

// Lines the user reads while the handshake runs. Deliberately about what the
// project is for rather than which step the request is on — the internals mean
// nothing to a voter, and naming steps would imply progress we cannot promise.
const STATUS_LINES = ["Counted by citizens", "Your ward, your tally", "Open count"];
const STATUS_HOLD_MS = 2000;
const STATUS_FADE_MS = 180;

const SWEEP_MS = 1700;
const SWEEP_EASING = Easing.bezier(0.66, 0, 0.34, 1);

/** The lime squiggle under the wordmark, as on the paper screens. */
function Squiggle() {
    return (
        <Svg width={82} height={7} viewBox="0 0 82 7">
            <Path
                d="M1 4.6C11 1.4 21 1.4 31 4.2 41 7 51 7 61 4.4 68 2.6 75 2.2 81 3.4"
                fill="none"
                stroke={LIME}
                strokeWidth={3}
                strokeLinecap="round"
            />
        </Svg>
    );
}

/** Indeterminate bar: a short segment sweeping the full track, forever. */
function ProgressSweep() {
    const [trackWidth, setTrackWidth] = useState(0);
    const shift = useSharedValue(0);

    useEffect(() => {
        if (trackWidth === 0) return;
        shift.value = 0;
        shift.value = withRepeat(
            withTiming(1, {duration: SWEEP_MS, easing: SWEEP_EASING}),
            -1,
            false,
        );
    }, [shift, trackWidth]);

    const barWidth = trackWidth * 0.36;
    const style = useAnimatedStyle(() => ({
        transform: [{translateX: -1.05 * barWidth + shift.value * 3.97 * barWidth}],
    }));

    return (
        <View
            style={styles.track}
            onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        >
            {trackWidth > 0 && (
                <Animated.View style={[styles.bar, {width: barWidth}, style]} />
            )}
        </View>
    );
}

/** Cycles the status line, cross-fading rather than cutting between them. */
function StatusCycler() {
    const [index, setIndex] = useState(0);
    const opacity = useSharedValue(1);

    useEffect(() => {
        const timer = setInterval(() => {
            opacity.value = withSequence(
                withTiming(0, {duration: STATUS_FADE_MS}),
                withTiming(1, {duration: STATUS_FADE_MS}),
            );
            setTimeout(
                () => setIndex((i) => (i + 1) % STATUS_LINES.length),
                STATUS_FADE_MS,
            );
        }, STATUS_HOLD_MS);

        return () => clearInterval(timer);
    }, [opacity]);

    const style = useAnimatedStyle(() => ({opacity: opacity.value}));

    return (
        <Animated.Text style={[styles.status, style]}>
            {STATUS_LINES[index]}
        </Animated.Text>
    );
}

/**
 * Shown for the whole of the sign-in handshake. A screen, not a sheet: there is
 * nothing behind it to go back to while the request is in flight.
 */
export default function LoginLoading() {
    const insets = useSafeAreaInsets();

    return (
        <LinearGradient
            colors={["#ffffff", PAPER, PAPER_DEEP]}
            locations={[0, 0.62, 1]}
            style={[
                styles.screen,
                {paddingTop: insets.top + 26, paddingBottom: insets.bottom + 22},
            ]}
        >
            <MeshGrid />

            <View style={styles.mark}>
                <Text style={styles.wordmark}>KuraZetu</Text>
                <Squiggle />
                <Text style={styles.tagline}>Citizen tally</Text>
            </View>

            <View style={styles.mid}>
                <TallyScene />
                <Text style={styles.count}>Counting you in</Text>
            </View>

            <View style={styles.bottom}>
                <StatusCycler />
                <ProgressSweep />
                <Text style={styles.note}>Not an IEBC system</Text>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        paddingHorizontal: 22,
        justifyContent: "space-between",
    },
    mark: {
        alignItems: "center",
        gap: 5,
    },
    wordmark: {
        fontSize: 15,
        fontWeight: "900",
        letterSpacing: -0.3,
        color: INK,
    },
    tagline: {
        fontSize: 9.5,
        fontWeight: "600",
        letterSpacing: 2.3,
        textTransform: "uppercase",
        color: MUTE,
    },
    mid: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
    },
    count: {
        marginTop: 18,
        fontSize: 10.5,
        fontWeight: "600",
        letterSpacing: 2.3,
        textTransform: "uppercase",
        textAlign: "center",
        color: MUTE,
    },
    bottom: {
        width: "100%",
        alignItems: "center",
        gap: 14,
    },
    status: {
        fontSize: 10.5,
        fontWeight: "600",
        letterSpacing: 1.05,
        textTransform: "uppercase",
        color: MUTE,
    },
    track: {
        width: "100%",
        height: 2,
        borderRadius: 2,
        backgroundColor: RULE_08,
        overflow: "hidden",
    },
    bar: {
        height: "100%",
        borderRadius: 2,
        backgroundColor: INK,
    },
    note: {
        fontSize: 10,
        fontWeight: "500",
        letterSpacing: 1.4,
        textTransform: "uppercase",
        textAlign: "center",
        color: MUTE,
    },
});
