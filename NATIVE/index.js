const SplashScreen = require("expo-splash-screen");

// This must run before Expo Router registers the root layout. Otherwise the
// native splash can auto-hide while the router bundle is still evaluating.
SplashScreen.preventAutoHideAsync();

require("expo-router/entry");
