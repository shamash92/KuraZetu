import {Text, View} from "react-native";

import Constants from "expo-constants";
import React from "react";
import ResultsLandingPage from "@/app/results";
import {StatusBar} from "expo-status-bar";
import UpdateCheckerModal from "../(utils)/updateModal";
import {windowWidth} from "@/app/(utils)/screenDimensions";

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
            <StatusBar translucent />
            <UpdateCheckerModal />

            {/* content */}

            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingTop: Constants.statusBarHeight,
                    // borderWidth: 4,
                }}
            >
                <View
                    style={{
                        flex: 1,
                        flexDirection: "column",
                        alignItems: "flex-start",
                        // borderWidth: 4,
                        width: 1 * windowWidth,
                        paddingLeft: 12,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 32,
                            marginBottom: 4,
                            fontWeight: "bold",
                            fontFamily: "Inter",
                        }}
                    >
                        Kura Zetu
                    </Text>
                    <Text
                        style={{
                            fontSize: 16,
                        }}
                    >
                        2027 Election Coverage
                    </Text>
                </View>
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
