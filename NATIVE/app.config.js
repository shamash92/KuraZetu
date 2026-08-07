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
                // react-native-vision-camera ships no config plugin, so its
                // permission strings are declared here rather than generated.
                NSCameraUsageDescription:
                    "Allow $(PRODUCT_NAME) to access your camera to capture Form 34A",
                UIStatusBarStyle: "UIStatusBarStyleDarkContent",
                UIViewControllerBasedStatusBarAppearance: true,
                UIApplicationSceneManifest: {
                    UIApplicationSupportsMultipleScenes: false,
                    UISceneConfigurations: {
                        UIWindowSceneSessionRoleApplication: [
                            {
                                UISceneConfigurationName: "Default Configuration",
                                UISceneDelegateClassName:
                                    "$(PRODUCT_MODULE_NAME).SceneDelegate",
                            },
                        ],
                    },
                },
            },
            entitlements: {
                "com.apple.developer.networking.wifi-info": true,
            },
        },
        android: {
            // VisionCamera declares camera hardware support but deliberately
            // leaves the runtime permission to the host application.
            permissions: ["android.permission.CAMERA"],
            adaptiveIcon: {
                foregroundImage: "./assets/images/adaptive-icon.png",
                backgroundColor: "#ffffff",
            },
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
            "expo-image",
            "expo-web-browser",
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
            [
                "expo-status-bar",
                {
                    hidden: false,
                    style: "dark",
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
            "./plugins/withIosBuildFixes",
            "./plugins/withAndroidSliderFix",
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
