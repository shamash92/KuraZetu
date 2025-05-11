module.exports = (api) => {
    api.cache(true);
    return {
        presets: ["babel-preset-expo"],
        plugins: [
            // Required for expo-router

            //NOTE: react-native-reanimated/plugin has to be listed last.
            "react-native-reanimated/plugin",
        ],
    };
};
