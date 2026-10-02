import React from "react";
import {Stack, useLocalSearchParams} from "expo-router";

import {StationInfoProvider} from "@/hooks/useStationInfo";

export default function CommunityNotesDetailLayout() {
    const {id} = useLocalSearchParams<{id: string}>();

    return (
        <StationInfoProvider code={id}>
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
                    name="[level]"
                    options={{
                        headerShown: true,
                        headerBackVisible: true,
                        headerTitle: "Results",
                    }}
                />
            </Stack>
        </StationInfoProvider>
    );
}
