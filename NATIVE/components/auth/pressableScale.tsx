import React, {useState} from "react";
import {Pressable, PressableProps, StyleProp, ViewStyle} from "react-native";
import Animated, {cubicBezier} from "react-native-reanimated";

// Press feedback: 120ms and 3% is the ceiling for a control touched this often.
const PRESS_TRANSITION = {
    transitionProperty: "transform",
    transitionDuration: "120ms",
    transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
} as const;

export function PressableScale({
    style,
    containerStyle,
    children,
    ...props
}: Omit<PressableProps, "style" | "children"> & {
    style?: StyleProp<ViewStyle>;
    containerStyle?: StyleProp<ViewStyle>;
    children: React.ReactNode;
}) {
    const [pressed, setPressed] = useState(false);

    return (
        <Pressable
            {...props}
            style={containerStyle}
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            pressRetentionOffset={16}
        >
            <Animated.View
                style={[
                    style,
                    PRESS_TRANSITION,
                    {transform: [{scale: pressed ? 0.97 : 1}]},
                ]}
            >
                {children}
            </Animated.View>
        </Pressable>
    );
}
