import "react-native-gesture-handler";
import "react-native-reanimated";

import * as QuickActions from "expo-quick-actions";
import * as SplashScreen from "expo-splash-screen";

import {PermissionsAndroid, Platform, Text} from "react-native";
import {Slot, router} from "expo-router";
import {TSaveSecureStore, getFromSecureStore} from "./(utils)/secureStore";
import {useEffect, useState} from "react";

import {GestureHandlerRootView} from "react-native-gesture-handler";
import {handleLogout} from "./(utils)/auth";
import {useFonts} from "expo-font";
import {useQuickActionRouting} from "expo-quick-actions/router";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    useEffect(() => {
        async function getValueFor(storeKey: TSaveSecureStore) {
            let result = await getFromSecureStore(storeKey);
            if (result !== null) {
                setIsLoggedIn(true);
                return true;
            } else {
                setIsLoggedIn(false);
                await handleLogout();
                return false;
            }
        }

        getValueFor("userToken").then((data) => {
            if (data === true) {
                router.replace("/(tabs)");
            } else {
                router.replace("/auth/login");
            }
        });
    }, []);

    return <Slot />;
}

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        "Inter-Black": require("../assets/fonts/Inter-Regular.ttf"),
    });

    // const app = initializeApp(firebaseConfig);

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

    return (
        <GestureHandlerRootView style={{flex: 1}}>
            <RootLayoutNav />
        </GestureHandlerRootView>
    );
}
