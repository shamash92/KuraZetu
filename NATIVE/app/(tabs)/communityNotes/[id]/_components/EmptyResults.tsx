import Animated, {
    Easing,
    interpolate,
    useAnimatedProps,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withDelay,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import {LayoutChangeEvent, Pressable, StyleSheet, Text, View} from "react-native";
import React, {useEffect, useState} from "react";
import Svg, {Path} from "react-native-svg";

import {Plus} from "lucide-react-native";
import {perk} from "@/app/_utils/colors";

const AnimatedPath = Animated.createAnimatedComponent(Path);

const GUTTER = 20;
const BUTTON_HEIGHT = 58;
// Clear air between the arrow and what it starts from and lands on.
const ARROW_GAP = 14;
const ARROW_START_X = GUTTER + 26;
const HEAD_LENGTH = 30;

const ARROW_DELAY_MS = 500;
const ARROW_DRAW_MS = 1800;
const PULSE_MS = 1800;

interface IPoint {
    x: number;
    y: number;
}

// The stroke leaves the copy heading down, swings across, and arrives at the
// button heading straight down, the way a hand would draw it.
function arrowCurve(from: IPoint, to: IPoint) {
    const drop = to.y - from.y;
    const c1 = {x: from.x, y: from.y + drop * 0.62};
    const c2 = {x: to.x, y: from.y + drop * 0.28};

    let length = 0;
    let previous = from;
    for (let step = 1; step <= 24; step += 1) {
        const t = step / 24;
        const u = 1 - t;
        const point = {
            x:
                u * u * u * from.x +
                3 * u * u * t * c1.x +
                3 * u * t * t * c2.x +
                t * t * t * to.x,
            y:
                u * u * u * from.y +
                3 * u * u * t * c1.y +
                3 * u * t * t * c2.y +
                t * t * t * to.y,
        };
        length += Math.hypot(point.x - previous.x, point.y - previous.y);
        previous = point;
    }

    return {
        d: `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`,
        length,
    };
}

interface IEmptyResultsProps {
    /** The race as it reads in a sentence, e.g. "MCA". */
    levelLabel: string;
    /** The form posted at the station for this race, e.g. "Form 36A". */
    formName: string;
    /** Distance from the bottom edge to the button, clearing the tab bar. */
    bottomOffset: number;
    onAdd: () => void;
}

/**
 * A station with no tally for this race. The one useful thing left to do here
 * is add it, so a drawn arrow carries the eye from the copy to the button.
 */
export function EmptyResults({
    levelLabel,
    formName,
    bottomOffset,
    onAdd,
}: IEmptyResultsProps) {
    const reducedMotion = useReducedMotion();

    const [area, setArea] = useState<{width: number; height: number} | null>(null);
    const [copyBottom, setCopyBottom] = useState<number | null>(null);
    const [buttonWidth, setButtonWidth] = useState<number | null>(null);

    const drawn = useSharedValue(0);
    const pulse = useSharedValue(0);

    const measured = area !== null && copyBottom !== null && buttonWidth !== null;

    useEffect(() => {
        if (!measured) return;

        if (reducedMotion) {
            drawn.value = 1;
            return;
        }

        drawn.value = withDelay(
            ARROW_DELAY_MS,
            withTiming(1, {
                duration: ARROW_DRAW_MS,
                easing: Easing.bezier(0.22, 0.61, 0.36, 1),
            }),
        );
        // The button starts answering once the arrow has reached it.
        pulse.value = withDelay(
            ARROW_DELAY_MS + ARROW_DRAW_MS,
            withRepeat(
                withTiming(1, {duration: PULSE_MS, easing: Easing.out(Easing.cubic)}),
                -1,
                false,
            ),
        );
    }, [measured, reducedMotion, drawn, pulse]);

    const from = {x: ARROW_START_X, y: (copyBottom ?? 0) + ARROW_GAP};
    const to = {
        x: (area?.width ?? 0) - GUTTER - (buttonWidth ?? 0) / 2,
        y: (area?.height ?? 0) - bottomOffset - BUTTON_HEIGHT - ARROW_GAP,
    };
    const curve = arrowCurve(from, to);
    // A little uneven, like the marker strokes elsewhere in the app.
    const head = `M ${to.x - 10} ${to.y - 10} L ${to.x} ${to.y} L ${to.x + 8} ${to.y - 12}`;

    const curveProps = useAnimatedProps(() => ({
        strokeDashoffset: interpolate(
            drawn.value,
            [0, 0.82],
            [curve.length, 0],
            "clamp",
        ),
    }));
    const headProps = useAnimatedProps(() => ({
        strokeDashoffset: interpolate(
            drawn.value,
            [0.82, 1],
            [HEAD_LENGTH, 0],
            "clamp",
        ),
    }));
    const pulseStyle = useAnimatedStyle(() => ({
        opacity: interpolate(pulse.value, [0, 1], [0.55, 0]),
        transform: [
            {scaleX: interpolate(pulse.value, [0, 1], [1, 1.16])},
            {scaleY: interpolate(pulse.value, [0, 1], [1, 1.5])},
        ],
    }));

    return (
        <View
            style={styles.area}
            onLayout={(event: LayoutChangeEvent) => {
                const {width, height} = event.nativeEvent.layout;
                setArea({width, height});
            }}
        >
            <View
                style={styles.copy}
                onLayout={(event: LayoutChangeEvent) => {
                    const {y, height} = event.nativeEvent.layout;
                    setCopyBottom(y + height);
                }}
            >
                <Text style={styles.title} accessibilityRole="header">
                    No {levelLabel} results yet
                </Text>
                <Text style={styles.body}>
                    Nobody has entered the figures for this stream. If you can see{" "}
                    {formName} posted at the station, add them.
                </Text>
            </View>

            {/* Only draw once both ends are known, and only if there is room
                for a stroke between them. */}
            {measured && to.y - from.y > 40 ? (
                <Svg
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                >
                    <AnimatedPath
                        d={curve.d}
                        fill="none"
                        stroke={perk.ink}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeDasharray={curve.length}
                        animatedProps={curveProps}
                    />
                    <AnimatedPath
                        d={head}
                        fill="none"
                        stroke={perk.ink}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={HEAD_LENGTH}
                        animatedProps={headProps}
                    />
                </Svg>
            ) : null}

            <View style={[styles.action, {bottom: bottomOffset}]}>
                <Animated.View
                    style={[styles.pulse, pulseStyle]}
                    pointerEvents="none"
                />
                <Pressable
                    // Feedback on touch-down; the form opens on release.
                    style={({pressed}) => [
                        styles.button,
                        pressed && styles.buttonPressed,
                    ]}
                    onPress={onAdd}
                    onLayout={(event: LayoutChangeEvent) => {
                        setButtonWidth(event.nativeEvent.layout.width);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${levelLabel} results`}
                >
                    <Plus size={22} color={perk.limeInk} strokeWidth={2.6} />
                    <Text style={styles.buttonLabel}>Add results</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    area: {
        flex: 1,
    },
    copy: {
        paddingHorizontal: GUTTER,
        paddingTop: 36,
    },
    title: {
        fontSize: 28,
        lineHeight: 32,
        fontWeight: "900",
        letterSpacing: -0.9,
        color: perk.ink,
    },
    body: {
        marginTop: 8,
        maxWidth: 320,
        fontSize: 16,
        lineHeight: 23,
        color: perk.mute,
    },
    action: {
        position: "absolute",
        right: GUTTER,
    },
    pulse: {
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        borderRadius: BUTTON_HEIGHT / 2,
        backgroundColor: perk.lime,
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        height: BUTTON_HEIGHT,
        borderRadius: BUTTON_HEIGHT / 2,
        paddingLeft: 20,
        paddingRight: 24,
        backgroundColor: perk.lime,
    },
    buttonPressed: {
        backgroundColor: perk.limeDeep,
        transform: [{scale: 0.97}],
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: "800",
        letterSpacing: -0.2,
        color: perk.limeInk,
    },
});
