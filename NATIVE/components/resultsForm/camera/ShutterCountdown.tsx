import {useEffect} from "react";
import Animated, {
    Easing,
    ReduceMotion,
    cancelAnimation,
    useAnimatedProps,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import Svg, {Circle} from "react-native-svg";

import {CAPTURE_ANYWAY_MS} from "./captureGate";
import {perk} from "@/app/_utils/colors";

const SIZE = 80;
const STROKE_WIDTH = 2;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * The empty shutter circle, filling clockwise until Capture anyway is
 * offered. Null `anywayAtMs` shows the empty circle only.
 */
export function ShutterCountdown({anywayAtMs}: {anywayAtMs: number | null}) {
    const progress = useSharedValue(0);

    useEffect(() => {
        if (anywayAtMs === null) {
            progress.set(0);
            return;
        }

        // Start from the time already spent, so a ring that remounts (the
        // shutter was ready, then was not) continues instead of restarting.
        const remainingMs = Math.max(0, anywayAtMs - Date.now());
        progress.set(1 - remainingMs / CAPTURE_ANYWAY_MS);
        progress.set(
            withTiming(1, {
                duration: remainingMs,
                easing: Easing.linear,
                // A progress fill with no movement across the screen. Under
                // the system setting it would jump to full while the button
                // is still 15 seconds away.
                reduceMotion: ReduceMotion.Never,
            }),
        );
        return () => cancelAnimation(progress);
    }, [anywayAtMs, progress]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: CIRCUMFERENCE * (1 - progress.get()),
    }));

    return (
        <Svg
            width={SIZE}
            height={SIZE}
            style={{transform: [{rotate: "-90deg"}]}}
            importantForAccessibility="no"
        >
            <Circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                stroke="rgba(255,255,255,0.35)"
                strokeWidth={STROKE_WIDTH}
                fill="none"
            />
            <AnimatedCircle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                stroke={perk.lime}
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={CIRCUMFERENCE}
                fill="none"
                animatedProps={animatedProps}
            />
        </Svg>
    );
}
