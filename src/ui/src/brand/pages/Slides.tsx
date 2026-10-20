import React from "react";

import {BrandPage} from "../BrandPage";
import {Mark} from "../Mark";

const MARK_STYLE: React.CSSProperties = {width: "8cqi", height: "auto"};
const CORNER_MARK_STYLE: React.CSSProperties = {
    position: "absolute",
    top: "6cqi",
    right: "6cqi",
    width: "5cqi",
    height: "auto",
};

/** Stand-in for a photo: a Form 34A sheet lying on a table. */
function FormSketch() {
    return (
        <svg
            className="kz-slide-image"
            viewBox="0 0 160 90"
            preserveAspectRatio="xMidYMid slice"
            role="img"
            aria-label="Photo placeholder: a results form on a table"
        >
            <rect width="160" height="90" fill="#2b2a28" />
            <g transform="rotate(-6 80 45)">
                <rect x="48" y="6" width="64" height="82" fill="#f4f2ec" />
                <rect x="54" y="12" width="52" height="6" fill="#d9d6cc" />
                {[24, 30, 36, 42, 48, 54, 60, 66].map((y) => (
                    <g key={y}>
                        <rect x="54" y={y} width="30" height="2" fill="#c9c5b9" />
                        <rect x="90" y={y} width="16" height="2" fill="#8d8a80" />
                    </g>
                ))}
                <circle cx="94" cy="78" r="6" fill="none" stroke="#c44539" strokeWidth="1.2" />
            </g>
        </svg>
    );
}

const HOURLY_FORMS = [
    ["17:00", 4],
    ["18:00", 18],
    ["19:00", 46],
    ["20:00", 88],
    ["21:00", 100],
    ["22:00", 72],
    ["23:00", 41],
    ["00:00", 22],
    ["01:00", 9],
] as const;

const PEAK = Math.max(...HOURLY_FORMS.map(([, count]) => count));

function Slide({
    caption,
    className,
    mark,
    children,
}: {
    caption: string;
    className: string;
    /** Puts the small mark in the top-right corner, in this tone. */
    mark?: "ink" | "paper";
    children: React.ReactNode;
}) {
    return (
        <figure>
            <div className={`kz-brand-slide ${className}`}>
                {children}
                {mark && (
                    <Mark
                        width={24}
                        tone={mark}
                        strike={mark === "ink" ? "deep" : "lime"}
                        style={CORNER_MARK_STYLE}
                    />
                )}
            </div>
            <figcaption>{caption}</figcaption>
        </figure>
    );
}

export default function SlidesPage() {
    return (
        <BrandPage title="Slides">
            <div className="kz-brand-slides">
                <Slide caption="Title" className="kz-slide-paper">
                    <Mark width={40} strike="deep" style={MARK_STYLE} />
                    <h3 className="kz-slide-h1">Agent training</h3>
                </Slide>

                <Slide caption="Section" className="kz-slide-ink kz-slide-section" mark="paper">
                    <span className="kz-slide-number">02</span>
                    <h3 className="kz-slide-h2">Photographing the form</h3>
                </Slide>

                <Slide
                    caption="Heading and text"
                    className="kz-slide-paper kz-slide-top"
                    mark="ink"
                >
                    <h3 className="kz-slide-h2">Why we photograph every form</h3>
                    <p className="kz-slide-text">
                        The signed Form 34A is the result at the polling station. A clear photo
                        taken before the form leaves the room lets anyone check the published count
                        against the paper.
                    </p>
                </Slide>

                <Slide caption="List" className="kz-slide-paper kz-slide-top" mark="ink">
                    <h3 className="kz-slide-h2">Before you leave the station</h3>
                    <ol className="kz-slide-list">
                        <li>Lay the form flat on a table</li>
                        <li>Fit all four corners in the frame</li>
                        <li>Check the stamp and signatures are readable</li>
                        <li>Upload, then wait for the green tick</li>
                    </ol>
                </Slide>

                <Slide
                    caption="Image and text"
                    className="kz-slide-paper kz-slide-split"
                    mark="ink"
                >
                    <FormSketch />
                    <div>
                        <h3 className="kz-slide-h2">Fill the frame</h3>
                        <p className="kz-slide-text">
                            Hold the phone above the form, not at an angle. Shadows and fingers over
                            the figures make a photo unusable.
                        </p>
                    </div>
                </Slide>

                <Slide caption="Full image" className="kz-slide-full" mark="paper">
                    <FormSketch />
                    <p className="kz-slide-overlay">
                        A complete photo: four corners, stamp, every row.
                    </p>
                </Slide>

                <Slide
                    caption="Chart, full screen"
                    className="kz-slide-ink kz-slide-top"
                    mark="paper"
                >
                    <h3 className="kz-slide-h2">Forms received by hour</h3>
                    <div
                        className="kz-slide-bars"
                        role="img"
                        aria-label="Bar chart of forms received each hour, peaking at 21:00"
                    >
                        {HOURLY_FORMS.map(([hour, count]) => (
                            <div key={hour}>
                                <span
                                    style={{height: `${(count / PEAK) * 100}%`}}
                                    data-peak={count === PEAK || undefined}
                                />
                                <small>{hour}</small>
                            </div>
                        ))}
                    </div>
                </Slide>
            </div>
        </BrandPage>
    );
}
