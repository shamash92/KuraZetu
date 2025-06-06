import Constants from "expo-constants";
import {Dimensions} from "react-native";

export const windowWidth = Dimensions.get("window").width;
export const windowHeight = Dimensions.get("window").height;
export const statusBarHeight = Constants.statusBarHeight;

const ScreenDimensions = () => null;

export default ScreenDimensions;
