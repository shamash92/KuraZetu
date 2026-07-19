import React from "react";
import ResultsLandingPage from "@/app/results";
import {StatusBar} from "expo-status-bar";
import {View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import UpdateCheckerModal from "../_utils/updateModal";
import {perk} from "@/app/_utils/colors";
import {windowWidth} from "@/app/_utils/screenDimensions";

const LandingComponent = () => {
    return (
        <SafeAreaView
            style={{
                flex: 1,
                width: 1 * windowWidth,
                backgroundColor: perk.card,
            }}
            edges={["top"]}
        >
            <StatusBar style="dark" />
            <UpdateCheckerModal />

            <View style={{flex: 1, width: 1 * windowWidth}}>
                <ResultsLandingPage />
            </View>
        </SafeAreaView>
    );
};

export default LandingComponent;
