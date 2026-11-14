import React from "react";
import {StyleSheet, Text, TouchableOpacity, View} from "react-native";
import Animated, {useReducedMotion} from "react-native-reanimated";
import LottieView from "lottie-react-native";
import {perk} from "@/app/_utils/colors";
import {ProgressSweep} from "./authLoading";

// The finished atlas never sits dead still while the request is outstanding.
const ATLAS_DRIFT = {
    animationName: {
        from: {transform: [{scale: 1}]},
        to: {transform: [{scale: 1.06}]},
    },
    animationDuration: 9000,
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
    animationDirection: "alternate",
} as const;

export function SignupLocationLoading({error, onRetry}: {error: string | null; onRetry: () => void}) {
    const reduceMotion = useReducedMotion();

    return (
        <View
            style={styles.loading}
            accessible={error === null}
            accessibilityRole="progressbar"
            accessibilityLabel="Loading map data"
        >
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    !reduceMotion && ATLAS_DRIFT,
                    error !== null && styles.loadingArtDimmed,
                ]}
            >
                <LottieView
                    source={require("../../assets/lottie/boundariesLoading.json")}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                    autoPlay={!reduceMotion}
                    loop={false}
                    // Reduced motion rests on the finished atlas instead of drawing it.
                    progress={reduceMotion ? 1 : undefined}
                />
            </Animated.View>

            {error ? (
                <View style={styles.loadingFoot}>
                    <Text style={styles.loadingTitle}>Map data did not load</Text>
                    <Text style={styles.loadingText}>{error}</Text>
                    <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
                        <Text style={styles.retryText}>Try again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.loadingFoot}>
                    <Text style={styles.loadingLabel}>Loading map data</Text>
                    <ProgressSweep />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        backgroundColor: perk.paper,
        overflow: "hidden",
    },
    loadingArtDimmed: {opacity: 0.25},
    // The south-west corner of the atlas is open ground: Kenya's border runs
    // diagonally from Lake Victoria to the coast, so the readout sits there.
    loadingFoot: {
        position: "absolute",
        left: 24,
        right: 24,
        bottom: 56,
    },
    loadingLabel: {
        marginBottom: 14,
        fontFamily: "SpaceMono-Regular",
        fontSize: 11,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: perk.mute,
    },
    loadingTitle: {fontSize: 24, fontWeight: "800", color: perk.ink},
    loadingText: {
        marginTop: 8,
        fontSize: 15,
        lineHeight: 21,
        color: perk.mute,
    },
    retryButton: {
        alignSelf: "flex-start",
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: perk.lime,
    },
    retryText: {fontSize: 15, fontWeight: "800", color: perk.limeInk},
});
