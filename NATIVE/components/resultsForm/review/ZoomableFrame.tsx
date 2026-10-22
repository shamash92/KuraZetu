import type {ReactNode} from "react";
import {StyleSheet, View} from "react-native";
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import {scheduleOnRN} from "react-native-worklets";

const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;

/** Keeps a zoomed photo's edge from moving inside its frame. */
function bound(offset: number, size: number, scale: number) {
    "worklet";
    const limit = (size * (scale - 1)) / 2;
    return Math.min(limit, Math.max(-limit, offset));
}

interface ZoomableFrameProps {
    children: ReactNode;
    /** Matches the photo's corners so the zoomed photo clips cleanly. */
    borderRadius?: number;
    /** Called once, the first time the photo is zoomed past its fitted size. */
    onZoomIn?: () => void;
}

/**
 * Pinch, drag and double-tap zoom for a photo, clipped to the photo's own
 * bounds. Has its own gesture root because it renders inside a Modal.
 */
export function ZoomableFrame({
    children,
    borderRadius = 0,
    onZoomIn,
}: ZoomableFrameProps) {
    const width = useSharedValue(0);
    const height = useSharedValue(0);
    const scale = useSharedValue(1);
    const x = useSharedValue(0);
    const y = useSharedValue(0);
    const start = useSharedValue({scale: 1, x: 0, y: 0, focalX: 0, focalY: 0});
    const zoomedIn = useSharedValue(false);

    const noteZoomIn = () => {
        "worklet";
        if (zoomedIn.value || !onZoomIn) return;
        zoomedIn.value = true;
        scheduleOnRN(onZoomIn);
    };

    // Zooms around the fingers: the point under them stays under them.
    const pinch = Gesture.Pinch()
        .onStart((e) => {
            start.value = {
                scale: scale.value,
                x: x.value,
                y: y.value,
                focalX: e.focalX - width.value / 2,
                focalY: e.focalY - height.value / 2,
            };
        })
        .onUpdate((e) => {
            const s = Math.min(MAX_SCALE, Math.max(1, start.value.scale * e.scale));
            const ratio = s / start.value.scale;
            const focalX = e.focalX - width.value / 2;
            const focalY = e.focalY - height.value / 2;
            scale.value = s;
            if (s > 1) noteZoomIn();
            x.value = bound(
                focalX - (start.value.focalX - start.value.x) * ratio,
                width.value,
                s,
            );
            y.value = bound(
                focalY - (start.value.focalY - start.value.y) * ratio,
                height.value,
                s,
            );
        });

    const drag = Gesture.Pan()
        .maxPointers(1)
        .onStart(() => {
            start.value = {...start.value, x: x.value, y: y.value};
        })
        .onUpdate((e) => {
            x.value = bound(start.value.x + e.translationX, width.value, scale.value);
            y.value = bound(start.value.y + e.translationY, height.value, scale.value);
        });

    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd((e) => {
            if (scale.value > 1) {
                scale.value = withTiming(1);
                x.value = withTiming(0);
                y.value = withTiming(0);
                return;
            }
            const focalX = e.x - width.value / 2;
            const focalY = e.y - height.value / 2;
            noteZoomIn();
            scale.value = withTiming(DOUBLE_TAP_SCALE);
            x.value = withTiming(
                bound(focalX * (1 - DOUBLE_TAP_SCALE), width.value, DOUBLE_TAP_SCALE),
            );
            y.value = withTiming(
                bound(focalY * (1 - DOUBLE_TAP_SCALE), height.value, DOUBLE_TAP_SCALE),
            );
        });

    const zoomStyle = useAnimatedStyle(() => ({
        transform: [
            {translateX: x.value},
            {translateY: y.value},
            {scale: scale.value},
        ],
    }));

    return (
        <GestureHandlerRootView
            style={[styles.frame, {borderRadius}]}
            onLayout={(e) => {
                width.value = e.nativeEvent.layout.width;
                height.value = e.nativeEvent.layout.height;
            }}
        >
            <GestureDetector gesture={Gesture.Simultaneous(pinch, drag, doubleTap)}>
                {/* Untransformed, so touch points are in frame coordinates. */}
                <View collapsable={false}>
                    <Animated.View style={zoomStyle}>{children}</Animated.View>
                </View>
            </GestureDetector>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    frame: {
        flex: 0,
        overflow: "hidden",
    },
});
