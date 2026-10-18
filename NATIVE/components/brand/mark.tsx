import {StyleSheet, View} from "react-native";
import Svg, {Path, Rect} from "react-native-svg";
import React from "react";

import {INK, LIME, LIME_DEEP, PAPER} from "@/app/_utils/colors";

// Geometry from `src/assets/images/logo/mark.svg`, cropped to the mark.
const VIEW_BOX = "80 124 352 280";
const BOX_WIDTH = 352;
const BOX_HEIGHT = 280;
const BARS = [136, 228, 320];
const BAR_Y = 152;
const BAR_WIDTH = 56;
const BAR_HEIGHT = 224;
const STRIKE = "M108 376 L404 152";

export const MARK_ASPECT = BOX_HEIGHT / BOX_WIDTH;

/**
 * The tally gate: three bars and the strike. On a dark ground the bars are
 * paper and the strike lime; on a light ground the bars are ink and the
 * strike the deeper lime, which holds up against white. Each piece is its
 * own layer over the same box, so a piece can be moved on its own and
 * still land exactly where it belongs.
 */
export function Mark({
    width,
    ground = "dark",
}: {
    width: number;
    ground?: "dark" | "light";
}) {
    const height = width * MARK_ASPECT;
    const barFill = ground === "dark" ? PAPER : INK;
    const strikeColor = ground === "dark" ? LIME : LIME_DEEP;

    return (
        <View
            style={{width, height}}
            accessible
            accessibilityRole="image"
            accessibilityLabel="KuraZetu"
        >
            {BARS.map((x) => (
                <Svg key={x} style={StyleSheet.absoluteFill} viewBox={VIEW_BOX}>
                    <Rect
                        x={x}
                        y={BAR_Y}
                        width={BAR_WIDTH}
                        height={BAR_HEIGHT}
                        rx={BAR_WIDTH / 2}
                        fill={barFill}
                    />
                </Svg>
            ))}
            <Svg style={StyleSheet.absoluteFill} viewBox={VIEW_BOX}>
                <Path
                    d={STRIKE}
                    stroke={strikeColor}
                    strokeWidth={BAR_WIDTH}
                    strokeLinecap="round"
                    fill="none"
                />
            </Svg>
        </View>
    );
}
