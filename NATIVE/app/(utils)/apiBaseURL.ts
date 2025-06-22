import {Platform} from "react-native";

const djangoPort = 8000; // Django default port

const getApiBaseURL = (): string => {
    // You can set these values as needed
    const ANDROID_SIMULATOR_BASE_URL = "http://10.0.2.2" + ":" + djangoPort; // Android emulator
    const IOS_SIMULATOR_BASE_URL = "http://127.0.0.1" + ":" + djangoPort; // iOS simulator

    const DEVELOPMENT_BASE_URL =
        process.env.EXPO_PUBLIC_DEVELOPMENT_IP_ADDRESS !== undefined
            ? "http://" +
              process.env.EXPO_PUBLIC_DEVELOPMENT_IP_ADDRESS +
              ":" +
              djangoPort
            : ANDROID_SIMULATOR_BASE_URL; // Fallback if env not set
    // Run on bash/cmd ipconfig getifaddr en0 for Macbook or ipconfig getifaddr wlan0 for Windows
    const PRODUCTION_BASE_URL =
        process.env.EXPO_PUBLIC_PRODUCTION_BASE_URL || "https://"; // Fallback if env not set

    console.log(ANDROID_SIMULATOR_BASE_URL, "android");
    console.log(IOS_SIMULATOR_BASE_URL, "ios");
    // console.log(DEVELOPMENT_BASE_URL, "development environment");
    // CHECK FOR DEVELOPMENT ENVIRONMENT

    if (typeof __DEV__ !== "undefined" && __DEV__) {
        // App is running in development mode

        if (typeof Platform !== "undefined" && Platform.OS === "ios") {
            return IOS_SIMULATOR_BASE_URL;
        }
        if (typeof Platform !== "undefined" && Platform.OS === "android") {
            return DEVELOPMENT_BASE_URL; // because it will default to ANDROID_SIMULATOR_BASE_URL is not in environment
        }
        return DEVELOPMENT_BASE_URL;
    }

    // Default to production
    return PRODUCTION_BASE_URL;
};

// export const apiBaseURL = getApiBaseURL();
export const apiBaseURL = "https://kurazetu.com"; // Use this for production

// export default getApiBaseURL;

export default getApiBaseURL;
