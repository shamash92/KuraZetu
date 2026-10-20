import React from "react";

import {BrandSubsection} from "../BrandPage";
import {Lockup, Mark, MarkShapes} from "../Mark";

function ClearSpaceDiagram() {
    return (
        <div className="kz-brand-grid" style={{"--min": "320px"} as React.CSSProperties}>
            <div className="kz-brand-panel" style={{minHeight: 240}}>
                <svg
                    viewBox="24 68 464 392"
                    style={{width: "56%"}}
                    role="img"
                    aria-label="Mark with one bar-width of clear space"
                >
                    <defs>
                        <pattern
                            id="kz-brand-hatch"
                            width="6"
                            height="6"
                            patternUnits="userSpaceOnUse"
                            patternTransform="rotate(45)"
                        >
                            <path d="M0 0 L0 6" stroke="rgba(196,69,57,0.35)" strokeWidth="1.2" />
                        </pattern>
                    </defs>
                    <path
                        d="M24 68 H488 V460 H24 Z M80 124 V404 H432 V124 Z"
                        fill="url(#kz-brand-hatch)"
                        fillRule="evenodd"
                    />
                    <rect
                        x="24"
                        y="68"
                        width="464"
                        height="392"
                        fill="none"
                        stroke="#c44539"
                        strokeDasharray="4 3"
                    />
                    <MarkShapes />
                    <text x="44" y="272" fontFamily="IBM Plex Mono, monospace" fontSize="18" fill="#c44539">
                        x
                    </text>
                </svg>
            </div>
            <div className="kz-brand-panel" style={{minHeight: 240, padding: 24}}>
                <Lockup width={300} />
            </div>
        </div>
    );
}

export default function ClearSpaceSection() {
    return (
        <BrandSubsection id="logo-clear-space" title="Clear space">
            <ClearSpaceDiagram />
            <div className="kz-brand-sizes">
                <figure>
                    <Mark width={48} strike="deep" />
                    48 px
                </figure>
                <figure>
                    <Mark width={24} strike="deep" />
                    24 px min
                </figure>
                <figure>
                    <Mark width={16} strike="deep" compact />
                    16 px compact
                </figure>
                <figure>
                    <Lockup width={96} strike="deep" />
                    96 px min
                </figure>
            </div>
            <p className="kz-brand-lede">
                Smallest sizes off screen: 10 mm printed, 15 mm embroidered.
            </p>
        </BrandSubsection>
    );
}
