import React from "react";

import {BrandPage} from "../BrandPage";

type Colour = {
    name: string;
    meaning: string;
    hex: string;
    rgb: string;
    cmyk: string;
    pantone: string;
    bordered?: boolean;
};

const COLOURS: ReadonlyArray<Colour> = [
    {
        name: "Ink",
        meaning: "Text, figures and the bars of the mark.",
        hex: "0D0D0D",
        rgb: "13 / 13 / 13",
        cmyk: "60 / 40 / 40 / 100",
        pantone: "Black 6 C",
    },
    {
        name: "Paper",
        meaning: "Backgrounds. Use this off-white, not pure white.",
        hex: "F7F6F3",
        rgb: "247 / 246 / 243",
        cmyk: "0 / 0 / 2 / 3",
        pantone: "≈ 11-0602 TCX",
        bordered: true,
    },
    {
        name: "Lime",
        meaning: "The strike in the mark, and the main button on a screen.",
        hex: "C4FF5E",
        rgb: "196 / 255 / 94",
        cmyk: "23 / 0 / 63 / 0",
        pantone: "≈ 374 C",
    },
    {
        name: "Red",
        meaning: "The full stop in the wordmark only.",
        hex: "C44539",
        rgb: "196 / 69 / 57",
        cmyk: "0 / 65 / 71 / 23",
        pantone: "≈ 7626 C",
    },
];

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
