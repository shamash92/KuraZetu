import React, {useState} from "react";
import {type LayoutChangeEvent, StyleSheet, View} from "react-native";
import Animated, {
    Easing,
    cancelAnimation,
    type SharedValue,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import Svg, {Circle, Ellipse, G, Path, Rect, Text as SvgText} from "react-native-svg";

import {
    BRACKET_COLOR,
    type BracketState,
} from "@/components/resultsForm/camera/FramingBracket";
import {perk} from "@/app/_utils/colors";

export type CaptureTipArtKind = "wipe" | "fill" | "qr" | "tap";

/** Every drawing is laid out on this grid, then scaled to fit its panel. */
const VIEW_WIDTH = 300;
const VIEW_HEIGHT = 240;

/** Forms are drawn as white paper with dark print, as the camera sees them. */
const SHEET = perk.card;
const PRINT = perk.ink;
const FAINT = perk.mute2;

const ease = Easing.bezierFn(0.22, 0.61, 0.36, 1);

/**
 * CSS-style keyframes over one loop: `stops` run 0–1, and each segment between
 * two stops is eased on its own. Every loop ends on the state the tip teaches,
 * which is also what reduce motion shows.
 */
function keyframes(
    progress: number,
    stops: ReadonlyArray<number>,
    values: ReadonlyArray<number>,
) {
    "worklet";
    if (progress <= stops[0]) return values[0];
    for (let index = 1; index < stops.length; index++) {
        if (progress <= stops[index]) {
            const span = stops[index] - stops[index - 1];
            const within = span === 0 ? 1 : (progress - stops[index - 1]) / span;
            return (
                values[index - 1] +
                (values[index] - values[index - 1]) * ease(within)
            );
        }
    }
    return values[values.length - 1];
}

/** Loop progress, 0–1. Held at the end state under reduce motion. */
function useLoop(durationMs: number) {
    const reduceMotion = useReducedMotion();
    const progress = useSharedValue(reduceMotion ? 1 : 0);

    React.useEffect(() => {
        if (reduceMotion) {
            progress.value = 1;
            return;
        }
        progress.value = 0;
        progress.value = withRepeat(
            withTiming(1, {duration: durationMs, easing: Easing.linear}),
            -1,
        );
        return () => cancelAnimation(progress);
    }, [durationMs, progress, reduceMotion]);

    return progress;
}

/** Where the drawing grid lands inside the panel. */
type Fit = {scale: number; left: number; top: number};

/** A region of the drawing grid: x, y, width, height. */
type Box = readonly [number, number, number, number];

const FULL: Box = [0, 0, VIEW_WIDTH, VIEW_HEIGHT];

/**
 * One animated part of a drawing. Each part is its own view so it can move and
 * fade on the UI thread; a part that scales gets a box around itself, because
 * a view scales about its own centre.
 */
function Layer({
    fit,
    box = FULL,
    style,
    children,
}: {
    fit: Fit;
    box?: Box;
    style?: React.ComponentProps<typeof Animated.View>["style"];
    children: React.ReactNode;
}) {
    const [x, y, width, height] = box;
    return (
        <Animated.View
            pointerEvents="none"
            style={[
                {
                    position: "absolute",
                    left: fit.left + x * fit.scale,
                    top: fit.top + y * fit.scale,
                    width: width * fit.scale,
                    height: height * fit.scale,
                },
                style,
            ]}
        >
            <Svg width="100%" height="100%" viewBox={`${x} ${y} ${width} ${height}`}>
                {children}
            </Svg>
        </Animated.View>
    );
}

function qrCode(
    x: number,
    y: number,
    size: number,
    strokeWidth = 1.2,
) {
    const unit = size / 5;
    const finders: ReadonlyArray<[number, number]> = [
        [0, 0],
        [3, 0],
        [0, 3],
    ];
    return (
        <G>
            <Rect
                x={x}
                y={y}
                width={size}
                height={size}
                fill={SHEET}
                stroke={PRINT}
                strokeWidth={strokeWidth}
            />
            {finders.map(([column, row]) => (
                <Rect
                    key={`${column}-${row}`}
                    x={x + column * unit + unit * 0.35}
                    y={y + row * unit + unit * 0.35}
                    width={unit * 1.3}
                    height={unit * 1.3}
                    fill={PRINT}
                />
            ))}
            <Rect
                x={x + 3.3 * unit}
                y={y + 3.3 * unit}
                width={unit * 0.8}
                height={unit * 0.8}
                fill={PRINT}
            />
            <Rect
                x={x + 2.1 * unit}
                y={y + 2.2 * unit}
                width={unit * 0.6}
                height={unit * 0.6}
                fill={PRINT}
            />
        </G>
    );
}

/** A Form 34A: header with the QR top right, tally rows, signature, stamp. */
function formSheet(x: number, y: number, width: number, height: number) {
    const lastRule = y + height - 24;
    const rules: Array<React.ReactElement> = [];
    for (let ruleY = y + 34; ruleY < lastRule; ruleY += 11) {
        rules.push(
            <Path
                key={ruleY}
                d={`M${x + 6} ${ruleY}H${x + width - 6}`}
                stroke={FAINT}
                strokeWidth={1}
            />,
        );
    }
    return (
        <G>
            <Rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={SHEET}
                stroke={PRINT}
                strokeWidth={1.5}
            />
            <Rect
                x={x + 7}
                y={y + 7}
                width={width * 0.42}
                height={4}
                rx={1}
                fill={FAINT}
            />
            <Rect
                x={x + 7}
                y={y + 14}
                width={width * 0.28}
                height={3}
                rx={1}
                fill={FAINT}
            />
            {qrCode(x + width - 20, y + 4, 15)}
            <Path d={`M${x} ${y + 24}H${x + width}`} stroke={PRINT} strokeWidth={1} />
            {rules}
            <Path
                d={`M${x + width * 0.64} ${y + 28}V${lastRule}`}
                stroke={FAINT}
                strokeWidth={1}
            />
            <Path
                d={`M${x + 6} ${lastRule + 2}H${x + width - 6}`}
                stroke={PRINT}
                strokeWidth={1.4}
            />
            <Path
                d={`M${x + 8} ${y + height - 9}c4-6 7 3 10-2s6 2 9-1`}
                fill="none"
                stroke={PRINT}
                strokeWidth={1.1}
                strokeLinecap="round"
            />
            <Circle
                cx={x + width - 14}
                cy={y + height - 11}
                r={6}
                fill="none"
                stroke={FAINT}
                strokeWidth={1.2}
            />
        </G>
    );
}

/** Tape holding a posted form to the wall. */
function tape(x: number, y: number, degrees: number) {
    return (
        <Rect
            x={x - 9}
            y={y - 4}
            width={18}
            height={8}
            fill={FAINT}
            opacity={0.55}
            transform={`rotate(${degrees} ${x} ${y})`}
        />
    );
}

/** The camera's corner brackets, in the live camera's colour for `state`. */
function brackets(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    length: number,
    state: BracketState,
) {
    return (
        <Path
            d={
                `M${x1} ${y1 + length}V${y1}H${x1 + length}` +
                `M${x2 - length} ${y1}H${x2}V${y1 + length}` +
                `M${x2} ${y2 - length}V${y2}H${x2 - length}` +
                `M${x1 + length} ${y2}H${x1}V${y2 - length}`
            }
            fill="none"
            stroke={BRACKET_COLOR[state]}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    );
}

type ArtProps = {fit: Fit};

/** A cloth wipes smudges off the camera lens. */
function WipeArt({fit}: ArtProps) {
    const progress = useLoop(4400);
    const smudges = useAnimatedStyle(() => ({
        opacity: keyframes(progress.value, [0, 0.2, 0.48, 1], [1, 1, 0, 0]),
    }));
    const cloth = useAnimatedStyle(() => ({
        opacity: keyframes(progress.value, [0, 0.46, 0.52, 1], [1, 1, 0, 0]),
        transform: [
            {
                translateX:
                    keyframes(progress.value, [0, 0.1, 0.46, 1], [-40, -40, 92, 92]) *
                    fit.scale,
            },
        ],
    }));

    return (
        <>
            <Layer fit={fit}>
                <Rect
                    x={96}
                    y={30}
                    width={108}
                    height={156}
                    rx={18}
                    fill="none"
                    stroke={perk.ink}
                    strokeWidth={1.6}
                />
                <Circle
                    cx={150}
                    cy={84}
                    r={30}
                    fill="none"
                    stroke={perk.ink}
                    strokeWidth={1.6}
                />
                <Circle
                    cx={150}
                    cy={84}
                    r={15}
                    fill="none"
                    stroke={perk.ink}
                    strokeWidth={1.4}
                />
                <SvgText
                    x={150}
                    y={214}
                    textAnchor="middle"
                    fontFamily="SpaceMono-Regular"
                    fontSize={11}
                    letterSpacing={1}
                    fill={perk.mute}
                >
                    CAMERA
                </SvgText>
            </Layer>
            <Layer fit={fit} style={smudges}>
                <Ellipse
                    cx={141}
                    cy={76}
                    rx={11}
                    ry={6}
                    fill={perk.mute}
                    opacity={0.5}
                />
                <Ellipse
                    cx={159}
                    cy={92}
                    rx={8}
                    ry={5}
                    fill={perk.mute}
                    opacity={0.45}
                />
                <Ellipse
                    cx={147}
                    cy={97}
                    rx={5}
                    ry={3}
                    fill={perk.mute}
                    opacity={0.55}
                />
            </Layer>
            <Layer fit={fit} style={cloth}>
                <Path
                    d="M94 50c10-4 20 4 30 0v70c-10 4-20-4-30 0z"
                    fill={perk.ink}
                    opacity={0.8}
                />
            </Layer>
        </>
    );
}

/**
 * Red brackets close in on one form among neighbouring streams' forms and turn
 * lime once it fills them.
 */
function FillArt({fit}: ArtProps) {
    const progress = useLoop(3600);
    const neighbours = useAnimatedStyle(() => ({
        opacity: keyframes(progress.value, [0, 0.25, 0.62, 1], [1, 1, 0.28, 0.28]),
    }));
    const frameScale = (value: SharedValue<number>) => {
        "worklet";
        const stops = [0, 0.18, 0.62, 1];
        return [{scale: keyframes(value.value, stops, [1.85, 1.85, 1, 1])}];
    };
    const searching = useAnimatedStyle(() => ({
        opacity: keyframes(progress.value, [0, 0.56, 0.66, 1], [1, 1, 0, 0]),
        transform: frameScale(progress),
    }));
    const filled = useAnimatedStyle(() => ({
        opacity: keyframes(progress.value, [0, 0.56, 0.66, 1], [0, 0, 1, 1]),
        transform: frameScale(progress),
    }));

    return (
        <>
            <Layer fit={fit}>
                {formSheet(100, 50, 100, 141)}
                {tape(110, 51, -7)}
                {tape(190, 51, 7)}
            </Layer>
            <Layer fit={fit} style={neighbours}>
                {formSheet(-14, 50, 100, 141)}
                {formSheet(214, 50, 100, 141)}
                {tape(-4, 51, -8)}
                {tape(76, 51, 6)}
                {tape(224, 51, -6)}
                {tape(304, 51, 8)}
            </Layer>
            <Layer fit={fit} style={searching}>
                {brackets(91, 41, 209, 200, 20, "bad")}
            </Layer>
            <Layer fit={fit} style={filled}>
                {brackets(91, 41, 209, 200, 20, "steady")}
            </Layer>
        </>
    );
}

/**
 * The top-right corner of the form slides in until the whole QR code is in
 * view, and the corner bracket turns from red to lime.
 */
function QrArt({fit}: ArtProps) {
    const progress = useLoop(4000);
    const page = useAnimatedStyle(() => {
        const stops = [0, 0.2, 0.6, 1];
        return {
            transform: [
                {
                    translateX:
                        keyframes(progress.value, stops, [90, 90, 0, 0]) * fit.scale,
                },
                {
                    translateY:
                        keyframes(progress.value, stops, [-40, -40, 0, 0]) * fit.scale,
                },
            ],
        };
    });
    const cutOff = useAnimatedStyle(() => ({
        opacity: keyframes(progress.value, [0, 0.56, 0.66, 1], [1, 1, 0, 0]),
    }));
    const inView = useAnimatedStyle(() => ({
        opacity: keyframes(progress.value, [0, 0.56, 0.66, 1], [0, 0, 1, 1]),
    }));
    const corner = (state: BracketState) => (
        <Path
            d="M234 40H256V62"
            fill="none"
            stroke={BRACKET_COLOR[state]}
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    );

    return (
        <>
            <Layer fit={fit} style={page}>
                <Path
                    d="M-10 52H244V250H-10Z"
                    fill={SHEET}
                    stroke={PRINT}
                    strokeWidth={2}
                />
                <Rect x={14} y={70} width={110} height={9} rx={2} fill={FAINT} />
                <Rect x={14} y={88} width={72} height={7} rx={2} fill={FAINT} />
                <Path d="M-10 124H244" stroke={PRINT} strokeWidth={1.4} />
                <Path
                    d="M-10 150H244M-10 176H244M-10 202H244M150 124V250"
                    stroke={FAINT}
                    strokeWidth={1.2}
                />
                {qrCode(170, 64, 50, 1.6)}
            </Layer>
            <Layer fit={fit} style={cutOff}>
                {corner("bad")}
            </Layer>
            <Layer fit={fit} style={inView}>
                {corner("steady")}
            </Layer>
        </>
    );
}

/** The live camera's lime guidance pill. */
function hint(label: string) {
    return (
        <G>
            <Rect x={108} y={167} width={84} height={24} rx={12} fill={perk.lime} />
            <SvgText
                x={150}
                y={183}
                textAnchor="middle"
                fontFamily="PublicSans-ExtraBold"
                fontSize={11}
                fill={perk.limeInk}
            >
                {label}
            </SvgText>
        </G>
    );
}

/**
 * The form wobbles inside copper brackets under "Hold still", steadies, the
 * brackets turn lime with "Looks good", and the shutter appears.
 */
function TapArt({fit}: ArtProps) {
    const progress = useLoop(4400);
    const wobble = (value: SharedValue<number>) => {
        "worklet";
        const stops = [0, 0.08, 0.16, 0.26, 0.36, 1];
        return [
            {
                translateX:
                    keyframes(value.value, stops, [-5, 4, -3, 1, 0, 0]) * fit.scale,
            },
            {
                translateY:
                    keyframes(value.value, stops, [3, -2, 2, -1, 0, 0]) * fit.scale,
            },
        ];
    };
    const form = useAnimatedStyle(() => ({transform: wobble(progress)}));
    // Motion blur, drawn as a fading second copy that moves with the form.
    const ghost = useAnimatedStyle(() => ({
        opacity: keyframes(
            progress.value,
            [0, 0.16, 0.26, 0.36, 1],
            [0.45, 0.3, 0.12, 0, 0],
        ),
        transform: wobble(progress),
    }));
    const holding = useAnimatedStyle(() => ({
        opacity: keyframes(progress.value, [0, 0.36, 0.44, 1], [1, 1, 0, 0]),
    }));
    const steady = useAnimatedStyle(() => ({
        opacity: keyframes(progress.value, [0, 0.36, 0.44, 1], [0, 0, 1, 1]),
    }));
    const shutter = useAnimatedStyle(() => {
        const stops = [0, 0.44, 0.56, 1];
        return {
            opacity: keyframes(progress.value, stops, [0, 0, 1, 1]),
            transform: [{scale: keyframes(progress.value, stops, [0.4, 0.4, 1, 1])}],
        };
    });
    const tap = useAnimatedStyle(() => {
        const stops = [0, 0.7, 0.74, 0.88, 1];
        return {
            opacity: keyframes(progress.value, stops, [0, 0, 0.9, 0, 0]),
            transform: [
                {scale: keyframes(progress.value, stops, [0.6, 0.6, 0.9, 1.5, 1.5])},
            ],
        };
    });

    return (
        <>
            <Layer fit={fit} style={ghost}>
                {formSheet(103, 14, 100, 138)}
            </Layer>
            <Layer fit={fit} style={form}>
                {formSheet(100, 12, 100, 138)}
            </Layer>
            <Layer fit={fit} style={holding}>
                {brackets(90, 4, 210, 158, 18, "ok")}
                {hint("Hold still")}
            </Layer>
            <Layer fit={fit} style={steady}>
                {brackets(90, 4, 210, 158, 18, "steady")}
                {hint("Looks good")}
            </Layer>
            <Layer fit={fit} box={[130, 194, 40, 40]} style={shutter}>
                <Circle
                    cx={150}
                    cy={214}
                    r={17}
                    fill={perk.lime}
                />
            </Layer>
            <Layer fit={fit} box={[126, 190, 48, 48]} style={tap}>
                <Circle
                    cx={150}
                    cy={214}
                    r={22}
                    fill="none"
                    stroke={perk.paper}
                    strokeWidth={2}
                />
            </Layer>
        </>
    );
}

const ART: Record<CaptureTipArtKind, (props: ArtProps) => React.ReactElement> = {
    wipe: WipeArt,
    fill: FillArt,
    qr: QrArt,
    tap: TapArt,
};

/** Drawings of the camera view sit on black, like the viewfinder. */
const VIEWFINDER: ReadonlySet<CaptureTipArtKind> = new Set(["fill", "qr", "tap"]);

/**
 * The looping drawing above a capture tip. Decorative: the tip's heading and
 * text carry everything a screen reader needs.
 */
export function CaptureTipArt({art}: {art: CaptureTipArtKind}) {
    const [fit, setFit] = useState<Fit | null>(null);
    const Art = ART[art];

    const onLayout = (event: LayoutChangeEvent) => {
        const {width, height} = event.nativeEvent.layout;
        const scale = Math.min(width / VIEW_WIDTH, height / VIEW_HEIGHT);
        setFit({
            scale,
            left: (width - VIEW_WIDTH * scale) / 2,
            top: (height - VIEW_HEIGHT * scale) / 2,
        });
    };

    return (
        <View
            style={[styles.panel, VIEWFINDER.has(art) && styles.viewfinder]}
            onLayout={onLayout}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            {fit ? <Art fit={fit} /> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    panel: {
        height: 300,
        minHeight: 160,
        flexShrink: 1,
        marginHorizontal: 16,
        borderRadius: 18,
        backgroundColor: perk.surface,
        overflow: "hidden",
    },
    viewfinder: {backgroundColor: perk.ink},
});
