import React from "react";
import {Pressable, Text} from "react-native";
import {ChevronLeft} from "lucide-react-native";
import {Stack, router, useLocalSearchParams} from "expo-router";

import {StationInfoProvider} from "@/hooks/useStationInfo";
import {perk} from "@/app/_utils/colors";

// This stack's first screen has nothing beneath it, so the navigation bar
// draws no back button of its own. The stream list sits one stack up.
const BackToStreams = () => (
    <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={{
            height: 36,
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
            paddingRight: 10,
        }}
        accessibilityRole="button"
    >
        <ChevronLeft size={24} color={perk.ink} strokeWidth={2.2} />
        <Text style={{fontSize: 16, fontWeight: "600", color: perk.ink}}>
            Back to streams
        </Text>
    </Pressable>
);

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
                        headerShadowVisible: false,
                        headerLeft: BackToStreams,
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
