import {useEffect, useState} from "react";
import {
    Animated,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";

import {BarChart} from "react-native-gifted-charts";
import {ChevronDown} from "lucide-react-native";
import {perk} from "@/app/_utils/colors";

//TODO: Pull the data from the API
const presidentialData = [
    {name: "Candidate 1", party: "Party A", votes: 5400000, color: perk.limeDeep},
    {name: "Candidate 2", party: "Party B", votes: 4800000, color: perk.coralDeep},
    {name: "Candidate 3", party: "Party C", votes: 2100000, color: perk.copper},
];

const offices = [
    {
        key: "governor",
        tab: "Gov",
        title: "Governor results",
        geo: "Laikipia County",
        data: [
            {value: 35010, label: "W. Kiptanui", frontColor: perk.limeDeep},
            {value: 27140, label: "A. Cheserek", frontColor: perk.copper},
            {value: 17860, label: "J. Lelei", frontColor: perk.periwinkleDeep},
            {value: 11780, label: "M. Kones", frontColor: perk.ink},
            {value: 7490, label: "P. Tanui", frontColor: perk.green},
        ],
    },
    {
        key: "senator",
        tab: "Sen",
        title: "Senator results",
        geo: "Laikipia County",
        data: [
            {value: 30000, label: "Candidate 1", frontColor: perk.limeDeep},
            {value: 25000, label: "Candidate 2", frontColor: perk.copper},
            {value: 20000, label: "Candidate 3", frontColor: perk.periwinkleDeep},
        ],
    },

    {
        key: "womanRep",
        tab: "WR",
        title: "Woman Rep results",
        geo: "Laikipia County",
        data: [
            {value: 15000, label: "Candidate 1", frontColor: perk.limeDeep},
            {value: 12000, label: "Candidate 2", frontColor: perk.copper},
            {value: 8000, label: "Candidate 3", frontColor: perk.periwinkleDeep},
        ],
    },
    {
        key: "mp",
        tab: "MP",
        title: "MP results",
        geo: "Laikipia East",
        data: [
            {value: 10000, label: "Candidate 1", frontColor: perk.limeDeep},
            {value: 5000, label: "Candidate 2", frontColor: perk.copper},
            {value: 2500, label: "Candidate 3", frontColor: perk.periwinkleDeep},
        ],
    },
    {
        key: "mca",
        tab: "MCA",
        title: "MCA results",
        geo: "Nanyuki Ward",
        data: [
            {value: 10000, label: "Candidate 1", frontColor: perk.limeDeep},
            {value: 5000, label: "Candidate 2", frontColor: perk.copper},
            {value: 2500, label: "Candidate 3", frontColor: perk.periwinkleDeep},
        ],
    },
];

export default function ResultsLandingPage() {
    const {width: screenWidth} = useWindowDimensions();
    const [officeIndex, setOfficeIndex] = useState<number>(0);
    const [showHint, setShowHint] = useState(true);
    const [bob] = useState(() => new Animated.Value(0));

    const totalPresVotes = presidentialData.reduce((sum, c) => sum + c.votes, 0);
    const maxPresVotes = Math.max(...presidentialData.map((c) => c.votes));

    const activeOffice = offices[officeIndex];

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(bob, {
                    toValue: 1,
                    duration: 750,
                    useNativeDriver: true,
                }),
                Animated.timing(bob, {
                    toValue: 0,
                    duration: 750,
                    useNativeDriver: true,
                }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [bob]);

    const onPresScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const {contentOffset, contentSize, layoutMeasurement} = e.nativeEvent;
        const atBottom =
            contentOffset.y + layoutMeasurement.height >= contentSize.height - 8;
        setShowHint(!atBottom);
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Brand row */}
                <View style={styles.brandRow}>
                    <View>
                        <Text style={styles.brandName}>KuraZetu</Text>
                        <Text style={styles.brandTag}>2027 ELECTION COVERAGE</Text>
                    </View>
                    <View style={styles.updatedCol}>
                        <Text style={styles.updated}>2 MIN AGO</Text>
                        <View style={styles.coverage}>
                            <Text style={styles.coverageLabel}>87% IN</Text>
                            <View style={styles.coverageBar}>
                                <View style={[styles.coverageFill, {width: "87%"}]} />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Presidential results */}
                <Text style={styles.sectionLabel}>PRESIDENTIAL RESULTS</Text>
                <View style={styles.presScrollWrap}>
                    <ScrollView
                        style={styles.presScroll}
                        showsVerticalScrollIndicator={false}
                        onScroll={onPresScroll}
                        scrollEventThrottle={16}
                    >
                        {presidentialData.map((candidate) => {
                            const pct = (
                                (candidate.votes / totalPresVotes) *
                                100
                            ).toFixed(1);
                            const barPct = (candidate.votes / maxPresVotes) * 100;
                            return (
                                <View key={candidate.name} style={styles.presCard}>
                                    <Text style={styles.presPct}>{pct}%</Text>
                                    <Text style={styles.presName}>
                                        {candidate.name} · {candidate.party}
                                    </Text>
                                    <Text style={styles.presVotes}>
                                        {candidate.votes.toLocaleString()} VOTES
                                    </Text>
                                    <View style={styles.presBarTrack}>
                                        <View
                                            style={[
                                                styles.presBarFill,
                                                {
                                                    width: `${barPct}%`,
                                                    backgroundColor: candidate.color,
                                                },
                                            ]}
                                        />
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                    {showHint && (
                        <Animated.View
                            pointerEvents="none"
                            style={[
                                styles.scrollHint,
                                {
                                    transform: [
                                        {
                                            translateY: bob.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, 4],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        >
                            <ChevronDown size={14} color={perk.limeInk} />
                        </Animated.View>
                    )}
                </View>

                {/* Office tabs */}
                <View style={styles.officeTabs}>
                    {offices.map((office, idx) => {
                        const on = idx === officeIndex;
                        return (
                            <TouchableOpacity
                                key={office.key}
                                style={[styles.officeTab, on && styles.officeTabOn]}
                                onPress={() => setOfficeIndex(idx)}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.officeTabText,
                                        on && styles.officeTabTextOn,
                                    ]}
                                >
                                    {office.tab}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Chart */}
                <Text style={styles.chartTitle}>
                    {activeOffice.title}{" "}
                    <Text style={styles.chartGeo}>· {activeOffice.geo}</Text>
                </Text>
                <BarChart
                    data={activeOffice.data}
                    isAnimated
                    rotateLabel
                    animationDuration={500}
                    width={screenWidth - 40}
                    adjustToWidth
                    hideYAxisText
                    yAxisLabelWidth={0}
                    yAxisThickness={0}
                    hideRules
                    xAxisColor={perk.ink}
                    xAxisThickness={1.5}
                    barBorderTopLeftRadius={4}
                    barBorderTopRightRadius={4}
                    showValuesAsTopLabel
                    topLabelTextStyle={styles.chartTopLabel}
                    xAxisLabelTextStyle={styles.chartXLabel}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: perk.card,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    brandRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
    },
    brandName: {
        fontSize: 22,
        fontWeight: "900",
        letterSpacing: -0.4,
        color: perk.ink,
    },
    brandTag: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 9,
        fontWeight: "700",
        letterSpacing: 1.6,
        color: perk.copperDeep,
        marginTop: 2,
    },
    updatedCol: {
        alignItems: "flex-end",
        gap: 5,
    },
    updated: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 9,
        fontWeight: "700",
        letterSpacing: 0.6,
        color: perk.mute,
    },
    coverage: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    coverageLabel: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 9,
        fontWeight: "700",
        color: perk.greenDeep,
    },
    coverageBar: {
        width: 44,
        height: 4,
        borderRadius: 2,
        backgroundColor: perk.paperDeep,
        overflow: "hidden",
    },
    coverageFill: {
        height: "100%",
        borderRadius: 2,
        backgroundColor: perk.green,
    },
    sectionLabel: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1.8,
        color: perk.ink,
        marginTop: 18,
        marginBottom: 10,
    },
    presScrollWrap: {
        position: "relative",
        maxHeight: 220,
    },
    presScroll: {
        paddingRight: 28,
    },
    scrollHint: {
        position: "absolute",
        right: -8,
        bottom: 4,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: perk.lime,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: perk.ink,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.14,
        shadowRadius: 4,
        elevation: 3,
    },
    presCard: {
        backgroundColor: perk.surface,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 10,
    },
    presPct: {
        position: "absolute",
        top: 12,
        right: 14,
        fontSize: 17,
        fontWeight: "900",
        letterSpacing: -0.3,
        color: perk.ink,
    },
    presName: {
        fontSize: 14,
        fontWeight: "800",
        letterSpacing: -0.2,
        color: perk.ink,
        paddingRight: 50,
    },
    presVotes: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 11,
        color: perk.mute,
        marginTop: 2,
    },
    presBarTrack: {
        marginTop: 8,
        height: 6,
        borderRadius: 3,
        backgroundColor: perk.paperDeep,
        overflow: "hidden",
    },
    presBarFill: {
        height: "100%",
        borderRadius: 3,
    },
    officeTabs: {
        flexDirection: "row",
        backgroundColor: perk.surface,
        borderRadius: 10,
        overflow: "hidden",
        marginTop: 16,
        marginBottom: 16,
    },
    officeTab: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 9,
        borderBottomWidth: 3,
        borderBottomColor: "transparent",
    },
    officeTabOn: {
        backgroundColor: perk.card,
        borderBottomColor: perk.limeDeep,
    },
    officeTabText: {
        fontSize: 11,
        fontWeight: "700",
        color: perk.mute,
    },
    officeTabTextOn: {
        color: perk.ink,
    },
    chartTitle: {
        fontSize: 15,
        fontWeight: "800",
        letterSpacing: -0.2,
        color: perk.ink,
        marginBottom: 12,
    },
    chartGeo: {
        color: perk.copperDeep,
        fontWeight: "700",
    },
    chartTopLabel: {
        fontSize: 9,
        fontWeight: "900",
        color: perk.ink,
    },
    chartXLabel: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 8,
        color: perk.mute,
    },
});
