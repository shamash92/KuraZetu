import DrawnPath, {useCycleFade, useStrokeCycle} from "./strokeDraw";
import {INK, LIME_DEEP} from "../../app/_utils/colors";

import Animated from "react-native-reanimated";
import {StyleSheet} from "react-native";
import Svg from "react-native-svg";

// Ported from claude-design/mobile-auth-perk.html — three groups of five, four
// uprights struck through by a lime fifth. Geometry is the design's own
// arithmetic, kept literal so the two stay comparable.
const VIEW_BOX_WIDTH = 300;
const VIEW_BOX_HEIGHT = 120;
const GROUP_ORIGINS = [22, 118, 214];
const UPRIGHT_GAP = 14;
const UPRIGHT_TOP = 24;
const UPRIGHT_BOTTOM = 96;
const UPRIGHT_WIDTH = 5;
const FIFTH_WIDTH = 6.5;

// The browser reads path lengths off the DOM; react-native-svg has no
// equivalent, and every stroke here is a straight line, so they are computed.
const UPRIGHT_LENGTH = UPRIGHT_BOTTOM - UPRIGHT_TOP;
const FIFTH_LENGTH = Math.hypot(66, 84);

interface IStroke {
    d: string;
    stroke: string;
    strokeWidth: number;
    length: number;
}

const STROKES: IStroke[] = GROUP_ORIGINS.flatMap((originX) => {
    const uprights = [0, 1, 2, 3].map((i) => {
        const x = originX + i * UPRIGHT_GAP;
        return {
            d: `M${x} ${UPRIGHT_TOP} L${x} ${UPRIGHT_BOTTOM}`,
            stroke: INK,
            strokeWidth: UPRIGHT_WIDTH,
            length: UPRIGHT_LENGTH,
        };
    });

    const fifth = {
        d: `M${originX - 8} 102 L${originX + 58} 18`,
        stroke: LIME_DEEP,
        strokeWidth: FIFTH_WIDTH,
        length: FIFTH_LENGTH,
    };

    return [...uprights, fifth];
});

export default function TallyScene() {
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
        maxWidth: 250,
        aspectRatio: VIEW_BOX_WIDTH / VIEW_BOX_HEIGHT,
    },
});
