import {Dimensions, FlatList, StyleSheet, Text, View} from "react-native";
import React, {useState} from "react";
import {SceneMap, TabBar, TabView} from "react-native-tab-view";
import {windowHeight, windowWidth} from "../(utils)/screenDimensions";

import {BarChart} from "react-native-gifted-charts";

const screenWidth = Dimensions.get("window").width;

const initialLayout = {width: screenWidth};

//TODO: Pull the data from the API
const presidentialData = [
    {name: "Candidate 1", party: "Party A", votes: 5400000, color: "#2a9d8f"},
    {name: "Candidate 2", party: "Party B", votes: 4800000, color: "#e76f51"},
    {name: "Candidate 3", party: "Party C", votes: 3200000, color: "#f4a261"},
    {name: "Candidate 4", party: "Party D", votes: 1500000, color: "#264653"},
];

const GovernorData = [
    {value: 35000, label: "Candidate 1", frontColor: "#2a9d8f"},
    {value: 27000, label: "Candidate 2", frontColor: "#e76f51"},
    {value: 18000, label: "Candidate 3", frontColor: "#f4a261"},
    {value: 12000, label: "Candidate 4", frontColor: "#264653"},
    {value: 8000, label: "Candidate 5", frontColor: "#2a9d8f"},
];
const SenatorData = [
    {value: 30000, label: "Candidate 1", frontColor: "#2a9d8f"},
    {value: 25000, label: "Candidate 2", frontColor: "#e76f51"},
    {value: 20000, label: "Candidate 3", frontColor: "#f4a261"},
];

const MpData = [
    {value: 5000, label: "Candidate 1", frontColor: "#2a9d8f"},
    {value: 2500, label: "Candidate 2", frontColor: "#e76f51"},
    {value: 10000, label: "Candidate 3", frontColor: "#f4a261"},
];

const WomanRepData = [
    {value: 15000, label: "Candidate 1", frontColor: "#2a9d8f"},
    {value: 12000, label: "Candidate 2", frontColor: "#e76f51"},
    {value: 8000, label: "Candidate 3", frontColor: "#f4a261"},
];

const MCAData = [
    {value: 5000, label: "Candidate 1", frontColor: "#2a9d8f"},
    {value: 2500, label: "Candidate 2", frontColor: "#e76f51"},
    {value: 10000, label: "Candidate 3", frontColor: "#f4a261"},
];

const GovernorRoute = () => {
    return (
        <View
            style={{
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "center",
                backgroundColor: "#fefe",
            }}
        >
            <View style={{paddingVertical: 2}}>
                <Text
                    style={{
                        fontSize: 20,
                        marginVertical: 10,
                        // fontWeight: "600",
                    }}
                >
                    Governor Results
                </Text>
            </View>
            <BarChart
                data={GovernorData}
                isAnimated
                rotateLabel
                // horizontal
                animationDuration={500}
                yAxisLabelWidth={0.15 * windowWidth}
                width={0.7 * windowWidth}
                height={0.3 * windowHeight}
                // adjustToWidth
                xAxisLabelTextStyle={{
                    fontSize: 8,
                    color: "#264653",
                }}
            />
        </View>
    );
};

const SenatorRoute = () => {
    return (
        <View
            style={{
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "center",
                backgroundColor: "#fefe",
            }}
        >
            <View style={{paddingVertical: 10}}>
                <Text
                    style={{
                        fontSize: 28,
                        marginVertical: 10,
                        // fontWeight: "600",
                    }}
                >
                    Senator Results
                </Text>
            </View>
            <BarChart
                data={SenatorData}
                isAnimated
                rotateLabel
                // horizontal
                animationDuration={500}
                yAxisLabelWidth={0.15 * windowWidth}
                width={0.7 * windowWidth}
                height={0.3 * windowHeight}
                // adjustToWidth
                xAxisLabelTextStyle={{
                    fontSize: 12,
                    // fontWeight: "bold",
                    color: "#264653",
                }}
                xAxisLabelsAtBottom={false}
            />
        </View>
    );
};
const WomanRepRoute = () => {
    return (
        <View
            style={{
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "center",
                backgroundColor: "#fefe",
            }}
        >
            <View style={{paddingVertical: 10}}>
                <Text
                    style={{
                        fontSize: 28,
                        marginVertical: 10,
                        // fontWeight: "600",
                    }}
                >
                    Woman Rep Results
                </Text>
            </View>
            <BarChart
                data={WomanRepData}
                isAnimated
                rotateLabel
                // horizontal
                animationDuration={500}
                yAxisLabelWidth={0.15 * windowWidth}
                width={0.7 * windowWidth}
                height={0.3 * windowHeight}
                // adjustToWidth
                xAxisLabelTextStyle={{
                    fontSize: 12,
                    // fontWeight: "bold",
                    color: "#264653",
                }}
                xAxisLabelsAtBottom={false}
            />
        </View>
    );
};

