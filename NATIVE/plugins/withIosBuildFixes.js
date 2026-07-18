const {withPodfile} = require("expo/config-plugins");

const DEPLOYMENT_TARGET = "15.1";
const MARKER = "# KURAZETU_XCODE27_FIXES";

// Injected at the top of the Podfile's post_install block. Fixes two issues
// that break `expo run:ios` under Xcode 27:
//   1. Some Pods (including resource-bundle targets like *PrivacyInfo) ship
//      deployment targets below iOS 15.0, which Xcode 27 rejects. Raising the
//      Podfile platform alone does not fix these, so force every Pod target.
//   2. The fmt library bundled by react-native enables its consteval code path
//      under Xcode 27's clang, but that path fails to compile. Force it off by
//      patching the installed header (Pods/ is regenerated on every install).
const PATCH = `
    ${MARKER}
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${DEPLOYMENT_TARGET}'
      end
    end
    fmt_base = File.join(__dir__, 'Pods', 'fmt', 'include', 'fmt', 'base.h')
    if File.exist?(fmt_base)
      contents = File.read(fmt_base)
      patched = contents.gsub('#  define FMT_USE_CONSTEVAL 1', '#  define FMT_USE_CONSTEVAL 0')
      File.write(fmt_base, patched) if patched != contents
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
