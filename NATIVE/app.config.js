export default {
    expo: {
        name: "community-tally",
        slug: "community-tally",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "communitytally",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        splash: {
            image: "./assets/images/splash.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff",
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.communitytally.app",
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
            package: "com.communitytally.app",
            config: {
                googleMaps: {
                    apiKey: process.env.GOOGLE_MAPS_API_KEY,
                },
            },
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
                "expo-maps",
                {
                    requestLocationPermission: "true",
                    locationPermission: "Allow $(PRODUCT_NAME) to use your location",
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
                projectId: "120bc95a-c6a0-4385-a8a5-b8a3aa92fce1",
            },
        },
    },
};
