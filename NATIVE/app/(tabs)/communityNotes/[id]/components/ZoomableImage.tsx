import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import {Dimensions, Image, StyleSheet, Text, View} from "react-native";
import {Gesture, GestureDetector} from "react-native-gesture-handler";

import React from "react";
import { windowWidth } from "@/app/(utils)/screenDimensions";

const {width: screenWidth} = Dimensions.get("window");

interface ZoomableImageProps {
    uri: string | number; // Accept string (URL) or number (require)
}

export function ZoomableImage({uri}: ZoomableImageProps) {
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

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
            } else {
                savedScale.value = scale.value;
            }
        });

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            translateX.value = savedTranslateX.value + event.translationX;
            translateY.value = savedTranslateY.value + event.translationY;
        })
        .onEnd(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
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
                                ? { uri: uri }
                                : uri
                        }
                        style={{
                            width: windowWidth,
                            height: "100%", 
                            borderRadius: 12,
                            // backgroundColor: "#F8F8F8",
                        }}
                        resizeMode="cover"
                    />
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    imageContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
    },
});
