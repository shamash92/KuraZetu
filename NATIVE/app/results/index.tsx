import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";

import {perk} from "@/app/_utils/colors";
import {useState} from "react";

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

const PAGE_GUTTER = 20;
const BAR_AREA_HEIGHT = 190;
const BAR_GAP = 12;
// A race with more candidates than fit keeps this width and scrolls sideways;
// the bar cut off at the edge is what says there are more.
const BAR_MIN_WIDTH = 64;
const BAR_MAX_WIDTH = 96;

export default function ResultsLandingPage() {
    const {width: screenWidth} = useWindowDimensions();
    const [officeIndex, setOfficeIndex] = useState<number>(0);

    const totalPresVotes = presidentialData.reduce((sum, c) => sum + c.votes, 0);
    const maxPresVotes = Math.max(...presidentialData.map((c) => c.votes));

    const activeOffice = offices[officeIndex];
    const ranked = [...activeOffice.data].sort((a, b) => b.value - a.value);
    const maxOfficeVotes = ranked[0]?.value ?? 0;
    const chartWidth = screenWidth - PAGE_GUTTER * 2;
    const barWidth = Math.min(
        BAR_MAX_WIDTH,
        Math.max(
            BAR_MIN_WIDTH,
            (chartWidth - BAR_GAP * (ranked.length - 1)) / ranked.length,
        ),
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            // The office tabs stay in reach while a long race scrolls under them.
            stickyHeaderIndices={[1]}
            showsVerticalScrollIndicator={false}
        >
            <View>
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
                <View
                    style={styles.presList}
                    accessibilityLabel="Presidential results"
                >
                    {presidentialData.map((candidate) => {
                        const pct = ((candidate.votes / totalPresVotes) * 100).toFixed(1);
                        const barPct = (candidate.votes / maxPresVotes) * 100;
                        return (
                            <View key={candidate.name} style={styles.presCard}>
                                <Text style={styles.presPct}>{pct}%</Text>
                                <Text style={styles.presName} numberOfLines={2}>
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
                </View>
            </View>

            {/* Office tabs */}
            <View style={styles.officeTabsBar}>
                <View style={styles.officeTabs} accessibilityRole="tablist">
                    {offices.map((office, idx) => {
                        const on = idx === officeIndex;
                        return (
                            <TouchableOpacity
                                key={office.key}
                                style={[styles.officeTab, on && styles.officeTabOn]}
                                onPress={() => setOfficeIndex(idx)}
                                activeOpacity={0.8}
                                accessibilityRole="tab"
                                accessibilityState={{selected: on}}
                                accessibilityLabel={office.title}
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
            </View>

            {/* Office results */}
            <View>
                <Text style={styles.raceTitle}>
                    {activeOffice.title}{" "}
                    <Text style={styles.raceGeo}>· {activeOffice.geo}</Text>
                </Text>

                <ScrollView
                    // Remount per race so a new tab starts at its leader.
                    key={activeOffice.key}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.chartScroll}
                    contentContainerStyle={styles.chartContent}
                >
                    {ranked.map((candidate) => (
                        <View
                            key={candidate.label}
                            // The gap lives inside the column so the baseline
                            // under the bars runs unbroken.
                            style={{width: barWidth + BAR_GAP}}
                            accessible
                            accessibilityLabel={`${candidate.label}, ${candidate.value.toLocaleString()} votes`}
                        >
                            <View style={styles.barArea}>
                                <Text style={styles.barValue}>
                                    {candidate.value.toLocaleString()}
                                </Text>
                                <View
                                    style={[
                                        styles.bar,
                                        {
                                            height: Math.max(
                                                4,
                                                (candidate.value / maxOfficeVotes) *
                                                    BAR_AREA_HEIGHT,
                                            ),
                                            backgroundColor: candidate.frontColor,
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={styles.barName} numberOfLines={2}>
                                {candidate.label}
                            </Text>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: perk.card,
    },
    content: {
        paddingHorizontal: PAGE_GUTTER,
        paddingTop: 20,
        // Clears the floating tab bar.
        paddingBottom: 132,
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
    presList: {
        marginTop: 20,
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
        // Keeps a wrapped name clear of the percentage pinned top right.
        paddingRight: 72,
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
    // Opaque, so rows do not show through once the tabs stick.
    officeTabsBar: {
        backgroundColor: perk.card,
        paddingTop: 10,
        paddingBottom: 16,
    },
    officeTabs: {
        flexDirection: "row",
        backgroundColor: perk.surface,
        borderRadius: 10,
        overflow: "hidden",
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
    raceTitle: {
        fontSize: 15,
        fontWeight: "800",
        letterSpacing: -0.2,
        color: perk.ink,
        marginBottom: 4,
    },
    raceGeo: {
        color: perk.copperDeep,
        fontWeight: "700",
    },
    // Runs to the screen edge so a further candidate shows as a cut-off bar.
    chartScroll: {
        marginTop: 8,
        marginRight: -PAGE_GUTTER,
    },
    chartContent: {
        paddingRight: PAGE_GUTTER,
    },
    barArea: {
        height: BAR_AREA_HEIGHT + 22,
        justifyContent: "flex-end",
        borderBottomWidth: 1.5,
        borderBottomColor: perk.ink,
    },
    barValue: {
        marginBottom: 4,
        fontSize: 12,
        fontWeight: "800",
        color: perk.ink,
        fontVariant: ["tabular-nums"],
    },
    bar: {
        marginRight: BAR_GAP,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    barName: {
        marginTop: 8,
        paddingRight: BAR_GAP,
        fontSize: 13,
        fontWeight: "600",
        lineHeight: 17,
        color: perk.ink,
    },
});
