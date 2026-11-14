import {ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions} from "react-native";
import {TriangleAlert} from "lucide-react-native";
import {useState} from "react";

import {ZoomableImage} from "@/app/(tabs)/communityNotes/[id]/_components/ZoomableImage";

import {StepBar} from "./StepBar";
import {perk} from "@/app/_utils/colors";

/**
 * The photo shows the first upload's sheet with figures that look written
 * over since. Show where, then let the person continue to a reviewed upload
 * or cancel.
 */
export function ChangedFormPane({
    photo,
    onContinue,
    onCancel,
}: {
    /** The photo with an arrow at each difference, and without. */
    photo: {marked: string; plain: string; token: string} | null;
    onContinue: () => void;
    onCancel: () => void;
}) {
    const [showArrows, setShowArrows] = useState(true);
    const {height} = useWindowDimensions();

    return (
        <View style={styles.body}>
            <View style={styles.bar}>
                <StepBar step={3} />
            </View>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.top}>
                {photo ? (
                    <View style={[styles.photo, {height: 0.5 * height}]}>
                        <ZoomableImage
                            // The person's own photo shows at once; the server
                            // draws the arrows, so that copy lies over it once
                            // it has loaded.
                            uri={photo.plain}
                            fullUri={showArrows ? photo.marked : undefined}
                            headers={{Authorization: `Bearer ${photo.token}`}}
                        />
                        <TouchableOpacity
                            style={styles.toggle}
                            onPress={() => setShowArrows((shown) => !shown)}
                            accessibilityRole="button"
                        >
                            <Text style={styles.toggleText}>
                                {showArrows ? "Hide arrows" : "Show arrows"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : null}
                <View style={styles.warning} accessibilityRole="alert">
                    <TriangleAlert size={22} color={perk.coralDeep} />
                    <View style={styles.warningBody}>
                        <Text style={styles.warningTitle} accessibilityRole="header">
                            Some figures look written over
                        </Text>
                        <Text style={styles.warningText}>
                            Compared with the first photo of this form, some figures look
                            changed. You can still send your results. A person will check
                            them before they count.
                        </Text>
                    </View>
                </View>
            </ScrollView>
            <View style={styles.panel}>
                <View style={styles.row}>
                    <TouchableOpacity
                        style={[styles.button, styles.half, styles.secondary]}
                        onPress={onCancel}
                        accessibilityRole="button"
                    >
                        <Text style={styles.secondaryText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.half, styles.continue]}
                        onPress={onContinue}
                        accessibilityRole="button"
                    >
                        <Text style={styles.continueText}>Continue</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    body: {flex: 1},
    bar: {
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 16,
    },
    scroll: {flex: 1},
    top: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        gap: 16,
    },
    photo: {
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: perk.ink,
    },
    toggle: {
        position: "absolute",
        right: 10,
        bottom: 10,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: perk.ink,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: "700",
        color: perk.paper,
    },
    warning: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        backgroundColor: perk.coral,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    warningBody: {
        flex: 1,
        gap: 6,
    },
    warningTitle: {
        fontSize: 20,
        lineHeight: 24,
        fontWeight: "900",
        letterSpacing: -0.3,
        color: perk.ink,
    },
    warningText: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: "600",
        color: perk.ink,
    },
    panel: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: perk.card,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: perk.rule16,
    },
    row: {
        flexDirection: "row",
        gap: 12,
    },
    half: {
        flex: 1,
        flexBasis: 0,
    },
    button: {
        flexDirection: "row",
        paddingVertical: 16,
        borderRadius: 999,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    secondary: {
        backgroundColor: perk.surface,
    },
    secondaryText: {
        color: perk.ink,
        fontSize: 15,
        fontWeight: "800",
    },
    continue: {
        backgroundColor: perk.lime,
    },
    continueText: {
        color: perk.limeInk,
        fontSize: 15,
        fontWeight: "800",
    },
});
