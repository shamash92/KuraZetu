import "react-native-gesture-handler";
import "react-native-reanimated";

import * as QuickActions from "expo-quick-actions";
import * as SplashScreen from "expo-splash-screen";

import {Image, PermissionsAndroid, Platform, StyleSheet, Text, useColorScheme, View} from "react-native";
import React, {useEffect} from "react";
import {windowWidth} from "./_utils/screenDimensions";

import {GestureHandlerRootView} from "react-native-gesture-handler";
import LottieComponent from "@/components/lottieLoading";
import {DarkTheme, DefaultTheme, Stack, ThemeProvider} from "expo-router";
import {StatusBar} from "expo-status-bar";
import {useAuthStore} from "./_utils/authStore";
import {useFonts} from "expo-font";
import {useQuickActionRouting} from "expo-quick-actions/router";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
    const {isLoggedIn, shouldCreateAccount} = useAuthStore();
    const colorScheme = useColorScheme();

    return (
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
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
        </ThemeProvider>
    );
}

// Export the complete component with provider
export default function AuthenticatedLayout() {
    const [loading, setLoading] = React.useState(false);

    const [fontsLoaded, fontError] = useFonts({
        "SpaceMono-Regular": require("../assets/fonts/SpaceMono-Regular.ttf"),
        "Inter-Black": require("../assets/fonts/Inter-Regular.ttf"),
        "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
        "Sora-Regular": require("../assets/fonts/Sora-Regular.ttf"),
    });

    useEffect(() => {
        setLoading(true);

        setTimeout(() => {
            setLoading(false);
        }, 3000);
    }, []);
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

    if (loading) {
        return (
            <View style={styles.splash}>
                <View style={styles.splashAroma} pointerEvents="none">
                    <LottieComponent
                        name="wave"
                        backgroundColor="transparent"
                        width={1.45 * windowWidth}
                    />
                </View>

                <View style={styles.splashContent}>
                    <LottieComponent
                        name="tea"
                        backgroundColor="transparent"
                        width={0.36 * windowWidth}
                    />
                    <Text style={styles.splashCaption}>Things are boiling nicely …</Text>
                </View>

                <View style={styles.splashBrand}>
                    <Image
                        source={require("../assets/images/icon.png")}
                        style={styles.splashLogo}
                    />
                    <View>
                        <Text style={styles.splashBrandName}>KURAZETU</Text>
                        <Text style={styles.splashTagline}>TUZILINDE</Text>
                    </View>
                </View>
            </View>
        );
    }

    if (!fontsLoaded && !fontError) {
        return null;
    }
    return (
        <GestureHandlerRootView style={{flex: 1}}>
            <RootLayoutNav />
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    splash: {
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-end",
        overflow: "hidden",
        backgroundColor: "#ffffff",
        paddingHorizontal: 22,
        paddingBottom: 46,
    },
    splashAroma: {
        position: "absolute",
        top: -104,
        width: 1.45 * windowWidth,
        alignItems: "center",
        opacity: 0.98,
    },
    splashContent: {
        position: "absolute",
        top: "59%",
        width: "100%",
        alignItems: "center",
        transform: [{translateX: -0.05 * windowWidth}],
    },
    splashCaption: {
        marginTop: 0,
        fontSize: 15,
        fontWeight: "600",
        fontStyle: "italic",
        color: "#8a4a25",
        letterSpacing: 0.15,
    },
    splashBrand: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    splashLogo: {
        width: 54,
        height: 54,
        borderRadius: 15,
    },
    splashBrandName: {
        fontSize: 23,
        lineHeight: 25,
        fontWeight: "900",
        letterSpacing: 1.1,
        color: "#2532a8",
    },
    splashTagline: {
        marginTop: 3,
        fontFamily: "SpaceMono-Regular",
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 3.1,
        color: "#8a4a25",
    },
});
