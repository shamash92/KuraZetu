const { withProjectBuildGradle } = require("expo/config-plugins");

const MARKER = "// KURAZETU_REACT_NATIVE_SLIDER_FIX";
const PATCH = `
${MARKER}
// Slider 5.2.0 omits this source directory with the Gradle version used by
// React Native 0.86, leaving ReactSliderPackage out of the linked library.
subprojects { project ->
  if (project.name == "react-native-community_slider") {
    project.afterEvaluate {
      project.android.sourceSets.main.java.srcDir("src/main/java")
    }
  }
}
`;

module.exports = function withAndroidSliderFix(config) {
  return withProjectBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes(MARKER)) {
      config.modResults.contents = config.modResults.contents.replace(
        'apply plugin: "expo-root-project"',
        `${PATCH}\napply plugin: "expo-root-project"`,
      );
    }
    return config;
  });
};
