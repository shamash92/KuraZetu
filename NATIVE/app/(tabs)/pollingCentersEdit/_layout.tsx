import React from "react";
import {Stack} from "expo-router";

export default function PollingCentersLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                headerBackVisible: false,
                headerTitle: "",
            }}
            initialRouteName="index"
        >
            <Stack.Screen
                name="LandingScreen"
                options={{
                    headerShown: false,
                    headerBackVisible: false,
                    headerTitle: "",
                }}
            />
            <Stack.Screen
                name="PollingCentersNearMe"
                options={{
                    headerShown: false,
                    headerBackVisible: false,
                    headerTitle: "",
                }}
            />
        </Stack>
    );
}
