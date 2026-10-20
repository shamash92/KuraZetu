import React from "react";

import {Mark} from "../Mark";
import BackgroundsSection from "./Backgrounds";
import ClearSpaceSection from "./ClearSpace";
import ConstructionSection from "./Construction";

export default function LogoPage() {
    return (
        <>
            <section className="kz-brand-section kz-brand-hero" aria-labelledby="mark-title">
                <div className="kz-brand-hero-art">
                    <Mark width={280} tone="paper" label="KuraZetu mark" />
                </div>
                <div style={{display: "flex", flexDirection: "column", gap: 18}}>
                    <h1
                        id="mark-title"
                        style={{
                            margin: 0,
                            fontSize: "clamp(40px, 4.6vw, 60px)",
                            fontWeight: 900,
                            lineHeight: 0.94,
                            letterSpacing: "-0.045em",
                        }}
                    >
                        Logo
                    </h1>
                    <p className="kz-brand-lede">
                        The logo symbolises counting.
                    </p>
                    <p className="kz-brand-lede">
                        Kura Zetu: <b style={{color: "var(--ink)"}}>our votes</b>.
                    </p>
                </div>
            </section>
            <ConstructionSection />
            <ClearSpaceSection />
            <BackgroundsSection />
        </>
    );
}
