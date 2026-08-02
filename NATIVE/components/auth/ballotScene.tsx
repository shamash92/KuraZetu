import DrawnPath, {useCycleFade, useStrokeCycle} from "./strokeDraw";
import {INK, LIME_DEEP} from "../../app/_utils/colors";

import Animated from "react-native-reanimated";
import {StyleSheet} from "react-native";
import Svg from "react-native-svg";

// A hand and pen dropping a ballot into the box, redrawn by hand from the
// design screenshots — claude-design/src/kz-scenes.js, which held the original
// paths, is no longer in the repo.
//
// Draw order is the order of this list, and it is the point of the scene: the
// pen arrives, the hand forms, the slip appears, the box builds under it, then
// the flourishes. Reordering these changes what the animation says.
const VIEW_BOX_WIDTH = 300;
const VIEW_BOX_HEIGHT = 200;

const LINE_WIDTH = 2.4;
const SLIP_WIDTH = 3;
const FLOURISH_WIDTH = 1.6;

interface IStroke {
    d: string;
    stroke: string;
    strokeWidth: number;
    /**
     * Dash length driving the draw. Curves have no cheap arc-length in
     * react-native-svg, so these are deliberate over-estimates: too long only
     * makes a stroke finish early, while too short would leave a fragment
     * visible before it starts.
     */
    length: number;
}

const STROKES: IStroke[] = [
    // Pen, arriving from off-frame top left.
    {d: "M16 44 L84 78", stroke: INK, strokeWidth: LINE_WIDTH, length: 78},
    {d: "M22 33 L90 67", stroke: INK, strokeWidth: LINE_WIDTH, length: 78},
    {d: "M16 44 L22 33", stroke: INK, strokeWidth: LINE_WIDTH, length: 14},
    {d: "M84 78 L97 79 L90 67", stroke: INK, strokeWidth: LINE_WIDTH, length: 28},

    // Hand: index finger reaching the slip, thumb beneath, knuckle behind.
    {
        d: "M97 79 C110 84 122 85 134 80",
        stroke: INK,
        strokeWidth: LINE_WIDTH,
        length: 42,
    },
    {
        d: "M99 89 C108 96 118 96 126 89",
        stroke: INK,
        strokeWidth: LINE_WIDTH,
        length: 32,
    },
    {
        d: "M97 79 C90 84 90 92 99 89",
        stroke: INK,
        strokeWidth: LINE_WIDTH,
        length: 26,
    },

    // The ballot slip, mid-drop, the one lime thing on the screen.
    {
        d: "M136 74 L166 61 L175 88 L145 101 Z",
        stroke: LIME_DEEP,
        strokeWidth: SLIP_WIDTH,
        length: 122,
    },

    // Box: slot first, then the top face it sits in, then the two body faces.
    {
        d: "M126 116 L152 104 L180 114 L154 126 Z",
        stroke: INK,
        strokeWidth: LINE_WIDTH,
        length: 120,
    },
    {
        d: "M96 116 L146 92 L214 116 L164 140 Z",
        stroke: INK,
        strokeWidth: LINE_WIDTH,
        length: 258,
    },
    {
        d: "M96 116 L96 158 L164 182 L164 140",
        stroke: INK,
        strokeWidth: LINE_WIDTH,
        length: 160,
    },
    {
        d: "M164 182 L214 158 L214 116",
        stroke: INK,
        strokeWidth: LINE_WIDTH,
        length: 100,
    },

    // Flourishes: two loops, two sparkles, and the ground the box stands on.
    {
        d: "M240 58 C260 42 278 56 268 72 C261 83 246 79 249 67",
        stroke: INK,
        strokeWidth: FLOURISH_WIDTH,
        length: 78,
    },
    {
        d: "M44 150 C26 158 32 178 48 173 C60 169 57 156 46 159",
        stroke: INK,
        strokeWidth: FLOURISH_WIDTH,
        length: 74,
    },
    {d: "M232 95 L232 109", stroke: INK, strokeWidth: FLOURISH_WIDTH, length: 14},
    {d: "M225 102 L239 102", stroke: INK, strokeWidth: FLOURISH_WIDTH, length: 14},
    {d: "M64 106 L64 118", stroke: INK, strokeWidth: FLOURISH_WIDTH, length: 12},
    {d: "M58 112 L70 112", stroke: INK, strokeWidth: FLOURISH_WIDTH, length: 12},
    {
        d: "M18 186 C68 176 108 196 152 188 C196 180 240 194 284 183",
        stroke: INK,
        strokeWidth: FLOURISH_WIDTH,
        length: 285,
    },
];

export default function BallotScene() {
    const {clock, durationMs} = useStrokeCycle(STROKES.length);
    const fade = useCycleFade(clock, durationMs, STROKES.length);

    return (
        <Animated.View style={[styles.host, fade]}>
            <Svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${VIEW_BOX_WIDTH} ${VIEW_BOX_HEIGHT}`}
            >
                {STROKES.map((stroke, index) => (
                    <DrawnPath
                        key={stroke.d}
                        clock={clock}
                        durationMs={durationMs}
                        index={index}
                        {...stroke}
                    />
                ))}
            </Svg>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    host: {
        width: "100%",
        maxWidth: 252,
        aspectRatio: VIEW_BOX_WIDTH / VIEW_BOX_HEIGHT,
    },
});
