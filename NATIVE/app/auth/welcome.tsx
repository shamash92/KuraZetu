import {Pressable, StyleSheet, Text, View, useWindowDimensions} from "react-native";
import {Stack, router} from "expo-router";
import React, {useState} from "react";
import {useSafeAreaInsets} from "react-native-safe-area-context";

import {INK, LIME, LIME_INK, MUTE_2, PAPER, RED} from "@/app/_utils/colors";
import {Mark} from "@/components/brand/mark";

// The mark takes most of the width, capped so it stays a mark on tablets.
const MARK_WIDTH_RATIO = 0.62;
const MARK_MAX_WIDTH = 320;

export default function WelcomeScreen() {
    const insets = useSafeAreaInsets();
    const {width: windowWidth} = useWindowDimensions();
    const [isChoosing, setIsChoosing] = useState(false);
    const markWidth = Math.min(windowWidth * MARK_WIDTH_RATIO, MARK_MAX_WIDTH);

    return (
        <View
            style={[
                styles.screen,
                {
                    paddingTop: insets.top + 24,
                    paddingBottom: Math.max(insets.bottom, 16) + 8,
                },
            ]}
        >
            <Stack.Screen options={{statusBarStyle: "light"}} />

            <View style={styles.stage}>
                <Mark width={markWidth} />
                <Text style={styles.wordmark}>
                    Kura Zetu<Text style={styles.wordmarkDot}>.</Text>
                </Text>
            </View>

            <View style={styles.actions}>
                {isChoosing ? (
                    <>
                        <Pressable
                            style={({pressed}) => [styles.primary, pressed && styles.pressed]}
                            onPress={() => router.push("/auth/login")}
                            accessibilityRole="button"
                        >
                            <Text style={styles.primaryText}>Log in</Text>
                        </Pressable>
                        <Pressable
                            style={({pressed}) => [styles.secondary, pressed && styles.pressed]}
                            onPress={() => router.push("/auth/signUp")}
                            accessibilityRole="button"
                        >
                            <Text style={styles.secondaryText}>Sign up</Text>
                        </Pressable>
                    </>
                ) : (
                    <Pressable
                        style={({pressed}) => [styles.primary, pressed && styles.pressed]}
                        onPress={() => setIsChoosing(true)}
                        accessibilityRole="button"
                    >
                        <Text style={styles.primaryText}>Get started</Text>
                    </Pressable>
                )}
                <Text style={styles.disclaimer}>Citizen tally · Not an IEBC system</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: INK,
        paddingHorizontal: 24,
    },
    stage: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
    },
    wordmark: {
        fontFamily: "PublicSans-ExtraBold",
        fontSize: 40,
        letterSpacing: -1.4,
        color: PAPER,
    },
    wordmarkDot: {
        color: RED,
    },
    actions: {
        gap: 12,
    },
    primary: {
        height: 60,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: LIME,
        borderRadius: 999,
    },
    primaryText: {
        fontSize: 18,
        fontWeight: "800",
        color: LIME_INK,
    },
    secondary: {
        height: 60,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: PAPER,
    },
    secondaryText: {
        fontSize: 18,
        fontWeight: "800",
        color: PAPER,
    },
    pressed: {
        transform: [{scale: 0.97}],
    },
    disclaimer: {
        marginTop: 6,
        textAlign: "center",
        fontFamily: "SpaceMono-Regular",
        fontSize: 10.5,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        color: MUTE_2,
    },
});
