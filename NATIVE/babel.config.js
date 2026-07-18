module.exports = (api) => {
    api.cache(true);
    return {
        presets: ["babel-preset-expo"],
        plugins: [
            // Reanimated 4 moved its Babel plugin to react-native-worklets.
            // NOTE: this must be listed last.
            "react-native-worklets/plugin",
        ],
    };
};
