import {INK, LIME, MUTE, MUTE_2, PAPER, PAPER_DEEP, RED, RULE_08} from "@/app/_utils/colors";
import Animated, {
    Easing,
    SharedValue,
    interpolate,
    useAnimatedProps,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";
import Svg, {Path, Rect} from "react-native-svg";
import React, {useCallback, useEffect, useState} from "react";
import {Image, LayoutChangeEvent, StyleSheet, Text, useColorScheme, useWindowDimensions, View} from "react-native";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

const MARK_SIZE = 200;
const MARK_SCALE_AT_LOCKUP = 0.29;
const MARK_LOCKUP_SIZE = MARK_SIZE * MARK_SCALE_AT_LOCKUP;
const LOCKUP_BOTTOM = 96;
const MARK_TRAVEL_START_DELAY_MS = 0;
const MARK_TRAVEL_DURATION_MS = 820;
const CROWD_START_DELAY_MS = MARK_TRAVEL_START_DELAY_MS + MARK_TRAVEL_DURATION_MS + 120;
const STROKE_DRAW_DURATION_MS = 480;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);
const RULE_DRAW_DURATION_MS = 2000;
// The rule is the final moving element. Hold the completed composition long
// enough to register before the app takes over.
const ANIMATION_DURATION_MS = CROWD_START_DELAY_MS + RULE_DRAW_DURATION_MS;
const FINISHED_FRAME_HOLD_MS = 900;
const CONTINUATION_DURATION_MS = ANIMATION_DURATION_MS + FINISHED_FRAME_HOLD_MS;

type CrowdStroke = {
    delay: number;
    d: string;
    length: number;
    stroke: "front" | "ghost" | "mute";
    strokeWidth: number;
};

const circle = (x: number, y: number, radius: number) =>
    `M ${x + radius} ${y} A ${radius} ${radius} 0 1 0 ${x - radius} ${y} A ${radius} ${radius} 0 1 0 ${x + radius} ${y}`;

const roundedRect = (x: number, y: number, width: number, height: number, radius: number) =>
    `M ${x + radius} ${y} H ${x + width - radius} A ${radius} ${radius} 0 0 1 ${x + width} ${y + radius} V ${y + height - radius} A ${radius} ${radius} 0 0 1 ${x + width - radius} ${y + height} H ${x + radius} A ${radius} ${radius} 0 0 1 ${x} ${y + height - radius} V ${y + radius} A ${radius} ${radius} 0 0 1 ${x + radius} ${y}`;

// The crowd uses the connected torso-and-arm geometry from social-site.svg.
// Each raised phone is reached from the outside shoulder, so no arm crosses a
// face or appears to detach from the body as the paths draw on.
const CROWD_STROKES: readonly CrowdStroke[] = [
    {d: "M-6 283 C80 276 200 280 406 273", stroke: "ghost", strokeWidth: 1, length: 420, delay: 0},
    {d: circle(72, 180, 13), stroke: "ghost", strokeWidth: 1.1, length: 82, delay: 80},
    {d: "M54 283 C54 233 59 204 72 204 C85 204 90 233 90 283", stroke: "ghost", strokeWidth: 1.1, length: 135, delay: 120},
    {d: "M87 209 Q102 180 94 146", stroke: "ghost", strokeWidth: 1.1, length: 72, delay: 180},
    {d: roundedRect(87, 121, 15, 26, 3), stroke: "ghost", strokeWidth: 1.1, length: 82, delay: 220},
    {d: circle(326, 182, 13), stroke: "ghost", strokeWidth: 1.1, length: 82, delay: 260},
    {d: "M308 283 C308 233 313 206 326 206 C339 206 344 233 344 283", stroke: "ghost", strokeWidth: 1.1, length: 135, delay: 300},
    {d: "M341 211 Q356 182 348 148", stroke: "ghost", strokeWidth: 1.1, length: 72, delay: 340},
    {d: roundedRect(341, 123, 15, 26, 3), stroke: "ghost", strokeWidth: 1.1, length: 82, delay: 380},
    {d: circle(112, 160, 19), stroke: "front", strokeWidth: 1.6, length: 120, delay: 500},
    {d: "M76 283 C76 224 82 178 112 178 C142 178 148 224 148 283", stroke: "front", strokeWidth: 1.6, length: 170, delay: 560},
    {d: "M94 188 Q62 152 72 105", stroke: "front", strokeWidth: 1.6, length: 102, delay: 620},
    {d: roundedRect(59, 63, 26, 41, 5), stroke: "front", strokeWidth: 1.6, length: 126, delay: 680},
    {d: "M66 72 L78 72", stroke: "mute", strokeWidth: 1, length: 12, delay: 730},
    {d: circle(288, 162, 19), stroke: "front", strokeWidth: 1.6, length: 120, delay: 520},
    {d: "M252 283 C252 224 258 180 288 180 C318 180 324 224 324 283", stroke: "front", strokeWidth: 1.6, length: 170, delay: 580},
    {d: "M306 190 Q338 154 344 108", stroke: "front", strokeWidth: 1.6, length: 102, delay: 640},
    {d: roundedRect(331, 66, 26, 41, 5), stroke: "front", strokeWidth: 1.6, length: 126, delay: 700},
    {d: "M338 75 L350 75", stroke: "mute", strokeWidth: 1, length: 12, delay: 750},
    {d: circle(200, 142, 21), stroke: "front", strokeWidth: 1.6, length: 132, delay: 820},
    {d: "M161 283 C161 214 168 163 200 163 C232 163 239 214 239 283", stroke: "front", strokeWidth: 1.6, length: 190, delay: 880},
    {d: "M218 173 Q235 132 224 86", stroke: "front", strokeWidth: 1.6, length: 100, delay: 940},
    {d: "M176 57 L176 71 M169 64 L183 64", stroke: "mute", strokeWidth: 1, length: 28, delay: 1320},
    {d: "M118 113 L118 123 M113 118 L123 118", stroke: "mute", strokeWidth: 1, length: 20, delay: 1380},
];

