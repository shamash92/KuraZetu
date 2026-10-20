import React from "react";

import {BrandPage} from "../BrandPage";

const SCALE = [
    {
        name: "Display",
        spec: "Public Sans 900 · 112 px · line 0.92",
        className: "kz-brand-scale-display",
        sample: "Kura Zetu",
    },
    {
        name: "Heading",
        spec: "Public Sans 900 · 62 px · line 1",
        className: "kz-brand-scale-heading",
        sample: "Results by station",
    },
    {
        name: "Subheading",
        spec: "Public Sans 800 · 21 px · line 1.15",
        className: "kz-brand-scale-subheading",
        sample: "Photograph the form",
    },
    {
        name: "Body",
        spec: "Public Sans 400 · 17 px · line 1.55",
        className: "kz-brand-scale-body",
        sample: "Volunteers record the results announced at their own polling station.",
    },
    {
        name: "Label",
        spec: "IBM Plex Mono 500 · 11 px · capitals, tracking 0.12em",
        className: "kz-brand-scale-label",
        sample: "Polling station 014",
    },
];

export default function TypePage() {
    return (
        <BrandPage title="Type">
            <div className="kz-brand-grid" style={{"--min": "320px"} as React.CSSProperties}>
                <div className="kz-brand-type">
                    <span>Aa</span>
                    <span>Public Sans</span>
                </div>
                <div className="kz-brand-type kz-brand-type-mono">
                    <span>01</span>
                    <span>IBM Plex Mono</span>
                </div>
            </div>
            <dl className="kz-brand-scale">
                {SCALE.map(({name, spec, className, sample}) => (
                    <div key={name}>
                        <dt>
                            <b>{name}</b>
                            <span>{spec}</span>
                        </dt>
                        <dd className={className}>{sample}</dd>
                    </div>
                ))}
            </dl>
        </BrandPage>
    );
}
