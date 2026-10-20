import React from "react";

import {PlacedMark} from "./Mark";

const HOOD = "M150 72 C 140 30 165 8 200 8 C 235 8 260 30 250 72 Z";
const HOODIE_BODY =
    "M120 70 C 140 60 160 56 200 56 C 240 56 260 60 280 70 L 340 95 C 355 102 362 112 365 128 L 392 330 C 394 342 388 350 376 352 L 350 356 C 340 357 334 352 332 342 L 312 200 L 312 400 C 312 410 306 416 296 416 L 104 416 C 94 416 88 410 88 400 L 88 200 L 68 342 C 66 352 60 357 50 356 L 24 352 C 12 350 6 342 8 330 L 35 128 C 38 112 45 102 60 95 Z";
const HOOD_OPENING =
    "M168 70 C 165 40 180 24 200 24 C 220 24 235 40 232 70 C 225 84 214 90 200 90 C 186 90 175 84 168 70 Z";
const POCKET = "M138 300 L262 300 L284 366 L116 366 Z";

const POLO_BODY =
    "M140 30 C 160 40 180 44 200 44 C 220 44 240 40 260 30 L 330 52 C 342 56 350 64 354 76 L 384 150 L 330 172 L 312 130 L 312 396 C 312 404 306 410 298 410 L 102 410 C 94 410 88 404 88 396 L 88 130 L 70 172 L 16 150 L 46 76 C 50 64 58 56 70 52 Z";
const POLO_COLLAR =
    "M142 28 C 160 36 180 42 200 46 L 190 82 L 150 58 Z M258 28 C 240 36 220 42 200 46 L 210 82 L 250 58 Z";

const CAP_CROWN = "M60 180 C 60 90 130 40 200 40 C 270 40 340 90 340 180 Z";
const CAP_SEAMS =
    "M200 40 L200 180 M200 40 C 160 70 140 120 135 180 M200 40 C 240 70 260 120 265 180";
const CAP_BRIM =
    "M40 182 C 100 170 300 170 360 182 C 350 215 280 232 200 232 C 120 232 50 215 40 182 Z";

/** SVG pattern ids must be unique on the page; `useId` output carries colons. */
function usePatternId(name: string) {
    return `${name}-${React.useId().replace(/:/g, "")}`;
}

type Fabric = {fill: string; shade: string; seam: string};

const FABRIC: Record<"ink" | "charcoal" | "paper" | "stone", Fabric> = {
    ink: {fill: "#141414", shade: "#0a0a0a", seam: "#3a3a3a"},
    charcoal: {fill: "#2a2b2e", shade: "#1d1e21", seam: "#4a4c50"},
    paper: {fill: "#efeeea", shade: "#e2e1dc", seam: "rgba(13,13,13,0.5)"},
    stone: {fill: "#dcd9d1", shade: "#cfccc3", seam: "rgba(13,13,13,0.45)"},
};

function HoodieShell({fabric, cords}: {fabric: Fabric; cords: string}) {
    return (
        <>
            <path d={HOOD} fill={fabric.fill} stroke={fabric.seam} strokeWidth="1.5" />
            <path
                d={HOODIE_BODY}
                fill={fabric.fill}
                stroke={fabric.seam}
                strokeWidth="1.5"
            />
            <path
                d={HOOD_OPENING}
                fill={fabric.shade}
                stroke={fabric.seam}
                strokeWidth="1.5"
            />
            <path
                d="M188 92 L186 150 M212 92 L214 150"
                stroke={cords}
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d={POCKET}
                fill="none"
                stroke={fabric.seam}
                strokeWidth="1.5"
                strokeDasharray="3 3"
            />
            <path
                d="M88 392 L312 392 M68 336 L22 330 M332 336 L378 330"
                stroke={fabric.seam}
                strokeWidth="1.5"
            />
        </>
    );
}

export type HoodieVariant = "stack" | "centre" | "quiet";