function strokeColor(kind: CrowdStroke["stroke"], isDark: boolean): string {
    if (kind === "front") return isDark ? PAPER : INK;
    if (kind === "mute") return isDark ? PAPER_DEEP : MUTE;
    return isDark ? MUTE_2 : PAPER_DEEP;
}

function DrawnCrowdPath({clock, isDark, stroke}: {clock: SharedValue<number>; isDark: boolean; stroke: CrowdStroke}) {
    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: interpolate(
            clock.get(),
            [CROWD_START_DELAY_MS + stroke.delay, CROWD_START_DELAY_MS + stroke.delay + STROKE_DRAW_DURATION_MS],
            [stroke.length, 0],
            "clamp",
        ),
    }));

    return (
        <AnimatedPath
            d={stroke.d}
            fill="none"
            stroke={strokeColor(stroke.stroke, isDark)}
            strokeDasharray={stroke.length}
            strokeLinecap="round"
            strokeWidth={stroke.strokeWidth}
            animatedProps={animatedProps}
        />
    );
}

function DrawnPhone({clock, isDark}: {clock: SharedValue<number>; isDark: boolean}) {
    const length = 152;
    const drawStart = CROWD_START_DELAY_MS + 1170;
    const animatedProps = useAnimatedProps(() => ({
        fillOpacity: interpolate(clock.get(), [drawStart, drawStart + STROKE_DRAW_DURATION_MS], [0, 1], "clamp"),
        strokeDashoffset: interpolate(clock.get(), [drawStart, drawStart + STROKE_DRAW_DURATION_MS], [length, 0], "clamp"),
    }));

    return (
        <AnimatedRect
            x={196}
            y={30}
            width={30}
            height={46}
            rx={6}
            fill={LIME}
            stroke={isDark ? PAPER : INK}
            strokeDasharray={length}
            strokeLinecap="round"
            strokeWidth={1.5}
            animatedProps={animatedProps}
        />
    );
}

type LaunchContinuationProps = {
    nativeSplashHidden: boolean;
    onComplete: () => void;
    onReadyToReveal: () => void;
};

