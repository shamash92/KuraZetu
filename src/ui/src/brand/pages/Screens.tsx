import React from "react";

import {BrandPage} from "../BrandPage";
import {Lockup, Mark} from "../Mark";

export default function ScreensPage() {
    return (
        <BrandPage title="Screens">
            <div className="kz-brand-grid" style={{"--min": "180px"} as React.CSSProperties}>
                <figure className="kz-brand-tile">
                    <div className="kz-brand-bordered" style={{background: "var(--card)"}}>
                        <Mark width={80} strike="deep" />
                    </div>
                    <figcaption>App icon · 62%</figcaption>
                </figure>
                <figure className="kz-brand-tile">
                    <div className="kz-brand-bordered" style={{background: "var(--card)"}}>
                        <div
                            style={{
                                display: "grid",
                                placeItems: "center",
                                width: 120,
                                height: 120,
                                borderRadius: "50%",
                                background: "var(--ink)",
                            }}
                        >
                            <Mark width={67} tone="paper" compact />
                        </div>
                    </div>
                    <figcaption>Avatar · 56%</figcaption>
                </figure>
                <figure className="kz-brand-tile">
                    <div style={{background: "var(--ink)"}}>
                        <Mark width={64} tone="paper" />
                    </div>
                    <figcaption>Splash · 96 px</figcaption>
                </figure>
                <figure className="kz-brand-tile">
                    <div className="kz-brand-bordered" style={{background: "var(--card)"}}>
                        <Lockup width={125} strike="deep" />
                    </div>
                    <figcaption>Nav · 28 px high</figcaption>
                </figure>
            </div>
        </BrandPage>
    );
}
