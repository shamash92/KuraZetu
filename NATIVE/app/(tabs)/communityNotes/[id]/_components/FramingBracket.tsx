import {StyleSheet, View} from "react-native";

import {perk} from "@/app/_utils/colors";

export type BracketState = "bad" | "ok" | "steady";

const STATE_COLOR: Record<BracketState, string> = {
    bad: perk.coralDeep,
    ok: perk.copperDeep,
    steady: perk.lime,
};

/**
 * Corner brackets showing how large the form should appear.
 *
 * This is a *fill target*, not a crop boundary: nothing is cut to it. Capture
 * keeps the whole frame, because a form is only usable when all four of its
 * edges are visible (rule CAP-1), and a fixed rectangle would slice the edges
 * off anything not perfectly placed.
 *
 * It is deliberately **not** tied to `EDGE_INSET` in `frameQuality`. That inset
 * decides which pixels get measured and wants to sit safely inside the paper;
 * this box tells the citizen how close to get and wants to sit near the edges.
 * Sharing one number made the guide needlessly small and made it read as a crop.
 *
 * Shaped to A4 because that is what a Form 34A is, so matching the box means
 * squaring up to the page rather than guessing.
 */
export function FramingBracket({state}: {state: BracketState}) {
    const color = STATE_COLOR[state];
    return (
        <View style={styles.centrer} pointerEvents="none">
            <View style={styles.box}>
                <View style={[styles.corner, styles.topLeft, {borderColor: color}]} />
                <View style={[styles.corner, styles.topRight, {borderColor: color}]} />
                <View
                    style={[styles.corner, styles.bottomLeft, {borderColor: color}]}
                />
                <View
                    style={[styles.corner, styles.bottomRight, {borderColor: color}]}
                />
            </View>
        </View>
    );
}

export default FramingBracket;

const CORNER = 52;
const WEIGHT = 4;

/** Portrait A4, the shape of a Form 34A. */
const A4_PORTRAIT = 1 / 1.414;

const styles = StyleSheet.create({
    centrer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
    },
    box: {
        width: "88%",
        aspectRatio: A4_PORTRAIT,
    },
    corner: {
        position: "absolute",
        width: CORNER,
        height: CORNER,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: WEIGHT,
        borderLeftWidth: WEIGHT,
        borderTopLeftRadius: 10,
    },
    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: WEIGHT,
        borderRightWidth: WEIGHT,
        borderTopRightRadius: 10,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: WEIGHT,
        borderLeftWidth: WEIGHT,
        borderBottomLeftRadius: 10,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: WEIGHT,
        borderRightWidth: WEIGHT,
        borderBottomRightRadius: 10,
    },
});
