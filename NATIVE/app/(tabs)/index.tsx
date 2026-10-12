import React from "react";
import ResultsLandingPage from "@/app/results";
import {View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import UpdateCheckerModal from "@/components/updateModal";
import {perk} from "@/app/_utils/colors";
import {windowWidth} from "@/app/_utils/device/screenDimensions";

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
            <UpdateCheckerModal />

            <View style={{flex: 1, width: 1 * windowWidth}}>
                <ResultsLandingPage />
            </View>
        </SafeAreaView>
    );
};

export default LandingComponent;
