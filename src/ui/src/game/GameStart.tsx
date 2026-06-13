import {ArrowRight, Check, LogIn, MapPin} from "lucide-react";
import type {CSSProperties} from "react";

import {useAuth} from "../App";
import "../landing-pages/kenya-counties";
import "./game-start.css";

type TParamLevel = "random" | "ward" | "constituency" | "county";

interface GameStartProps {
    onStart: (level: TParamLevel) => void;
}

type County = {
    id: string;
    name: string;
    d: string;
    bb: [number, number, number, number];
};

type CountyData = {
    w: number;
    h: number;
    counties: County[];
};

declare global {
    interface Window {
        KENYA_COUNTIES?: CountyData;
    }
}

const VERIFIED_COUNTIES = new Set([
    "Nairobi",
    "Mombasa",
    "Kisumu",
    "Nakuru",
    "Uasin Gishu",
    "Garissa",
    "Nyeri",
    "Kakamega",
    "Kilifi",
]);

const STEPS = [
    {
        n: "01",
        title: "Search",
        text: "Find the school by name. Results stay biased to its ward.",
    },
    {
        n: "02",
        title: "Place",
        text: "Drop the pin inside the ward boundary where the center really sits.",
    },
    {
        n: "03",
        title: "Agree",
        text: "Three matching citizen pins verify the polling center.",
    },
];

const AREA_LEVELS: {level: TParamLevel; label: string}[] = [
    {level: "ward", label: "My ward"},
    {level: "constituency", label: "My constituency"},
    {level: "county", label: "My county"},
];

function PinVerifyAtlas() {
    const data = window.KENYA_COUNTIES;
    if (!data) return null;

    return (
        <div className="pv-atlas" aria-hidden="true">
            <div className="pv-atlas-label">
                <span>Community map</span>
                <strong>47 counties</strong>
            </div>
            <svg viewBox={`0 0 ${data.w} ${data.h}`} preserveAspectRatio="xMidYMid meet">
                {data.counties.map((county) => {
                    const verified = VERIFIED_COUNTIES.has(county.name);
                    return (
                        <path
                            className={`pv-county ${verified ? "is-verified" : ""}`}
                            d={county.d}
                            key={county.id}
                        />
                    );
                })}
                {data.counties
                    .filter((county) => VERIFIED_COUNTIES.has(county.name))
                    .map((county, index) => {
                        const [x, y, width, height] = county.bb;
                        const cx = x + width / 2;
                        const cy = y + height / 2;
                        return (
                            <g
                                className="pv-atlas-pin"
                                key={`${county.id}-pin`}
                                style={{"--pin-delay": `${index * 260}ms`} as CSSProperties}
                            >
                                <circle className="pv-atlas-ring" cx={cx} cy={cy} r="4" />
                                <circle className="pv-atlas-dot" cx={cx} cy={cy} r="3" />
                            </g>
                        );
                    })}
            </svg>
            <div className="pv-atlas-key">
                <span>Citizen-confirmed activity</span>
                <b>Pin locations become stronger through agreement.</b>
            </div>
        </div>
    );
}

export default function GameStart({onStart}: GameStartProps) {
    const auth = useAuth();

    return (
        <main className="pv-start">
            <PinVerifyAtlas />

            <header className="pv-topbar">
                <a className="pv-wordmark" href="/ui/">
                    <span><MapPin size={14} /></span>
                    PinVerify254
                </a>
                {auth ? (
                    <a className="pv-toplink" href="/ui/">
                        Back to KuraZetu
                    </a>
                ) : (
                    <a className="pv-toplink" href="/accounts/login/">
                        <LogIn size={14} />
                        Log in
                    </a>
                )}
            </header>

            <section className="pv-hero">
                <div className="pv-copy">
                    <h1>
                        Put every polling center on the map. <em>Together.</em>
                    </h1>
                    <p className="pv-lede">
                        Help establish a trustworthy public map of Kenya's polling
                        centers, one independent confirmation at a time.
                    </p>

                    <ol className="pv-steps">
                        {STEPS.map((step) => (
                            <li key={step.n}>
                                <span>{step.n}</span>
                                <p><strong>{step.title}</strong> {step.text}</p>
                            </li>
                        ))}
                    </ol>

                    <div className="pv-actions">
                        <button
                            className="pv-primary"
                            type="button"
                            onClick={() => onStart("random")}
                        >
                            Start with a random center
                            <ArrowRight size={18} />
                        </button>

                        {auth ? (
                            <div className="pv-area-choice">
                                <span>Or work close to home</span>
                                <div>
                                    {AREA_LEVELS.map(({level, label}) => (
                                        <button
                                            key={level}
                                            type="button"
                                            onClick={() => onStart(level)}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="pv-login-line">
                                <a href="/accounts/login/">Log in</a> to start with
                                centers in your own ward.
                            </p>
                        )}
                    </div>

                    <p className="pv-note">
                        <Check size={13} />
                        No rankings. No scores. Every contribution counts the same.
                    </p>
                </div>
            </section>
        </main>
    );
}
