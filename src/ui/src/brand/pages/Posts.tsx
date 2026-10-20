import React from "react";

import {BrandPage} from "../BrandPage";
import {Lockup, Mark} from "../Mark";

export default function PostsPage() {
    return (
        <BrandPage title="Posts">
            <div className="kz-brand-grid">
                <div className="kz-brand-card kz-brand-bordered" style={{background: "var(--paper)"}}>
                    <Mark width={44} strike="deep" />
                    <strong>
                        Results from every
                        <br />
                        polling station
                    </strong>
                    <small>kurazetu.com</small>
                </div>
                <div
                    className="kz-brand-card"
                    style={{"--ratio": "4 / 5", background: "var(--ink)", color: "var(--paper)"} as React.CSSProperties}
                >
                    <Mark width={44} tone="paper" />
                    <strong>Volunteer training</strong>
                    <small style={{color: "var(--lime)"}}>[DATE]</small>
                </div>
                <div className="kz-brand-card" style={{background: "var(--lime)"}}>
                    <strong>
                        Become a
                        <br />
                        volunteer agent
                    </strong>
                    <small>kurazetu.com</small>
                </div>
            </div>
            <div className="kz-brand-banner">
                <Lockup width={260} tone="paper" />
                <svg viewBox="80 124 352 280" aria-hidden="true">
                    {[136, 228, 320].map((x) => (
                        <rect key={x} x={x} y="152" width="56" height="224" rx="28" fill="#1f1f1f" />
                    ))}
                    <path
                        d="M108 376 L404 152"
                        stroke="#c4ff5e"
                        strokeWidth="56"
                        strokeLinecap="round"
                        fill="none"
                    />
                </svg>
            </div>
        </BrandPage>
    );
}
