import React from "react";
import {Stack} from "expo-router";

export default function ExamLayout() {
    return (
        <Stack
            initialRouteName="login"
            screenOptions={{
                headerShown: false,
                // headerStyle: {
                //     backgroundColor: orangeColor,
                // },
                // headerTintColor: "white",
                // headerTitleStyle: {
                //     fontWeight: "bold",
                // },
            }}
        >
            <Stack.Screen name="login" options={{headerShown: false}} />
            <Stack.Screen
                name="signUp"
                options={{
                    headerShown: false,
                    // headerBackTitle: "Login",
                    // headerTitle: "Create an Account",
                    // headerBackTitleVisible: true,
                }}
            />
            <Stack.Screen
                name="signUpForm"
                options={{
                    headerShown: false,
                    headerBackTitle: "Login",
                    headerTitle: "Create an Account",
                    // headerBackTitleVisible: true,
                    // headerStyle: {
                    //     backgroundColor: orangeColor,
                    // },
                }}
            />
            <Stack.Screen
                name="forgot-password"
                options={{
                    headerShown: false,
                    headerBackTitle: "Login",
                    headerTitle: "Forgot Password",
                }}
            />
        </Stack>
    );
}
