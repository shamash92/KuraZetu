import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import {InteractionManager, Platform} from "react-native";
import React, {useEffect} from "react";

import Constants from "expo-constants";
import {apiBaseURL} from "./apiBaseURL";
import useAuthStore from "./authStore";
import {handleUnauthorized} from "./handleUnauthorized";

function RegisterPushNotifications() {
    const {setExpoPushToken, userToken} = useAuthStore();

    useEffect(() => {
        async function registerForPushNotificationsAsync() {
            if (!userToken || !Device.isDevice) return;

            if (Platform.OS === "android") {
                await Notifications.setNotificationChannelAsync("default", {
                    name: "default",
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: "#FF231F7C",
                });
            }

            const {status: existingStatus} = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== "granted") {
                const {status} = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== "granted") return;

            const projectId =
                Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
            if (!projectId) return;

            const expoPushToken = (
                await Notifications.getExpoPushTokenAsync({projectId})
            ).data;
            setExpoPushToken(expoPushToken);

            const response = await fetch(`${apiBaseURL}/api/accounts/push-token/`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${userToken}`,
                },
                body: JSON.stringify({expo_push_token: expoPushToken}),
            });
            await handleUnauthorized(response);
        }

        // This layout mounts after the launch continuation and any future
        // onboarding route, so the OS prompt cannot interrupt either flow.
        const interaction = InteractionManager.runAfterInteractions(() => {
            void registerForPushNotificationsAsync();
        });

        return () => interaction.cancel();
    }, [setExpoPushToken, userToken]);

    return null;
}

export default RegisterPushNotifications;