export default function LaunchContinuation({
    nativeSplashHidden,
    onComplete,
    onReadyToReveal,
}: LaunchContinuationProps) {
    const colorScheme = useColorScheme();
    const {height, width} = useWindowDimensions();
    const reduceMotion = useReducedMotion();
    const [markTarget, setMarkTarget] = useState<{x: number; y: number} | null>(null);
    const clock = useSharedValue(0);
    const markProgress = useSharedValue(0);
    const contentProgress = useSharedValue(0);
    const ruleProgress = useSharedValue(0);
    const isDark = colorScheme === "dark";
    const backgroundColor = isDark ? INK : PAPER;

    const onLockupLayout = useCallback(
        (event: LayoutChangeEvent) => {
            const {height: lockupHeight, width: lockupWidth, x} = event.nativeEvent.layout;
            const nextTarget = {
                x: x + (MARK_LOCKUP_SIZE / 2),
                y: height - LOCKUP_BOTTOM - (lockupHeight / 2),
            };

            setMarkTarget((currentTarget) => {
                if (
                    currentTarget &&
                    currentTarget.x === nextTarget.x &&
                    currentTarget.y === nextTarget.y &&
                    lockupWidth > 0
                ) {
                    return currentTarget;
                }

                return nextTarget;
            });

            if (lockupHeight > 0 && lockupWidth > 0) {
                onReadyToReveal();
            }
        },
        [height, onReadyToReveal],
    );

    useEffect(() => {
        if (!nativeSplashHidden || !markTarget) return;

        const completionTimer = setTimeout(onComplete, reduceMotion ? 900 : CONTINUATION_DURATION_MS);

        if (reduceMotion) {
            clock.set(ANIMATION_DURATION_MS);
            markProgress.set(1);
            contentProgress.set(1);
            ruleProgress.set(1);
        } else {
            clock.set(0);
            markProgress.set(
                withDelay(
                    MARK_TRAVEL_START_DELAY_MS,
                    withTiming(1, {duration: MARK_TRAVEL_DURATION_MS, easing: EASE_IN_OUT}),
                ),
            );
            contentProgress.set(withDelay(1450, withTiming(1, {duration: 500, easing: EASE_OUT})));
            ruleProgress.set(withDelay(CROWD_START_DELAY_MS, withTiming(1, {duration: RULE_DRAW_DURATION_MS, easing: Easing.linear})));
            clock.set(withTiming(ANIMATION_DURATION_MS, {duration: ANIMATION_DURATION_MS, easing: Easing.linear}));
        }

        return () => clearTimeout(completionTimer);
    }, [clock, contentProgress, markProgress, markTarget, nativeSplashHidden, onComplete, reduceMotion, ruleProgress]);

    const markStyle = useAnimatedStyle(() => {
        const progress = markProgress.get();
        const targetX = markTarget ? markTarget.x - width / 2 : 0;
        const targetY = markTarget ? markTarget.y - height / 2 : 0;

        return {
            transform: [
                {translateY: interpolate(progress, [0, 1], [0, targetY])},
                {translateX: interpolate(progress, [0, 1], [0, targetX])},
                {scale: interpolate(progress, [0, 1], [1, MARK_SCALE_AT_LOCKUP])},
            ],
        };
    });
    const contentStyle = useAnimatedStyle(() => ({
        opacity: contentProgress.get(),
        transform: [{translateY: interpolate(contentProgress.get(), [0, 1], [8, 0])}],
    }));
    const ruleStyle = useAnimatedStyle(() => ({opacity: interpolate(ruleProgress.get(), [0, 0.2], [0, 1], "clamp")}));
    const ruleFillStyle = useAnimatedStyle(() => ({
        transform: [{scaleX: ruleProgress.get()}],
    }));

    return (
        <View style={[styles.screen, {backgroundColor}]} accessibilityLabel="KuraZetu is loading">
            <View style={styles.crowd} pointerEvents="none">
                <Svg width="100%" height="100%" viewBox="0 0 406 300">
                    {CROWD_STROKES.map((stroke) => (
                        <DrawnCrowdPath key={stroke.d} clock={clock} isDark={isDark} stroke={stroke} />
                    ))}
                    <DrawnPhone clock={clock} isDark={isDark} />
                </Svg>
            </View>
            <Animated.View
                style={[styles.travelMark, {left: width / 2 - MARK_SIZE / 2, top: height / 2 - MARK_SIZE / 2}, markStyle]}
                pointerEvents="none"
            >
                <Image
                    source={isDark ? require("../../assets/images/splash-icon-dark.png") : require("../../assets/images/splash-icon.png")}
                    style={styles.mark}
                />
            </Animated.View>
            <Animated.View style={[styles.lockupArea, contentStyle]} pointerEvents="none">
                <View style={styles.wordmark} onLayout={onLockupLayout}>
                    <View style={styles.markSlot} />
                    <Text style={[styles.word, {color: isDark ? PAPER : INK}]}>KuraZetu</Text>
                    <Text style={styles.dot}>.</Text>
                </View>
            </Animated.View>
            <Animated.View style={[styles.tagline, contentStyle]} pointerEvents="none">
                <Text style={[styles.taglineText, {color: isDark ? PAPER_DEEP : MUTE}]}>Citizen tally · Not an IEBC system</Text>
            </Animated.View>
            <Animated.View style={[styles.rule, {backgroundColor: isDark ? MUTE_2 : RULE_08}, ruleStyle]} pointerEvents="none">
                <Animated.View style={[styles.ruleFill, {backgroundColor: isDark ? PAPER : INK}, ruleFillStyle]} />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        overflow: "hidden",
    },
    crowd: {
        position: "absolute",
        top: "21%",
        left: "-7%",
        width: "114%",
        aspectRatio: 406 / 300,
    },
    travelMark: {
        position: "absolute",
        width: MARK_SIZE,
        height: MARK_SIZE,
    },
    mark: {
        width: MARK_SIZE,
        height: MARK_SIZE,
    },
    lockupArea: {
        position: "absolute",
        right: 0,
        bottom: LOCKUP_BOTTOM,
        left: 0,
        alignItems: "center",
    },
    wordmark: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    markSlot: {
        width: MARK_LOCKUP_SIZE,
        height: MARK_LOCKUP_SIZE,
    },
    word: {
        fontFamily: "PublicSans-ExtraBold",
        fontSize: 30,
        letterSpacing: -1.05,
        lineHeight: 32,
    },
    dot: {
        color: RED,
        fontFamily: "PublicSans-ExtraBold",
        fontSize: 30,
        lineHeight: 32,
    },
    tagline: {
        position: "absolute",
        bottom: 82,
        right: 0,
        left: 0,
    },
    taglineText: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 8,
        fontWeight: "600",
        letterSpacing: 1.12,
        textAlign: "center",
        textTransform: "uppercase",
    },
    rule: {
        position: "absolute",
        right: 26,
        bottom: 34,
        left: 26,
        height: 2,
        borderRadius: 2,
        overflow: "hidden",
    },
    ruleFill: {
        width: "100%",
        height: "100%",
        borderRadius: 2,
        transformOrigin: "left center",
    },
});
