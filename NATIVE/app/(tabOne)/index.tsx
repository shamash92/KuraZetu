import Constants from "expo-constants";
import React from "react";
import ResultsLandingPage from "../results";
import {StatusBar} from "expo-status-bar";
import {View} from "react-native";
import {windowWidth} from "../(utils)/screenDimensions";

const LandingComponent = () => {
    return (
        <View
            style={{
                flex: 1,
                width: 1 * windowWidth,
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                // paddingTop: Constants.statusBarHeight,
            }}
        >
            <StatusBar backgroundColor={"transparent"} translucent />

            {/* content */}

            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingTop: Constants.statusBarHeight,
                    borderWidth: 4,
                }}
            >
                <View
                    style={{
                        flex: 8,
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        width: 1 * windowWidth,
                        // backgroundColor: "white",
                        backgroundColor: "rgba(0,0,0,0.3)",
                    }}
                >
                    <ResultsLandingPage />
                </View>
            </View>
        </View>
    );
};

export default LandingComponent;
