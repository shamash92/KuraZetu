import React, {useEffect, useRef, useState} from "react";
import {StyleSheet, View} from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";
import {INK} from "@/app/_utils/colors";
import {LOGIN_SCREEN_GREETINGS as GREETINGS} from "@/app/_utils/auth/greetings";

const HEADING_LINE_HEIGHT = 42;
// Mask is taller than the text line so Gĩkũyũ/Kĩkamba diacritics (ĩ, ũ) and bold
// ascenders are not shaved by overflow:hidden. Slide distance = mask height.
const GREETING_MASK_HEIGHT = 54;
const SWAP_MS = 480;
const CHAR_STAGGER_MS = 22;
const HOLD_MS = 1800;
const LONGEST_GREETING = Math.max(...GREETINGS.map((g) => g.length));

// Offsets are in mask heights: 1 is parked below the clip, 0 is on screen, -1
// has left through the top.
type Slot = {text: string; offset: number; animated: boolean};

function GreetingChar({
    char,
    index,
    offset,
    animated,
}: {
    char: string;
    index: number;
    offset: number;
    animated: boolean;
}) {
    const y = useSharedValue(offset);

    useEffect(() => {
        y.value = animated
            ? withDelay(
                  index * CHAR_STAGGER_MS,
                  withTiming(offset, {
                      duration: SWAP_MS,
                      easing: Easing.out(Easing.cubic),
                  }),
              )
            : offset;
        // y is a stable shared value; listing it would make this a hook
        // argument, which the immutability rule forbids assigning to.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [offset, animated, index]);

    const style = useAnimatedStyle(() => ({
        transform: [{translateY: y.value * GREETING_MASK_HEIGHT}],
    }));

    return (
        <Animated.Text style={[styles.heading, styles.greetingChar, style]}>
            {char === " " ? " " : char}
        </Animated.Text>
    );
}

function GreetingRow({slot}: {slot: Slot}) {
    return (
        <View style={styles.greetingRow}>
            {Array.from(slot.text).map((char, i) => (
                <GreetingChar
                    key={i}
                    char={char}
                    index={i}
                    offset={slot.offset}
                    animated={slot.animated}
                />
            ))}
        </View>
    );
}

// Two rows leapfrog forever: both slide up one mask height, then whichever one
// has left the top is recycled to the bottom carrying the next greeting. The
// recycled row is outside the clip when its text and position change, so that
// jump can never be seen — which is the whole point, since a row that swapped
// text on screen would flash for a frame.
export function KineticGreeting() {
    const [cycle, setCycle] = useState(0);
    const nextGreeting = useRef(2 % GREETINGS.length);
    const [slots, setSlots] = useState<Array<Slot>>(() => [
        {text: GREETINGS[0], offset: 0, animated: false},
        {text: GREETINGS[1 % GREETINGS.length], offset: 1, animated: false},
    ]);

    useEffect(() => {
        const swapMs = SWAP_MS + LONGEST_GREETING * CHAR_STAGGER_MS;

        const slide = setTimeout(() => {
            setSlots((prev) =>
                prev.map((slot) => ({
                    ...slot,
                    offset: slot.offset - 1,
                    animated: true,
                })),
            );
        }, HOLD_MS);

        const recycle = setTimeout(() => {
            setSlots((prev) =>
                prev.map((slot) =>
                    slot.offset < 0
                        ? {
                              text: GREETINGS[nextGreeting.current],
                              offset: 1,
                              animated: false,
                          }
                        : slot,
                ),
            );
            nextGreeting.current = (nextGreeting.current + 1) % GREETINGS.length;
            setCycle((c) => c + 1);
        }, HOLD_MS + swapMs);

        return () => {
            clearTimeout(slide);
            clearTimeout(recycle);
        };
    }, [cycle]);

    return (
        <View style={styles.greetingMask}>
            {slots.map((slot, i) => (
                <GreetingRow key={i} slot={slot} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    heading: {
        fontSize: 34,
        fontWeight: "900",
        letterSpacing: -0.9,
        lineHeight: HEADING_LINE_HEIGHT,
        color: INK,
    },
    greetingMask: {
        height: GREETING_MASK_HEIGHT,
        overflow: "hidden",
    },
    greetingRow: {
        position: "absolute",
        left: 0,
        top: 0,
        flexDirection: "row",
    },
    greetingChar: {
        lineHeight: GREETING_MASK_HEIGHT,
        includeFontPadding: false,
        textAlignVertical: "bottom",
    },
});
