import Animated, {
    Easing,
    SharedValue,
    interpolate,
    useAnimatedProps,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

import {Path} from "react-native-svg";
import {useEffect} from "react";

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Timings ported from claude-design/mobile-auth-perk.html (the .si-tally block).
// One cycle: strokes land one after another, the finished figure holds, the
// whole thing fades, then a beat of empty paper before it starts over.
export const STROKE_STAGGER_MS = 165;
export const STROKE_DRAW_MS = 210;
export const HOLD_MS = 820;
export const FADE_MS = 360;
export const GAP_MS = 400;

export function cycleDurationMs(strokeCount: number): number {
    const drawnAt = (strokeCount - 1) * STROKE_STAGGER_MS + STROKE_DRAW_MS;
    return drawnAt + HOLD_MS + FADE_MS + GAP_MS;
}

/**
 * A clock that runs 0 → 1 over one full draw/hold/fade/gap cycle and repeats.
 * Every stroke in a scene reads the same clock, so they cannot drift apart.
 */
export function useStrokeCycle(strokeCount: number): {
    clock: SharedValue<number>;
    durationMs: number;
} {
    const durationMs = cycleDurationMs(strokeCount);
    const clock = useSharedValue(0);

    useEffect(() => {
        clock.value = 0;
        clock.value = withRepeat(
            withTiming(1, {duration: durationMs, easing: Easing.linear}),
            -1,
            false,
        );
    }, [clock, durationMs]);

    return {clock, durationMs};
}

/**
 * Fades the finished figure out at the tail of the cycle, so the next pass
 * starts on empty paper instead of erasing itself stroke by stroke.
 */
export function useCycleFade(
    clock: SharedValue<number>,
    durationMs: number,
    strokeCount: number,
) {
    const fadeFrom = (cycleDurationMs(strokeCount) - FADE_MS - GAP_MS) / durationMs;
    const fadeTo = (cycleDurationMs(strokeCount) - GAP_MS) / durationMs;

    return useAnimatedStyle(() => ({
        opacity: interpolate(clock.value, [fadeFrom, fadeTo], [1, 0], "clamp"),
    }));
}

interface IDrawnPathProps {
    clock: SharedValue<number>;
    durationMs: number;
    /** Position in the draw order; sets when this stroke starts. */
    index: number;
    /** Length of the path in user units — drives the dash offset. */
    length: number;
    d: string;
    stroke: string;
    strokeWidth: number;
}

/** One stroke that draws itself on, holds, then fades with the rest. */
export default function DrawnPath({
    clock,
    durationMs,
    index,
    length,
    d,
    stroke,
    strokeWidth,
}: IDrawnPathProps) {
    const startsAt = (index * STROKE_STAGGER_MS) / durationMs;
    const drawnAt = (index * STROKE_STAGGER_MS + STROKE_DRAW_MS) / durationMs;

    const dashOffset = useDerivedValue(() =>
        interpolate(clock.value, [startsAt, drawnAt], [length, 0], "clamp"),
    );

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: dashOffset.value,
    }));

    return (
        <AnimatedPath
            d={d}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={length}
            animatedProps={animatedProps}
        />
    );
}
