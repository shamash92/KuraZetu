import "react-native-gesture-handler";
import "react-native-reanimated";

import * as Location from "expo-location";
import * as QuickActions from "expo-quick-actions";
import * as SplashScreen from "expo-splash-screen";

import {InteractionManager, Platform, useColorScheme} from "react-native";
import React, {useCallback, useEffect, useState} from "react";

import {GestureHandlerRootView} from "react-native-gesture-handler";
import LaunchContinuation from "@/components/splash/launchContinuation";
import {DarkTheme, DefaultTheme, Stack, ThemeProvider} from "expo-router";
import {useAuthStore} from "./_utils/authStore";
import {useFonts} from "expo-font";
import {useQuickActionRouting} from "expo-quick-actions/router";

// Cross-fade the splash out rather than cutting to the first screen.
SplashScreen.setOptions({duration: 320, fade: true});

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
    const [nativeSplashHidden, setNativeSplashHidden] = useState(false);
    const [continuationReady, setContinuationReady] = useState(false);
    const [continuationComplete, setContinuationComplete] = useState(false);

    const [fontsLoaded, fontError] = useFonts({
        "SpaceMono-Regular": require("../assets/fonts/SpaceMono-Regular.ttf"),
        "Inter-Black": require("../assets/fonts/Inter-Regular.ttf"),
        "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
        "Sora-Regular": require("../assets/fonts/Sora-Regular.ttf"),
        "PublicSans-ExtraBold": require("../assets/fonts/PublicSans-ExtraBold.ttf"),
    });

    useEffect(() => {
        if ((!fontsLoaded && !fontError) || !continuationReady) return;

        let mounted = true;
        const revealFrame = requestAnimationFrame(() => {
            void SplashScreen.hideAsync().then(() => {
                if (mounted) setNativeSplashHidden(true);
            });
        });

        return () => {
            mounted = false;
            cancelAnimationFrame(revealFrame);
        };
    }, [continuationReady, fontError, fontsLoaded]);

    const completeContinuation = useCallback(() => setContinuationComplete(true), []);
    const revealContinuation = useCallback(() => setContinuationReady(true), []);

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
            {continuationComplete ? (
                <RootLayoutNav />
            ) : (
                <LaunchContinuation
                    nativeSplashHidden={nativeSplashHidden}
                    onComplete={completeContinuation}
                    onReadyToReveal={revealContinuation}
                />
            )}
        </GestureHandlerRootView>
    );
}
