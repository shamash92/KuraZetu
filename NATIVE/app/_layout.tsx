import "react-native-gesture-handler";
import "react-native-reanimated";

import * as QuickActions from "expo-quick-actions";
import * as SplashScreen from "expo-splash-screen";

import {Image, PermissionsAndroid, Platform, Text, View} from "react-native";
import React, {useEffect} from "react";
import {windowHeight, windowWidth} from "./(utils)/screenDimensions";

import Animated from "react-native-reanimated";
import LottieComponent from "@/components/lottieLoading";
import {Stack} from "expo-router";
import {StatusBar} from "expo-status-bar";
import UpdateCheckerModal from "./(utils)/updateModal";
import {blueColor} from "./(utils)/colors";
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
    const [loading, setLoading] = React.useState(false);

    const [fontsLoaded, fontError] = useFonts({
        "Inter-Black": require("../assets/fonts/Inter-Regular.ttf"),
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
            <View
                style={{
                    flex: 1,
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    backgroundColor: "#fefefe",
                }}
            >
                <View
                    style={{
                        flex: 7,
                    }}
                >
                    <LottieComponent
                        name="wave"
                        backgroundColor={"transparent"}
                        width={0.6 * windowWidth}
                    />
                    <LottieComponent
                        name="tea"
                        backgroundColor={"transparent"}
                        width={0.3 * windowWidth}
                    />

                    <Animated.Text
                        style={{
                            textAlign: "center",
                            marginTop: 40,
                            opacity: 0.9,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 16,
                                color: blueColor,
                                marginTop: 20,
                            }}
                        >
                            Things are boiling nicely
                        </Text>
                    </Animated.Text>
                </View>

                <View
                    style={{
                        flex: 3,
                    }}
                >
                    <Image
                        source={require("../assets/images/icon.png")}
                        style={{
                            width: 0.75 * windowWidth,
                            height: 0.25 * windowHeight,
                            marginTop: 20,
                        }}
                    />
                </View>
            </View>
        );
    }

    if (!fontsLoaded && !fontError) {
        return null;
    }
    return <RootLayoutNav />;
}
