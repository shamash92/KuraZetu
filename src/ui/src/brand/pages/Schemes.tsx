import React from "react";

import {BrandPage} from "../BrandPage";

type Scheme = {ground: string; text: string; accent?: string; ratio: string};

/** WCAG 2.x contrast of text on ground. */
const SCHEMES_TO_USE: ReadonlyArray<Scheme> = [
    {ground: "#f7f6f3", text: "#0d0d0d", accent: "#c4ff5e", ratio: "18.0 : 1"},
    {ground: "#0d0d0d", text: "#faf9f6", accent: "#c4ff5e", ratio: "18.0 : 1"},
    {ground: "#c4ff5e", text: "#0d0d0d", accent: "#0d0d0d", ratio: "16.5 : 1"},
    {ground: "#ffffff", text: "#0d0d0d", accent: "#0d0d0d", ratio: "19.4 : 1"},
];

const SCHEMES_TO_AVOID: ReadonlyArray<Scheme> = [
    {ground: "#f7f6f3", text: "#c4ff5e", ratio: "1.1 : 1"},
    {ground: "#c4ff5e", text: "#f7f6f3", ratio: "1.1 : 1"},
    {ground: "#0d0d0d", text: "#c44539", ratio: "3.9 : 1"},
    {ground: "#0d0d0d", text: "#2a2b2e", ratio: "1.4 : 1"},
];

export default function SchemesPage() {
    return (
        <BrandPage title="Schemes">
            <h3>Use</h3>
            <div className="kz-brand-grid" style={{"--min": "200px"} as React.CSSProperties}>
                {SCHEMES_TO_USE.map((scheme) => (
                    <figure key={`${scheme.ground}-${scheme.text}`} className="kz-brand-tile">
                        <div
                            className="kz-brand-scheme kz-brand-bordered"
                            style={{background: scheme.ground, alignItems: "flex-start"}}
                        >
                            <span style={{color: scheme.text}}>Aa</span>
                            <span style={{background: scheme.accent}} />
                        </div>
                        <figcaption>{scheme.ratio}</figcaption>
                    </figure>
                ))}
            </div>
            <h3>Avoid</h3>
            <div className="kz-brand-grid" style={{"--min": "200px"} as React.CSSProperties}>
                {SCHEMES_TO_AVOID.map((scheme) => (
                    <figure
                        key={`${scheme.ground}-${scheme.text}`}
                        className="kz-brand-tile kz-brand-avoid"
                    >
                        <div
                            className="kz-brand-scheme kz-brand-bordered"
                            style={{background: scheme.ground, alignItems: "flex-start"}}
                        >
                            <span style={{color: scheme.text}}>Aa</span>
                        </div>
                        <figcaption>{scheme.ratio}</figcaption>
                    </figure>
                ))}
            </div>
        </BrandPage>
    );
}
