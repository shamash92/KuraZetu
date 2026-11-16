import React from "react";

import {BrandPage} from "../BrandPage";

import {BRAND_COLOURS as COLOURS} from "@/src/@/components/ui/brand-colours";

export default function ColourPage() {
    return (
        <BrandPage title="Colour">
            <div className="kz-brand-ratio" role="img" aria-label="Paper 60, ink 30, lime 8, red 2">
                <div style={{flex: 60, background: "var(--paper)"}}>60</div>
                <div style={{flex: 30, background: "var(--ink)", color: "var(--paper)"}}>30</div>
                <div style={{flex: 8, background: "var(--lime)", padding: "20px 10px"}}>8</div>
                <div style={{flex: 2, background: "var(--red)", padding: 0}} />
            </div>
            <div className="kz-brand-grid" style={{"--min": "220px"} as React.CSSProperties}>
                {COLOURS.map((colour) => (
                    <div key={colour.name} className="kz-brand-tile kz-brand-colour">
                        <div
                            className={`kz-brand-swatch${colour.bordered ? " kz-brand-bordered" : ""}`}
                            style={{background: `#${colour.hex}`}}
                        />
                        <h3>{colour.name}</h3>
                        <p>{colour.meaning}</p>
                        <dl className="kz-brand-codes">
                            <dt>HEX</dt>
                            <dd>{colour.hex}</dd>
                            <dt>RGB</dt>
                            <dd>{colour.rgb}</dd>
                            <dt>CMYK</dt>
                            <dd>{colour.cmyk}</dd>
                            <dt>Pantone</dt>
                            <dd>{colour.pantone}</dd>
                        </dl>
                    </div>
                ))}
            </div>
        </BrandPage>
    );
}
