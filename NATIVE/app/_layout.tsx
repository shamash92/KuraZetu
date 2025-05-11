import "react-native-gesture-handler";
import "react-native-reanimated";

import * as QuickActions from "expo-quick-actions";
import * as SplashScreen from "expo-splash-screen";

import {Slot, router} from "expo-router";
import {
    TSaveSecureStore,
    deleteFromSecureStore,
    getFromSecureStore,
} from "./(utils)/secureStore";
import {useEffect, useState} from "react";

import {GestureHandlerRootView} from "react-native-gesture-handler";
import {Platform} from "react-native";
import {handleLogout} from "./(utils)/auth";
import {useFonts} from "expo-font";
import {useQuickActionRouting} from "expo-quick-actions/router";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        async function getValueFor(storeKey: TSaveSecureStore) {
            let result = await getFromSecureStore(storeKey);
            if (result !== null) {
                console.log("🔐 Here's your value 🔐 \n" + result);

                setIsLoggedIn(true);

                return true;
            } else {
                // alert("No values stored under that key.");
                console.log("No values stored under that key.");

                setIsLoggedIn(false);

                await handleLogout();

                return false;
            }
        }

        getValueFor("userToken").then(async (data) => {
            console.log(data, "what is this");

            if (data === true) {
                console.log("RootLayoutNav: what if we do nothing?");
                return router.replace("/(tabs)");
                // return router.replace("/auth/login");
            } else {
                return router.replace("/auth/login");
            }
        });
    }, [isLoggedIn]);

    return <Slot />;
}

export default function RootLayout() {
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
                subtitle: "Are you sure you want to logout?",
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
            <RootLayoutNav />
        </GestureHandlerRootView>
    );
}
