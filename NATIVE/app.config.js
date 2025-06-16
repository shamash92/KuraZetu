export default {
    expo: {
        name: "kurazetu",
        slug: "kurazetu",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "kurazetu",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        splash: {
            image: "./assets/images/splash.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff",
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.kurazetu.app",
            infoPlist: {
                ITSAppUsesNonExemptEncryption: false,
            },
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/images/adaptive-icon.png",
                backgroundColor: "#ffffff",
            },
            edgeToEdgeEnabled: true,
            package: "com.kurazetu.app",
            config: {
                googleMaps: {
                    apiKey: process.env.GOOGLE_MAPS_API_KEY,
                },
            },
            googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
        },
        web: {
            bundler: "metro",
            output: "static",
            favicon: "./assets/images/favicon.png",
        },
        plugins: [
            "expo-router",
            [
                "expo-splash-screen",
                {
                    image: "./assets/images/splash-icon.png",
                    imageWidth: 200,
                    resizeMode: "contain",
                    backgroundColor: "#ffffff",
                },
            ],
            [
                "expo-local-authentication",
                {
                    faceIDPermission: "Allow $(PRODUCT_NAME) to use Face ID.",
                },
            ],
            "expo-font",

            [
                "expo-location",
                {
                    locationAlwaysAndWhenInUsePermission:
                        "Allow $(PRODUCT_NAME) to use your location.",

                    locationAlwaysPermission:
                        "This app uses location to show your position on the map.",
                    locationWhenInUsePermission:
                        "This app uses location to show your position on the map.",
                },
            ],
            [
                "react-native-maps",
                {
                    androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
                },
            ],
            "expo-secure-store",
            [
                "expo-quick-actions",
                {
                    androidIcons: {
                        help_icon: {
                            foregroundImage: "./assets/images/adaptive-icon.png",
                            backgroundColor: "#29cfc1",
                        },
                    },
                },
            ],
        ],
        experiments: {
            typedRoutes: true,
        },
        extra: {
            router: {},
            eas: {
                projectId: "60061ad7-298f-4fde-aa66-bf58babca20e",
            },
        },
        updates: {
            url: "https://u.expo.dev/60061ad7-298f-4fde-aa66-bf58babca20e",
        },
        runtimeVersion: {
            policy: "appVersion",
        },
    },
};