/** Volunteer hoodie flats, front view. */
export function Hoodie({variant}: {variant: HoodieVariant}) {
    const countId = usePatternId("count");
    const slantId = usePatternId("slant");
    const prismId = usePatternId("prism");

    if (variant === "stack") {
        const rows = ["KU", "RA", "ZE", "TU"];

        return (
            <svg viewBox="0 0 400 440" role="img" aria-label="Charcoal hoodie, stacked KURA ZETU">
                <defs>
                    <pattern id={countId} width="15" height="15" patternUnits="userSpaceOnUse">
                        <g fill="#0d0d0d">
                            <rect x="3.5" y="3.5" width="2" height="8" rx="1" />
                            <rect x="6.6" y="3.5" width="2" height="8" rx="1" />
                            <rect x="9.7" y="3.5" width="2" height="8" rx="1" />
                        </g>
                        <path
                            d="M2.5 11.5 L12.8 3.5"
                            stroke="#0d0d0d"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </pattern>
                    <pattern
                        id={slantId}
                        width="8"
                        height="8"
                        patternUnits="userSpaceOnUse"
                        patternTransform="rotate(53)"
                    >
                        <rect width="3" height="8" fill="#0d0d0d" />
                    </pattern>
                    <pattern id={prismId} width="10" height="8.66" patternUnits="userSpaceOnUse">
                        <path d="M0 8.66 L5 0 L10 8.66 Z" fill="#0d0d0d" />
                    </pattern>
                </defs>
                <HoodieShell fabric={FABRIC.charcoal} cords="#8a8c90" />
                <g transform="translate(152 116)">
                    {rows.map((row, index) => (
                        <text
                            key={row}
                            x="0"
                            y={31 + index * 34}
                            fontFamily="Public Sans, sans-serif"
                            fontWeight="900"
                            fontSize="36"
                            letterSpacing="-1.5"
                            fill="#faf9f6"
                        >
                            {row}
                        </text>
                    ))}
                    {[countId, slantId, prismId].map((id, index) => (
                        <g key={id}>
                            <rect x="64" y={5 + index * 34} width="30" height="28" fill="#c4ff5e" />
                            <rect
                                x="64"
                                y={5 + index * 34}
                                width="30"
                                height="28"
                                fill={`url(#${id})`}
                            />
                        </g>
                    ))}
                    <PlacedMark x={64} y={110} width={30} tone="paper" />
                </g>
            </svg>
        );
    }

    if (variant === "centre") {
        return (
            <svg viewBox="0 0 400 440" role="img" aria-label="Off-white hoodie, centred mark">
                <defs>
                    <pattern id={countId} width="24" height="26" patternUnits="userSpaceOnUse">
                        <g fill="#0d0d0d">
                            <rect x="6" y="6" width="3" height="13" rx="1.5" />
                            <rect x="11" y="6" width="3" height="13" rx="1.5" />
                            <rect x="16" y="6" width="3" height="13" rx="1.5" />
                        </g>
                        <path
                            d="M4 19 L21 6"
                            stroke="#0d0d0d"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                    </pattern>
                </defs>
                <HoodieShell fabric={FABRIC.paper} cords="rgba(13,13,13,0.6)" />
                <rect
                    x="89"
                    y="368"
                    width="222"
                    height="24"
                    fill={`url(#${countId})`}
                    opacity="0.85"
                />
                <path
                    d="M88 368 L312 368"
                    stroke={FABRIC.paper.seam}
                    strokeWidth="1.5"
                />
                <PlacedMark x={152} y={150} width={96} strike="deep" />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 400 440" role="img" aria-label="Ink hoodie, small chest mark">
            <defs>
                <pattern
                    id={slantId}
                    width="9"
                    height="9"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(53)"
                >
                    <rect width="3.5" height="9" fill="#c4ff5e" />
                </pattern>
            </defs>
            <HoodieShell fabric={FABRIC.ink} cords="#c4ff5e" />
            <polygon
                points="60,95 72,100 47,133 20,333 9,331 36,129"
                fill={`url(#${slantId})`}
                opacity="0.9"
            />
            <polygon
                points="340,95 328,100 353,133 380,333 391,331 364,129"
                fill={`url(#${slantId})`}
                opacity="0.9"
            />
            <PlacedMark x={232} y={124} width={35} tone="paper" />
        </svg>
    );
}

export type PoloVariant = "ink" | "stone";

/** Agent polo with the mark on the left chest. */
export function Polo({variant}: {variant: PoloVariant}) {
    const fabric = FABRIC[variant];

    return (
        <svg
            viewBox="0 0 400 420"
            role="img"
            aria-label={`${variant === "ink" ? "Ink" : "Stone"} polo, left-chest mark`}
        >
            <path d={POLO_BODY} fill={fabric.fill} stroke={fabric.seam} strokeWidth="1.5" />
            <path
                d={POLO_COLLAR}
                fill={fabric.shade}
                stroke={fabric.seam}
                strokeWidth="1.5"
            />
            <rect
                x="193"
                y="46"
                width="14"
                height="70"
                fill="none"
                stroke={fabric.seam}
                strokeWidth="1.5"
            />
            {[66, 86, 106].map((cy) => (
                <circle key={cy} cx="200" cy={cy} r="2.5" fill={fabric.seam} />
            ))}
            <path
                d="M66 162 L20 143 M334 162 L380 143"
                stroke={fabric.seam}
                strokeWidth="1.5"
                strokeDasharray="3 3"
            />
            {variant === "ink" ? (
                <PlacedMark x={244} y={112} width={30} tone="paper" />
            ) : (
                <PlacedMark x={244} y={112} width={30} strike="knockout" ground={fabric.fill} />
            )}
        </svg>
    );
}

/** Agent lanyard card. */
export function Lanyard() {
    return (
        <svg viewBox="0 0 400 420" role="img" aria-label="Agent lanyard card">
            <path d="M150 0 L188 110 M250 0 L212 110" stroke="#141414" strokeWidth="10" />
            <rect
                x="190"
                y="104"
                width="20"
                height="18"
                rx="4"
                fill="none"
                stroke="#6b6d72"
                strokeWidth="3"
            />
            <rect x="120" y="122" width="160" height="240" rx="14" fill="#0d0d0d" />
            <PlacedMark x={140} y={146} width={56} tone="paper" />
            <text
                x="140"
                y="276"
                fontFamily="Public Sans, sans-serif"
                fontWeight="900"
                fontSize="20"
                letterSpacing="-0.6"
                fill="#faf9f6"
            >
                [NAME]
            </text>
            <text
                x="140"
                y="300"
                fontFamily="Public Sans, sans-serif"
                fontWeight="500"
                fontSize="13"
                fill="#9a9da3"
            >
                Agent · [STATION]
            </text>
            <rect x="120" y="342" width="160" height="20" fill="#c4ff5e" />
        </svg>
    );
}

export type CapVariant = "ink" | "stone";

/** Six-panel cap, front view. */
export function Cap({variant}: {variant: CapVariant}) {
    const fabric = FABRIC[variant];

    return (
        <svg
            viewBox="0 0 400 260"
            role="img"
            aria-label={`${variant === "ink" ? "Ink" : "Stone"} cap, embroidered mark`}
        >
            <path d={CAP_CROWN} fill={fabric.fill} stroke={fabric.seam} strokeWidth="1.5" />
            <path
                d={CAP_SEAMS}
                fill="none"
                stroke={fabric.seam}
                strokeWidth="1.5"
                strokeDasharray="3 3"
            />
            <circle cx="200" cy="40" r="6" fill={fabric.fill} stroke={fabric.seam} strokeWidth="1.5" />
            <path
                d={CAP_BRIM}
                fill={variant === "ink" ? fabric.shade : "#0d0d0d"}
                stroke={fabric.seam}
                strokeWidth="1.5"
            />
            {variant === "ink" ? (
                <PlacedMark x={166} y={102} width={67} tone="paper" />
            ) : (
                <PlacedMark x={166} y={102} width={67} strike="knockout" ground={fabric.fill} />
            )}
        </svg>
    );
}

/** Cuffed beanie with a woven lime tab. */
export function Beanie() {
    const fabric = FABRIC.charcoal;
    const ribs = [120, 140, 160, 180, 200, 220, 240, 260, 280];

    return (
        <svg viewBox="0 0 400 260" role="img" aria-label="Charcoal beanie, woven lime tab">
            <path
                d="M90 170 C 90 80 140 30 200 30 C 260 30 310 80 310 170 Z"
                fill={fabric.fill}
                stroke={fabric.seam}
                strokeWidth="1.5"
            />
            {ribs.map((x) => (
                <path key={x} d={`M${x} 165 L${x} ${x === 200 ? 34 : 60}`} stroke={fabric.seam} />
            ))}
            <rect
                x="84"
                y="166"
                width="232"
                height="58"
                rx="10"
                fill={fabric.fill}
                stroke={fabric.seam}
                strokeWidth="1.5"
            />
            <rect x="176" y="180" width="48" height="30" rx="3" fill="#c4ff5e" />
            <PlacedMark x={186} y={186} width={26} strike="knockout" ground="#c4ff5e" />
        </svg>
    );
}

/** A garment drawing on a card with its name beneath. */
export function GarmentTile({caption, children}: {caption: string; children: React.ReactNode}) {
    return (
        <figure className="kz-brand-tile">
            <div className="kz-brand-panel" style={{padding: 20, minHeight: 240}}>
                {children}
            </div>
            <figcaption>{caption}</figcaption>
        </figure>
    );
}
