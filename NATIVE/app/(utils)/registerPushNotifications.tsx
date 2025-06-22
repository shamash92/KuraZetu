import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import {Alert, Platform} from "react-native";
import React, {useEffect} from "react";
import {getFromSecureStore, saveToSecureStore} from "../(utils)/secureStore";

import Constants from "expo-constants";
import useAuthStore from "./authStore";

const RegisterPushNotifications = () => {
    const [expoTokenChecked, setExpoPushTokenChecked] = React.useState<boolean>(false);

    const {expoPushToken, setExpoPushToken} = useAuthStore();

    function handleRegistrationError(errorMessage: string) {
        Alert.alert(`registrationErrorLogin:", ${errorMessage}`);
        // throw new Error(errorMessage);
    }

    useEffect(() => {
        const checkLocalStorageForPushToken = async () => {
            const storedToken = await getFromSecureStore("expoPushToken");
            if (storedToken !== null) {
                setExpoPushToken(storedToken);
                setExpoPushTokenChecked(true);
                console.log("Stored token found:", storedToken);
            } else {
                console.log("No stored token found");
            }

            setExpoPushTokenChecked(true);
        };

        checkLocalStorageForPushToken();
    }, []);

    useEffect(() => {
        async function registerForPushNotificationsAsync() {
            if (Platform.OS === "android") {
                Notifications.setNotificationChannelAsync("default", {
                    name: "default",
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: "#FF231F7C",
                });
            }

            if (Device.isDevice) {
                const {status: existingStatus} =
                    await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;
                if (existingStatus !== "granted") {
                    const {status} = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }
                if (finalStatus !== "granted") {
                    handleRegistrationError(
                        "Permission not granted to get push token for push notification!",
                    );
                    return;
                }
                const projectId =
                    Constants?.expoConfig?.extra?.eas?.projectId ??
                    Constants?.easConfig?.projectId;

                // console.log(projectId, "project id step 1");
                if (!projectId) {
                    handleRegistrationError("Project ID not found");
                }

                try {
                    // console.log(projectId, "projectId");
                    const pushTokenString = (
                        await Notifications.getExpoPushTokenAsync({
                            projectId: projectId,
                        })
                    ).data;
                    console.log(pushTokenString, "pushTokenString");
                    return pushTokenString;
                } catch (e: unknown) {
                    console.log(e, "error in pushToken");
                    // handleRegistrationError(`${e}`);
                }
            } else {
                handleRegistrationError(
                    "Must use physical device for push notifications",
                );
                console.log("login.tsx: object");
            }
        }

        if (expoPushToken === null && expoTokenChecked) {
            registerForPushNotificationsAsync()
                .then((token) => {
                    console.log(token, "final notification token");

                    if (token !== null && token !== undefined) {
                        // await saveToSecureStore("expoPushToken", token);
                        setExpoPushToken(token);
                    }
                })
                .catch((error: any) => {
                    // setExpoPushToken(`${error}`)
                    console.log(error, "error in getting expoPushToken ");
                });
        }
    }, [expoPushToken, expoTokenChecked]);

    return null;
};

export default RegisterPushNotifications;