const MpRoute = () => {
    return (
        <View
            style={{
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "center",
                backgroundColor: "#fefe",
            }}
        >
            <View style={{paddingVertical: 10}}>
                <Text
                    style={{
                        fontSize: 28,
                        marginVertical: 10,
                        // fontWeight: "600",
                    }}
                >
                    MP Results
                </Text>
            </View>
            <BarChart
                data={MpData}
                isAnimated
                rotateLabel
                // horizontal
                animationDuration={500}
                yAxisLabelWidth={0.15 * windowWidth}
                width={0.7 * windowWidth}
                height={0.3 * windowHeight}
                // adjustToWidth
                xAxisLabelTextStyle={{
                    fontSize: 12,
                    // fontWeight: "bold",
                    color: "#264653",
                }}
                xAxisLabelsAtBottom={false}
            />
        </View>
    );
};

const MCARoute = () => {
    return (
        <View
            style={{
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "center",
                backgroundColor: "#fefe",
            }}
        >
            <View style={{paddingVertical: 10}}>
                <Text
                    style={{
                        fontSize: 28,
                        marginVertical: 10,
                        // fontWeight: "600",
                    }}
                >
                    MCA Results
                </Text>
            </View>
            <BarChart
                data={MCAData}
                isAnimated
                rotateLabel
                // horizontal
                animationDuration={500}
                yAxisLabelWidth={0.15 * windowWidth}
                width={0.7 * windowWidth}
                height={0.3 * windowHeight}
                // adjustToWidth
                xAxisLabelTextStyle={{
                    fontSize: 12,
                    // fontWeight: "bold",
                    color: "#264653",
                }}
                xAxisLabelsAtBottom={false}
            />
        </View>
    );
};
export default function ResultsLandingPage() {
    const [index, setIndex] = useState<number>(0);
    const [routes] = useState([
        {key: "governor", title: "Governor"},
        {key: "senator", title: "Senator"},
        {key: "mp", title: "MP"},
        {key: "womanRep", title: "Woman Rep"},
        {key: "mca", title: "MCA"},
    ]);

    const renderScene = SceneMap({
        governor: GovernorRoute,
        senator: SenatorRoute,
        mp: MpRoute,
        womanRep: WomanRepRoute,
        mca: MCARoute,
    });

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.header}>Presidential (Dummy) Results</Text>
                <FlatList
                    data={presidentialData}
                    keyExtractor={(item) => item.name}
                    contentContainerStyle={styles.flatListContainer}
                    renderItem={({item}) => (
                        <View style={styles.resultBox}>
                            <Text style={{fontWeight: "bold"}}>
                                {item.name} ({item.party})
                            </Text>
                            <Text>{item.votes.toLocaleString()} votes</Text>
                            <View
                                style={[
                                    styles.bar,
                                    {
                                        backgroundColor: item.color,
                                        width: `${item.votes / 100000}%`,
                                    },
                                ]}
                            />
                        </View>
                    )}
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                />
            </View>

            <View style={styles.tabViewContainer}>
                <TabView
                    navigationState={{index, routes}}
                    renderScene={renderScene}
                    onIndexChange={setIndex}
                    initialLayout={initialLayout}
                    renderTabBar={(props) => (
                        <TabBar {...props} style={{backgroundColor: "#264653"}} />
                    )}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0f0f0",
    },
    headerContainer: {
        flex: 3,
    },
    header: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 10,
        color: "#264653",
    },
    flatListContainer: {
        padding: 10,
        borderRadius: 8,
    },
    resultBox: {
        backgroundColor: "#fff",
        marginHorizontal: 15,
        padding: 10,
        borderRadius: 8,
        elevation: 2,
        marginBottom: 10,
    },
    bar: {
        height: 10,
        marginTop: 5,
        borderRadius: 5,
    },
    tabViewContainer: {
        flex: 7,
    },
    chartContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
    },
    sectionTitle: {
        fontSize: 18,
        marginVertical: 10,
        fontWeight: "600",
    },
});
