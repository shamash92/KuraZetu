import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import {Dimensions, Image, StyleSheet, Text, View} from "react-native";
import {Gesture, GestureDetector} from "react-native-gesture-handler";

import React, {useState} from "react";

const {width: screenWidth} = Dimensions.get("window");

// A drag past the photo's edge moves at this fraction of the finger, then
// springs back on release.
const OVERDRAG = 0.3;
const SPRING_BACK = {damping: 20, stiffness: 220};

// How far the photo may move from centre before its edge leaves the frame.
function limit(size: number, scale: number) {
    "worklet";
    return Math.max(0, (size * (scale - 1)) / 2);
}

function resist(value: number, bound: number) {
    "worklet";
    if (value > bound) return bound + (value - bound) * OVERDRAG;
    if (value < -bound) return -bound + (value + bound) * OVERDRAG;
    return value;
}

function clamp(value: number, bound: number) {
    "worklet";
    return Math.min(bound, Math.max(-bound, value));
}

interface ZoomableImageProps {
    uri: string | number; // Accept string (URL) or number (require)
    // Sent with a URL, e.g. the sign-in token for a private photo.
    headers?: Record<string, string>;
    onLoad?: () => void;
    onError?: () => void;
    // A larger version of the same photo, shown over `uri` once it has loaded.
    fullUri?: string;
    onFullLoad?: () => void;
    onFullError?: () => void;
    // Inside a sideways pager: a one-finger drag moves the photo only once
    // it is zoomed in, so the pager can swipe.
    swipeable?: boolean;
}

export function ZoomableImage({
    uri,
    headers,
    onLoad,
    onError,
    fullUri,
    onFullLoad,
    onFullError,
    swipeable = false,
}: ZoomableImageProps) {
    const [fullShown, setFullShown] = useState(false);
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);
    const frameWidth = useSharedValue(0);
    const frameHeight = useSharedValue(0);

    // Pull the photo back inside the frame for the given zoom.
    const settle = (zoom: number) => {
        "worklet";
        const x = clamp(translateX.value, limit(frameWidth.value, zoom));
        const y = clamp(translateY.value, limit(frameHeight.value, zoom));
        translateX.value = withSpring(x, SPRING_BACK);
        translateY.value = withSpring(y, SPRING_BACK);
        savedTranslateX.value = x;
        savedTranslateY.value = y;
    };

    console.log(uri, "uri in ZoomableImage");

    const pinchGesture = Gesture.Pinch()
        .onUpdate((event) => {
            scale.value = savedScale.value * event.scale;
        })
        .onEnd(() => {
            if (scale.value < 1) {
                scale.value = withTiming(1);
                translateX.value = withTiming(0);
                translateY.value = withTiming(0);
                savedScale.value = 1;
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
            } else if (scale.value > 3) {
                scale.value = withTiming(3);
                savedScale.value = 3;
                settle(3);
            } else {
                savedScale.value = scale.value;
                settle(scale.value);
            }
        });

    const panGesture = Gesture.Pan()
        .manualActivation(swipeable)
        .onTouchesMove((_event, manager) => {
            if (!swipeable) return;
            if (savedScale.value > 1) manager.activate();
            else manager.fail();
        })
        .onUpdate((event) => {
            translateX.value = resist(
                savedTranslateX.value + event.translationX,
                limit(frameWidth.value, scale.value),
            );
            translateY.value = resist(
                savedTranslateY.value + event.translationY,
                limit(frameHeight.value, scale.value),
            );
        })
        .onEnd(() => {
            settle(savedScale.value);
        });

    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onStart(() => {
            if (scale.value === 1) {
                scale.value = withTiming(2);
                savedScale.value = 2;
            } else {
                scale.value = withTiming(1);
                translateX.value = withTiming(0);
                translateY.value = withTiming(0);
                savedScale.value = 1;
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
            }
        });

    const composed = Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {translateX: translateX.value},
                {translateY: translateY.value},
                {scale: scale.value},
            ],
        };
    });

    return (
        <View
            onLayout={(event) => {
                frameWidth.value = event.nativeEvent.layout.width;
                frameHeight.value = event.nativeEvent.layout.height;
            }}
            style={{
                height: "100%",
                // backgroundColor: '#F8F8F8',
                borderRadius: 8,
                overflow: "hidden",
            }}
        >
            <GestureDetector gesture={composed}>
                <Animated.View style={[styles.imageContainer, animatedStyle]}>
                    <Image
                        source={
                            typeof uri === "string"
                                ? { uri: uri, headers }
                                : uri
                        }
                        style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: 12,
                            // backgroundColor: "#F8F8F8",
                        }}
                        // The whole form shows; zoom in for detail.
                        resizeMode="contain"
                        onLoad={onLoad}
                        onError={onError}
                    />
                    {fullUri && fullUri !== uri ? (
                        <Image
                            source={{uri: fullUri, headers}}
                            style={{
                                position: "absolute",
                                width: "100%",
                                height: "100%",
                                borderRadius: 12,
                                opacity: fullShown ? 1 : 0,
                            }}
                            resizeMode="contain"
                            onLoad={() => {
                                setFullShown(true);
                                onFullLoad?.();
                            }}
                            onError={onFullError}
                        />
                    ) : null}
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

export default ZoomableImage;

const styles = StyleSheet.create({
    imageContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
    },
});
