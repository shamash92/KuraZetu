import React from "react";

import {BrandSubsection} from "../BrandPage";

const SPECS = [
    ["x", "Bar width"],
    ["Bar", "1x × 4x"],
    ["Gap", "0.64x"],
    ["Strike", "1x"],
    ["Angle", "Rise 3 : run 4"],
];

function ConstructionDrawing() {
    const capCentres = [
        [164, 180],
        [164, 348],
        [256, 180],
        [256, 348],
        [348, 180],
        [348, 348],
        [108, 376],
        [404, 152],
    ];

    return (
        <svg viewBox="30 80 480 446" role="img" aria-label="Construction drawing of the mark">
            <defs>
                <pattern id="kz-brand-minor" width="8" height="8" patternUnits="userSpaceOnUse">
                    <path
                        d="M8 0 L0 0 0 8"
                        fill="none"
                        stroke="rgba(13,13,13,0.05)"
                        strokeWidth="0.5"
                    />
                </pattern>
                <pattern
                    id="kz-brand-major"
                    width="56"
                    height="56"
                    x="80"
                    y="124"
                    patternUnits="userSpaceOnUse"
                >
                    <path
                        d="M56 0 L0 0 0 56"
                        fill="none"
                        stroke="rgba(37,50,168,0.14)"
                        strokeWidth="0.6"
                    />
                </pattern>
            </defs>
            <rect x="30" y="80" width="480" height="446" fill="url(#kz-brand-minor)" />
            <rect x="30" y="80" width="480" height="446" fill="url(#kz-brand-major)" />
            <rect
                x="80"
                y="124"
                width="352"
                height="280"
                fill="none"
                stroke="#2532a8"
                strokeWidth="0.6"
                strokeDasharray="3 3"
            />
            {[136, 228, 320].map((x) => (
                <rect
                    key={x}
                    x={x}
                    y="152"
                    width="56"
                    height="224"
                    rx="28"
                    fill="rgba(13,13,13,0.07)"
                    stroke="#0d0d0d"
                />
            ))}
            <path
                d="M108 376 L404 152"
                stroke="#0d0d0d"
                strokeWidth="57.5"
                strokeLinecap="round"
                fill="none"
            />
            <path
                d="M108 376 L404 152"
                stroke="#c4ff5e"
                strokeWidth="55.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.85"
            />
            <path
                d="M60 412.3 L452 115.7"
                stroke="#2532a8"
                strokeWidth="0.6"
                strokeDasharray="6 3 1 3"
                fill="none"
            />
            {capCentres.map(([cx, cy]) => (
                <g key={`${cx}-${cy}`}>
                    <circle
                        cx={cx}
                        cy={cy}
                        r="28"
                        fill="none"
                        stroke="#2532a8"
                        strokeWidth="0.6"
                        strokeDasharray="2 2"
                    />
                    <circle cx={cx} cy={cy} r="1.4" fill="#2532a8" />
                </g>
            ))}
            <g stroke="#c44539" strokeWidth="0.7" fill="none">
                <path d="M108 376 L176 376" />
                <path d="M168 376 A60 60 0 0 0 155.9 339.9" strokeWidth="0.9" />
                <path d="M136 100 L136 146 M192 100 L192 146 M228 100 L228 146 M136 108 L228 108" />
                <path d="M133 105 L139 111 M189 105 L195 111 M225 105 L231 111" />
                <path d="M60 152 L130 152 M60 376 L130 376 M70 152 L70 376" />
                <path d="M67 149 L73 155 M67 373 L73 379" />
                <path d="M80 410 L80 470 M432 410 L432 470 M80 462 L432 462" />
                <path d="M77 459 L83 465 M429 459 L435 465" />
                <path d="M440 124 L490 124 M440 404 L490 404 M482 124 L482 404" />
                <path d="M479 121 L485 127 M479 401 L485 407" />
            </g>
            <g fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#c44539">
                <text x="155" y="101">1x</text>
                <text x="196" y="101">0.64x</text>
                <text x="174" y="360">37°</text>
                <text x="40" y="268">4x</text>
                <text x="244" y="480">6.29x</text>
                <text x="490" y="268">5x</text>
            </g>
        </svg>
    );
}

export default function ConstructionSection() {
    return (
        <BrandSubsection id="logo-construction" title="Construction">
            <div className="kz-brand-split">
                <div className="kz-brand-panel">
                    <ConstructionDrawing />
                </div>
                <dl className="kz-brand-specs">
                    {SPECS.map(([term, value]) => (
                        <div key={term}>
                            <dt>{term}</dt>
                            <dd>{value}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </BrandSubsection>
    );
}
