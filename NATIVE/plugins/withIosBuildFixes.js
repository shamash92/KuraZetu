const {withAppDelegate, withPodfile} = require("expo/config-plugins");

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

const SCENE_MARKER = "// KURAZETU_XCODE27_SCENE_DELEGATE";
const LEGACY_WINDOW_SETUP = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif`;
const SCENE_DELEGATE = `
${SCENE_MARKER}
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory else {
      return
    }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window
    factory.startReactNative(withModuleName: "main", in: window, launchOptions: nil)
  }
}
`;

module.exports = function withIosBuildFixes(config) {
    config = withAppDelegate(config, (config) => {
        const appDelegate = config.modResults.contents;
        if (appDelegate.includes(SCENE_MARKER)) {
            return config;
        }
        if (!appDelegate.includes(LEGACY_WINDOW_SETUP)) {
            throw new Error(
                "withIosBuildFixes: could not find the React Native window setup",
            );
        }
        config.modResults.contents = appDelegate
            .replace(LEGACY_WINDOW_SETUP, "")
            .replace("\nclass ReactNativeDelegate", `${SCENE_DELEGATE}\nclass ReactNativeDelegate`);
        return config;
    });

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
