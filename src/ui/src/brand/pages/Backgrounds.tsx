import React from "react";

import {BrandSubsection} from "../BrandPage";
import {Mark} from "../Mark";

export default function BackgroundsSection() {
    return (
        <BrandSubsection id="logo-backgrounds" title="Backgrounds">
            <div
                className="kz-brand-grid"
                style={{"--min": "max(160px, calc((100% - 40px) / 3))"} as React.CSSProperties}
            >
                <figure className="kz-brand-tile">
                    <div className="kz-brand-bordered" style={{background: "var(--paper)"}}>
                        <Mark width={84} />
                    </div>
                    <figcaption>Paper</figcaption>
                </figure>
                <figure className="kz-brand-tile">
                    <div style={{background: "var(--ink)"}}>
                        <Mark width={84} tone="paper" />
                    </div>
                    <figcaption>Ink</figcaption>
                </figure>
                <figure className="kz-brand-tile">
                    <div style={{background: "var(--brand-charcoal)"}}>
                        <Mark width={84} tone="paper" />
                    </div>
                    <figcaption>Charcoal</figcaption>
                </figure>
                <figure className="kz-brand-tile">
                    <div className="kz-brand-bordered" style={{background: "var(--card)"}}>
                        <Mark width={84} strike="knockout" ground="#ffffff" />
                    </div>
                    <figcaption>One colour, ink</figcaption>
                </figure>
                <figure className="kz-brand-tile">
                    <div style={{background: "var(--ink)"}}>
                        <Mark width={84} tone="paper" strike="knockout" ground="#0d0d0d" />
                    </div>
                    <figcaption>One colour, paper</figcaption>
                </figure>
                <figure className="kz-brand-tile">
                    <div style={{background: "var(--lime)"}}>
                        <Mark width={84} strike="knockout" ground="#c4ff5e" />
                    </div>
                    <figcaption>Lime</figcaption>
                </figure>
            </div>
        </BrandSubsection>
    );
}
