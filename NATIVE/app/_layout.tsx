import "react-native-gesture-handler";
import "react-native-reanimated";

import * as QuickActions from "expo-quick-actions";
import * as SplashScreen from "expo-splash-screen";

import {PermissionsAndroid, Platform} from "react-native";
import React, {useEffect} from "react";

import {Stack} from "expo-router";
import {StatusBar} from "expo-status-bar";
import UpdateCheckerModal from "./(utils)/updateModal";
import {useAuthStore} from "./(utils)/authStore";
import {useFonts} from "expo-font";
import {useQuickActionRouting} from "expo-quick-actions/router";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
    const {isLoggedIn, shouldCreateAccount} = useAuthStore();

    return (
        <React.Fragment>
            <StatusBar style="auto" />
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
        </React.Fragment>
    );
}

// Export the complete component with provider
export default function AuthenticatedLayout() {
    const [fontsLoaded, fontError] = useFonts({
        "Inter-Black": require("../assets/fonts/Inter-Regular.ttf"),
    });

    useEffect(() => {
        SplashScreen.preventAutoHideAsync();

        if (fontsLoaded || fontError) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    useEffect(() => {
        SplashScreen.preventAutoHideAsync();
    }, []);

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

    useEffect(() => {
        const run = async () => {
            if (Platform.OS === "android") {
                await PermissionsAndroid.requestMultiple([
                    "android.permission.POST_NOTIFICATIONS",
                    "android.permission.ACCESS_FINE_LOCATION",
                ]);
            }
        };

        run();
    }, []);

    if (!fontsLoaded && !fontError) {
        return null;
    }
    return <RootLayoutNav />;
}
