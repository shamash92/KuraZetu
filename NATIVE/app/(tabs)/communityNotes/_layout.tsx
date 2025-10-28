import React from "react";
import {Stack} from "expo-router";

export default function CommunityNotesLayout() {
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
                    headerShown: false,
                    headerBackVisible: false,
                    headerTitle: "",
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    headerShown: false,
                    headerBackVisible: false,
                    headerTitle: "",
                }}
            />
            <Stack.Screen
                name="summaryView"
                options={{
                    headerShown: false,
                    headerBackVisible: false,
                    headerTitle: "",
                }}
            />
        </Stack>
    );
}
