import React from "react";

const INK = "#0d0d0d";
const PAPER = "#faf9f6";
const LIME = "#c4ff5e";
const LIME_DEEP = "#a8e63a";

type Geometry = {
    viewBox: string;
    bars: ReadonlyArray<number>;
    barY: number;
    barWidth: number;
    barHeight: number;
    strike: string;
};

/** Source geometry from `src/assets/images/logo/mark.svg` and `mark-compact.svg`. */
const STANDARD: Geometry = {
    viewBox: "80 124 352 280",
    bars: [136, 228, 320],
    barY: 152,
    barWidth: 56,
    barHeight: 224,
    strike: "M108 376 L404 152",
};

const COMPACT: Geometry = {
    viewBox: "36 100 440 328",
    bars: [96, 216, 336],
    barY: 140,
    barWidth: 80,
    barHeight: 248,
    strike: "M76 388 L436 140",
};

export type MarkTone = "ink" | "paper";
export type MarkStrike = "lime" | "deep" | "knockout";

type ShapesProps = {
    tone?: MarkTone;
    strike?: MarkStrike;
    /** The colour behind the mark, cut around the strike in one-colour versions. */
    ground?: string;
    compact?: boolean;
};

/** The mark's shapes in its own 512 space, for placing inside a larger drawing. */
export function MarkShapes({
    tone = "ink",
    strike = "lime",
    ground = PAPER,
    compact = false,
}: ShapesProps) {
    const geometry = compact ? COMPACT : STANDARD;
    const barFill = tone === "ink" ? INK : PAPER;

    return (
        <g>
            {geometry.bars.map((x) => (
                <rect
                    key={x}
                    x={x}
                    y={geometry.barY}
                    width={geometry.barWidth}
                    height={geometry.barHeight}
                    rx={geometry.barWidth / 2}
                    fill={barFill}
                />
            ))}
            {strike === "knockout" && (
                <path
                    d={geometry.strike}
                    stroke={ground}
                    strokeWidth={geometry.barWidth * 1.5}
                    strokeLinecap="round"
                    fill="none"
                />
            )}
            <path
                d={geometry.strike}
                stroke={
                    strike === "knockout" ? barFill : strike === "deep" ? LIME_DEEP : LIME
                }
                strokeWidth={geometry.barWidth}
                strokeLinecap="round"
                fill="none"
            />
        </g>
    );
}

type MarkProps = ShapesProps & {
    width: number;
    label?: string;
    style?: React.CSSProperties;
};

/** The tally gate, cropped to its bounding box. */
export function Mark({width, label, style, compact = false, ...shapes}: MarkProps) {
    const geometry = compact ? COMPACT : STANDARD;
    const [, , boxWidth, boxHeight] = geometry.viewBox.split(" ").map(Number);

    return (
        <svg
            viewBox={geometry.viewBox}
            width={width}
            height={(width * boxHeight) / boxWidth}
            role={label ? "img" : undefined}
            aria-label={label}
            aria-hidden={label ? undefined : true}
            style={style}
        >
            <MarkShapes compact={compact} {...shapes} />
        </svg>
    );
}

/** Places the mark inside another drawing, `width` wide with its top-left at `x`, `y`. */
export function PlacedMark({
    x,
    y,
    width,
    ...shapes
}: ShapesProps & {x: number; y: number; width: number}) {
    const scale = width / 352;

    return (
        <g transform={`translate(${x} ${y}) scale(${scale}) translate(-80 -124)`}>
            <MarkShapes {...shapes} />
        </g>
    );
}

/** Mark and wordmark with the red full stop, from `lockup.svg`. */
export function Lockup({
    width,
    tone = "ink",
    strike = "lime",
}: {
    width: number;
    tone?: MarkTone;
    strike?: MarkStrike;
}) {
    const textFill = tone === "ink" ? INK : PAPER;

    return (
        <svg
            viewBox="0 0 428 96"
            width={width}
            height={(width * 96) / 428}
            role="img"
            aria-label="KuraZetu"
        >
            <g transform="scale(0.1875)">
                <MarkShapes tone={tone} strike={strike} />
            </g>
            <text
                x="118"
                y="66"
                fontFamily="Public Sans, sans-serif"
                fontWeight="800"
                fontSize="62"
                letterSpacing="-2.5"
                fill={textFill}
            >
                KuraZetu
            </text>
            <circle cx="404" cy="56" r="9" fill="#c44539" />
        </svg>
    );
}
