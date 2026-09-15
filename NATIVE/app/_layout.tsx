import "react-native-gesture-handler";
import "react-native-reanimated";

import * as Location from "expo-location";
import * as QuickActions from "expo-quick-actions";
import * as SplashScreen from "expo-splash-screen";

import Animated, {
    Easing,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import {INK, MUTE, MUTE_2, PAPER, PAPER_DEEP, RED, RULE_08} from "@/app/_utils/colors";
import {
    Image,
    InteractionManager,
    Platform,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from "react-native";
import React, {useEffect, useRef, useState} from "react";

import {GestureHandlerRootView} from "react-native-gesture-handler";
import LottieView from "lottie-react-native";
import {DarkTheme, DefaultTheme, Stack, ThemeProvider} from "expo-router";
import {useAuthStore} from "./_utils/authStore";
import {useFonts} from "expo-font";
import {useQuickActionRouting} from "expo-quick-actions/router";

// Hold the native splash until the fonts are ready, so the launch screen never
// flashes unstyled text.
SplashScreen.preventAutoHideAsync();
// Cross-fade the splash out rather than cutting to the launch screen.
SplashScreen.setOptions({duration: 320, fade: true});

// The crowd Lottie is 113 frames at 60fps. Hold the finished frame long enough
// to register before the app takes over.
const CROWD_DURATION_MS = 1883;
const FINISHED_FRAME_HOLD_MS = 600;
const LAUNCH_DURATION_MS = CROWD_DURATION_MS + FINISHED_FRAME_HOLD_MS;
const MARK_LOCKUP_SIZE = 58;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

function LaunchScreen({onComplete}: {onComplete: () => void}) {
    const colorScheme = useColorScheme();
    const reduceMotion = useReducedMotion();
    const crowd = useRef<LottieView>(null);
    const lockupProgress = useSharedValue(0);
    const ruleProgress = useSharedValue(0);
    const isDark = colorScheme === "dark";

    useEffect(() => {
        const completionTimer = setTimeout(
            onComplete,
            reduceMotion ? 900 : LAUNCH_DURATION_MS,
        );

        if (reduceMotion) {
            lockupProgress.set(1);
            ruleProgress.set(1);
        } else {
            crowd.current?.play();
            lockupProgress.set(withTiming(1, {duration: 500, easing: EASE_OUT}));
            ruleProgress.set(
                withTiming(1, {duration: CROWD_DURATION_MS, easing: Easing.linear}),
            );
        }

        return () => clearTimeout(completionTimer);
    }, [lockupProgress, onComplete, reduceMotion, ruleProgress]);

    const lockupStyle = useAnimatedStyle(() => ({opacity: lockupProgress.get()}));
    const ruleFillStyle = useAnimatedStyle(() => ({
        transform: [{scaleX: ruleProgress.get()}],
    }));

    return (
        <View
            style={[styles.launch, {backgroundColor: isDark ? INK : PAPER}]}
            accessibilityLabel="KuraZetu is loading"
        >
            <LottieView
                ref={crowd}
                source={
                    isDark
                        ? require("../assets/lottie/launch-crowd-dark.json")
                        : require("../assets/lottie/launch-crowd-light.json")
                }
                autoPlay={false}
                loop={false}
                resizeMode="contain"
                style={styles.crowd}
            />
            <Animated.View
                style={[styles.lockupArea, lockupStyle]}
                pointerEvents="none"
            >
                <View style={styles.wordmark}>
                    <Image
                        source={
                            isDark
                                ? require("../assets/images/splash-icon-dark.png")
                                : require("../assets/images/splash-icon.png")
                        }
                        style={styles.mark}
                    />
                    <Text style={[styles.word, {color: isDark ? PAPER : INK}]}>
                        KuraZetu
                    </Text>
                    <Text style={styles.dot}>.</Text>
                </View>
                <Text style={[styles.taglineText, {color: isDark ? PAPER_DEEP : MUTE}]}>
                    Citizen tally · Not an IEBC system
                </Text>
            </Animated.View>
            <View
                style={[styles.rule, {backgroundColor: isDark ? MUTE_2 : RULE_08}]}
                pointerEvents="none"
            >
                <Animated.View
                    style={[
                        styles.ruleFill,
                        {backgroundColor: isDark ? PAPER : INK},
                        ruleFillStyle,
                    ]}
                />
            </View>
        </View>
    );
}

function AppLocationPermission() {
    useEffect(() => {
        if (Platform.OS === "web") return;

        const interaction = InteractionManager.runAfterInteractions(() => {
            void Location.requestForegroundPermissionsAsync();
        });

        return () => interaction.cancel();
    }, []);

    return null;
}

function RootLayoutNav() {
    const {isLoggedIn, shouldCreateAccount} = useAuthStore();
    const colorScheme = useColorScheme();

    return (
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <AppLocationPermission />
            <Stack>
                <Stack.Protected guard={!isLoggedIn}>
                    <Stack.Screen
                        name="auth"
                        options={{headerShown: false, animation: "fade_from_bottom"}}
                    />
                    <Stack.Protected guard={shouldCreateAccount}>
                        <Stack.Screen name="auth/signUp" />
                    </Stack.Protected>
                </Stack.Protected>
                <Stack.Protected guard={isLoggedIn}>
                    <Stack.Screen name="(tabs)" options={{headerShown: false}} />
                </Stack.Protected>
            </Stack>
        </ThemeProvider>
    );
}

// Export the complete component with provider
export default function AuthenticatedLayout() {
    const [launchComplete, setLaunchComplete] = useState(false);

    const [fontsLoaded, fontError] = useFonts({
        "SpaceMono-Regular": require("../assets/fonts/SpaceMono-Regular.ttf"),
        "Inter-Black": require("../assets/fonts/Inter-Regular.ttf"),
        "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
        "Sora-Regular": require("../assets/fonts/Sora-Regular.ttf"),
        "PublicSans-ExtraBold": require("../assets/fonts/PublicSans-ExtraBold.ttf"),
    });

    useEffect(() => {
        if (!fontsLoaded && !fontError) return;

        void SplashScreen.hideAsync();
    }, [fontError, fontsLoaded]);

    useQuickActionRouting();
    useEffect(() => {
        QuickActions.setItems([
            {
                title: "Are you sure?",
                subtitle: "Unataka hawa watu washinde?",
                icon:
                    Platform.OS === "ios"
                        ? "symbol:person.crop.circle.badge.questionmark"
                        : undefined,
                id: "0",
                params: {href: "/help"},
            },
        ]);
    }, []);

    if (!fontsLoaded && !fontError) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{flex: 1}}>
            {launchComplete ? (
                <RootLayoutNav />
            ) : (
                <LaunchScreen onComplete={() => setLaunchComplete(true)} />
            )}
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    launch: {
        flex: 1,
        overflow: "hidden",
    },
    crowd: {
        position: "absolute",
        // Anchored to the bottom, not a top percentage, so the gap above the
        // lockup stays constant from SE-class screens up to the tallest Pro.
        bottom: 190,
        left: "-7%",
        width: "114%",
        aspectRatio: 406 / 300,
    },
    lockupArea: {
        position: "absolute",
        right: 0,
        bottom: 82,
        left: 0,
        alignItems: "center",
        gap: 14,
    },
    wordmark: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    mark: {
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
