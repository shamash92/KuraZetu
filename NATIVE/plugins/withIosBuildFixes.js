const {withPodfile} = require("expo/config-plugins");

const DEPLOYMENT_TARGET = "15.1";
const MARKER = "# KURAZETU_XCODE27_FIXES";

// Injected at the top of the Podfile's post_install block.
//
// Xcode 27 rejects any target whose IPHONEOS_DEPLOYMENT_TARGET is below 15.0,
// but several Pods (mostly *Privacy resource bundles: lottie, SDWebImage,
// RNSVG filters, react-native-maps, ReachabilitySwift) still ship 9.0-13.4.
// Raising the Podfile platform alone does not fix these nested targets, so
// force every Pod build configuration to the app deployment target.
const PATCH = `
    ${MARKER}
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${DEPLOYMENT_TARGET}'
      end
    end
`;

module.exports = function withIosBuildFixes(config) {
    return withPodfile(config, (config) => {
        const podfile = config.modResults;
        if (podfile.contents.includes(MARKER)) {
            return config;
        }
        const anchor = "post_install do |installer|\n";
        if (!podfile.contents.includes(anchor)) {
            throw new Error(
                "withIosBuildFixes: could not find post_install block in Podfile",
            );
        }
        podfile.contents = podfile.contents.replace(anchor, anchor + PATCH);
        return config;
    });
};
