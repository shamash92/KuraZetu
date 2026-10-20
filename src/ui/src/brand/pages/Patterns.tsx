import React from "react";

import {BrandPage} from "../BrandPage";

function PatternSwatches() {
    return (
        <div className="kz-brand-grid">
            <figure className="kz-brand-tile">
                <svg viewBox="0 0 412 400" style={{borderRadius: 18}} aria-hidden="true">
                    <defs>
                        <pattern id="kz-brand-count" width="72" height="64" patternUnits="userSpaceOnUse">
                            <g fill="#faf9f6" opacity="0.16">
                                <rect x="17" y="19" width="7" height="28" rx="3.5" />
                                <rect x="28.5" y="19" width="7" height="28" rx="3.5" />
                                <rect x="40" y="19" width="7" height="28" rx="3.5" />
                            </g>
                            <path
                                d="M13.5 47 L50.5 19"
                                stroke="#c4ff5e"
                                strokeWidth="7"
                                strokeLinecap="round"
                                opacity="0.5"
                            />
                        </pattern>
                    </defs>
                    <rect width="412" height="400" fill="#0d0d0d" />
                    <rect width="412" height="400" fill="url(#kz-brand-count)" />
                </svg>
                <figcaption>Count</figcaption>
            </figure>
            <figure className="kz-brand-tile">
                <svg viewBox="0 0 412 400" style={{borderRadius: 18}} aria-hidden="true">
                    <defs>
                        <pattern
                            id="kz-brand-slant"
                            width="44"
                            height="44"
                            patternUnits="userSpaceOnUse"
                            patternTransform="rotate(53)"
                        >
                            {[0, 10, 20].map((x) => (
                                <rect key={x} x={x} width="5" height="44" fill="#faf9f6" opacity="0.16" />
                            ))}
                        </pattern>
                    </defs>
                    <rect width="412" height="400" fill="#0d0d0d" />
                    <rect width="412" height="400" fill="url(#kz-brand-slant)" />
                </svg>
                <figcaption>Slant</figcaption>
            </figure>
            <figure className="kz-brand-tile">
                <svg viewBox="0 0 412 400" style={{borderRadius: 18}} aria-hidden="true">
                    <defs>
                        <pattern id="kz-brand-prism" width="40" height="34.64" patternUnits="userSpaceOnUse">
                            <path
                                d="M0 34.64 L20 0 L40 34.64 Z M0 0 L40 0"
                                fill="none"
                                stroke="#faf9f6"
                                strokeOpacity="0.2"
                                strokeWidth="1.2"
                            />
                            <path d="M20 0 L40 34.64 L60 0 Z" fill="#c4ff5e" opacity="0.12" />
                        </pattern>
                    </defs>
                    <rect width="412" height="400" fill="#0d0d0d" />
                    <rect width="412" height="400" fill="url(#kz-brand-prism)" />
                </svg>
                <figcaption>Prism</figcaption>
            </figure>
        </div>
    );
}

export default function PatternsPage() {
    return (
        <BrandPage title="Patterns">
            <PatternSwatches />
        </BrandPage>
    );
}
