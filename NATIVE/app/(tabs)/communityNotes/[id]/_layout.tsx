import React from "react";
import {Stack} from "expo-router";

export default function CommunityNotesDetailLayout() {
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
                name="index"
                options={{
                    headerShown: true,
                    headerBackVisible: true,
                    headerTitle: "Polling station results",
                }}
            />

            <Stack.Screen
                name="presResults"
                options={{
                    headerShown: true,
                    headerBackVisible: true,
                    headerTitle: "Results",
                }}
            />
        </Stack>
    );
}
