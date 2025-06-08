import React from "react";
import {Stack} from "expo-router";

export default function PollingCentersLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
            initialRouteName="LandingScreen"
        >
            <Stack.Screen
                name="LandingScreen"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="PollingCentersNearMe"
                options={{
                    headerShown: false,
                    // headerBackVisible: true,
                    // headerBackButtonDisplayMode: "minimal",

                    // headerBackTitle: "Back",
                    // headerTitle: "Polling centers near me",
                }}
            />
        </Stack>
    );
}
