import {
    AlertTriangle,
    ArrowRight,
    Camera,
    Check,
    Clock3,
    Eye,
    Github,
    Home,
    List,
    MapPin,
    Menu,
    Navigation,
    Send,
    ShieldCheck,
    Smartphone,
    User,
    UserRound,
    Users,
    Vote,
    X,
} from "lucide-react";
import {useEffect, useRef, useState} from "react";

import ResultsDashboard from "../dashboards/results";
import {useAuth} from "../App";
import "./kenya-counties";
import "./perk-mesh";
import "./landing.css";

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
        initPerkFooterGrid?: () => void;
    }
}

const comparisonRows = [
    {
        aspect: "Purpose",
        is: "A citizen-driven platform to increase transparency and accountability.",
        isNot: "Not a system to legally challenge election results.",
    },
    {
        aspect: "Nature",
        is: "An open-source system built for collaboration.",
        isNot: "Not an official government or IEBC system.",
    },
    {
        aspect: "Approach",
        is: "A tool for civic empowerment, not political affiliation.",
        isNot: "Not a partisan or politically affiliated project.",
    },
    {
        aspect: "Function",
        is: "A platform for education, participation, and digital oversight.",
        isNot: "Not a means to announce or declare election results.",
    },
    {
        aspect: "Role",
        is: "A supplementary tool for civic engagement and transparency.",
        isNot: "Not a replacement for legal electoral processes.",
    },
];

const steps = [
    {
        title: "Pin your station",
        copy: "Confirm where your polling station physically is, with GPS plus community consensus.",
        icon: Navigation,
    },
    {
        title: "Photograph the Form 34A",
        copy: "Capture both pages with the in-app camera. We check focus and brightness for you.",
        icon: Camera,
    },
    {
        title: "Confirm the numbers",
        copy: "OCR reads the tallies. You correct any digits before publishing.",
        icon: Check,
    },
    {
        title: "Submit and share",
        copy: "Your tally is published with a hash you can prove later. Everyone sees it.",
        icon: Send,
    },
];

const trustItems = [
    ["Open source", "All code on GitHub. All bugs in the open."],
    [
        "Hashed receipts",
        "Every submission gets a sha256 hash. Tampered numbers fail the check.",
    ],
    [
        "Community verified",
        "Two independent submissions per station before a number rolls up.",
    ],
    ["Independent audit", "Audits can be performed by Kenyan civil-society partners."],
    ["No partisan ties", "MIT licensed, with no party affiliation."],
];

function Brand() {
    return (
        <a className="kz-brand" href="/ui/" aria-label="KuraZetu home">
            <span className="kz-brand-name">KuraZetu</span>
            <span className="kz-brand-tag">Powered by Kiongozi</span>
        </a>
    );
}

function AtlasBackground() {
    const svgRef = useRef<SVGSVGElement>(null);
    const [caption, setCaption] = useState<County | null>(null);

    useEffect(() => {
        const data = window.KENYA_COUNTIES;
        const svg = svgRef.current;
        if (!data || !svg) return;

        let frame = 0;
        let tourTimer = 0;
        let captionTimer = 0;
        let stopped = false;
        const paths = Array.from(
            svg.querySelectorAll<SVGPathElement>(".kz-atlas-county"),
        );
        const centerX = data.w / 2;
        const centerY = data.h / 2;
        const maxDistance = Math.hypot(data.w, data.h) / 2;

        paths.forEach((path, index) => {
            const county = data.counties[index];
            const length = path.getTotalLength();
            const [x, y, width, height] = county.bb;
            const distance = Math.hypot(
                x + width / 2 - centerX,
                y + height / 2 - centerY,
            );
            path.style.setProperty("--len", length.toFixed(0));
            path.style.setProperty(
                "--delay",
                `${(180 + (distance / maxDistance) * 1000).toFixed(0)}ms`,
            );
        });

        requestAnimationFrame(() => svg.classList.add("is-drawn"));

        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        if (reducedMotion) return;

        const shuffled = data.counties
            .map((_, index) => index)
            .sort(() => Math.random() - 0.5);
        let cursor = 0;

        const tween = (target: number[], duration: number) => {
            cancelAnimationFrame(frame);
            const from = (svg.getAttribute("viewBox") || `0 0 ${data.w} ${data.h}`)
                .split(/\s+/)
                .map(Number);
            const start = performance.now();
            const tick = (now: number) => {
                if (stopped) return;
                const progress = Math.min(1, (now - start) / duration);
                const eased =
                    progress < 0.5
                        ? 2 * progress * progress
                        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                svg.setAttribute(
                    "viewBox",
                    from
                        .map((value, index) => value + (target[index] - value) * eased)
                        .join(" "),
                );
                if (progress < 1) frame = requestAnimationFrame(tick);
            };
            frame = requestAnimationFrame(tick);
        };

        const focusNext = () => {
            const index = shuffled[cursor % shuffled.length];
            const county = data.counties[index];
            paths.forEach((path, pathIndex) => {
                path.classList.toggle("is-focus", pathIndex === index);
                path.classList.toggle("is-dim", pathIndex !== index);
            });

            setCaption(null);
            captionTimer = window.setTimeout(() => setCaption(county), 260);

            const [x, y, width, height] = county.bb;
            const rect = svg.getBoundingClientRect();
            const aspect =
                rect.width && rect.height ? rect.width / rect.height : data.w / data.h;
            let viewWidth = Math.max(width * 1.95, 78);
            let viewHeight = Math.max(height * 1.95, 78);
            if (viewWidth / viewHeight < aspect) viewWidth = viewHeight * aspect;
            else viewHeight = viewWidth / aspect;
            const panLeft = cursor % 2 === 0;
            const anchorX = panLeft
                ? 0.12 + Math.random() * 0.08
                : 0.8 + Math.random() * 0.08;
            const anchorY = 0.38 + Math.random() * 0.3;
            tween(
                [
                    x + width / 2 - anchorX * viewWidth,
                    y + height / 2 - anchorY * viewHeight,
                    viewWidth,
                    viewHeight,
                ],
                1800,
            );

            cursor += 1;
            tourTimer = window.setTimeout(focusNext, 3700);
        };

        tourTimer = window.setTimeout(focusNext, 650);

        return () => {
            stopped = true;
            cancelAnimationFrame(frame);
            window.clearTimeout(tourTimer);
            window.clearTimeout(captionTimer);
        };
    }, []);

    const data = window.KENYA_COUNTIES;
    if (!data) return null;

    return (
        <div className="kz-atlas-layer" aria-hidden="true">
            <svg
                ref={svgRef}
                viewBox={`0 0 ${data.w} ${data.h}`}
                preserveAspectRatio="xMidYMid meet"
            >
                {data.counties.map((county) => (
                    <path className="kz-atlas-county" d={county.d} key={county.id} />
                ))}
            </svg>
            <div className={`kz-atlas-caption ${caption ? "is-visible" : ""}`}>
                <strong>{caption?.name}</strong>
                <span>{caption ? `Kenya county atlas · ${caption.id}` : ""}</span>
            </div>
        </div>
    );
}

export function LandingNav() {
    const [open, setOpen] = useState(false);
    const isAuthenticated = useAuth();

    return (
        <>
            <div className="kz-disclaimer">
                <span>Citizen tally · Not an IEBC system</span>
                <span>Open source · MIT · github.com/shamash92/kurazetu</span>
            </div>
            <header className="kz-topbar">
                <Brand />
                <nav className="kz-nav-links" aria-label="Main navigation">
                    <a href="/ui/game/">pinVerify254</a>
                    <a
                        href="https://github.com/shamash92/KuraZetu.git"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Contribute
                    </a>
                    <a
                        href="https://kurazetu.readthedocs.io/"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Docs
                    </a>
                    <a href="/blog/">Blog</a>
                    <a href="/api/schema/rapidoc/">API</a>
                </nav>
                <div className="kz-nav-actions">
                    {isAuthenticated ? (
                        <a className="kz-button" href="/accounts/logout/">
                            Log out
                        </a>
                    ) : (
                        <>
                            <a className="kz-button" href="/accounts/login/">
                                Sign in
                            </a>
                            <a className="kz-button kz-button-lime" href="/ui/signup/">
                                Get started <ArrowRight size={15} />
                            </a>
                        </>
                    )}
                </div>
                <button
                    className="kz-menu-button"
                    type="button"
                    aria-label={open ? "Close navigation" : "Open navigation"}
                    aria-expanded={open}
                    onClick={() => setOpen((value) => !value)}
                >
                    {open ? <X size={22} /> : <Menu size={22} />}
                </button>
                {open && (
                    <nav className="kz-mobile-nav" aria-label="Mobile navigation">
                        <a href="/ui/game/">pinVerify254</a>
                        <a href="https://github.com/shamash92/KuraZetu.git">
                            Contribute
                        </a>
                        <a href="https://kurazetu.readthedocs.io/">Docs</a>
                        <a href="/blog/">Blog</a>
                        <a href="/api/schema/rapidoc/">API</a>
                        {isAuthenticated ? (
                            <a href="/accounts/logout/">Log out</a>
                        ) : (
                            <>
                                <a href="/accounts/login/">Sign in</a>
                                <a className="kz-button-lime" href="/ui/signup/">
                                    Get started
                                </a>
                            </>
                        )}
                    </nav>
                )}
            </header>
        </>
    );
}

function PhoneStage() {
    const phoneTiles = [
        ["Presidential", Vote],
        ["Governor", Users],
        ["MP", UserRound],
        ["MCA", Eye],
    ] as const;

    return (
        <section className="kz-stage" aria-label="KuraZetu app preview">
            <div className="kz-stage-inner">
                <div className="kz-float kz-float-constituency">
                    <div className="kz-float-icon">
                        <ShieldCheck size={21} />
                    </div>
                    <div>
                        <strong>Westlands</strong>
                        <span>62 / 78 stations · 6 verifiers</span>
                    </div>
                </div>
                <div className="kz-float kz-float-live">
                    <Clock3 size={14} /> Tallying live
                </div>
                <div className="kz-float kz-float-county">
                    <strong>Nairobi County</strong>
                    <span>Presidential · 93% tallied</span>
                    <span>Governor · 85% tallied</span>
                    <span>Senate · 90% tallied</span>
                </div>
                <div className="kz-float kz-float-verified">
                    <Check size={14} />
                    Verified by 2 citizens
                </div>

                <div className="kz-phone">
                    <div className="kz-phone-screen">
                        <div className="kz-phone-notch" />
                        <div className="kz-status">
                            <span>9:41</span>
                            <span>5G&nbsp;&nbsp; 82%</span>
                        </div>
                        <div className="kz-screen-body">
                            <div className="kz-greeting">
                                <h3>Hello, Wanjiku</h3>
                                <p>Check your constituency results.</p>
                            </div>
                            <div className="kz-tile-grid">
                                {phoneTiles.map(([label, Icon], index) => (
                                    <div
                                        className={`kz-phone-tile kz-phone-tile-${index + 1}`}
                                        key={label}
                                    >
                                        <span>
                                            <Icon size={19} />
                                        </span>
                                        <strong>{label}</strong>
                                    </div>
                                ))}
                            </div>
                            <div className="kz-screen-label">Your constituency</div>
                            <div className="kz-result-row">
                                <div>
                                    <strong>Westlands</strong>
                                    <span>62 / 78 stations · 6 verifiers</span>
                                </div>
                                <b>79%</b>
                            </div>
                            <div className="kz-result-row">
                                <div>
                                    <strong>Dagoretti N.</strong>
                                    <span>41 / 68 stations · 4 verifiers</span>
                                </div>
                                <b>60%</b>
                            </div>
                        </div>
                        <div className="kz-tabbar">
                            <span className="is-active">
                                <i>
                                    <Home size={14} />
                                </i>
                                Home
                            </span>
                            <span>
                                <i>
                                    <List size={14} />
                                </i>
                                Results
                            </span>
                            <span>
                                <i>
                                    <MapPin size={14} />
                                </i>
                                Map
                            </span>
                            <span>
                                <i>
                                    <User size={14} />
                                </i>
                                Me
                            </span>
                        </div>
                    </div>
                </div>

                <div className="kz-float kz-float-tally">
                    <span>Presidential tally</span>
                    <strong>93% counted</strong>
                    <small>National average · refreshed 30s ago</small>
                    <a href="/accounts/login/">
                        View full report <ArrowRight size={14} />
                    </a>
                </div>
                <div className="kz-float kz-float-alert">
                    <i>
                        <AlertTriangle size={18} />
                    </i>
                    <div>
                        <strong>Alert</strong>
                        <span>Discrepancy at Station 114B</span>
                    </div>
                </div>
                <div className="kz-float kz-float-user">
                    <i>AN</i>
                    <div>
                        <strong>Achieng N.</strong>
                        <span>Verifier · Kisumu Central</span>
                    </div>
                </div>
            </div>
        </section>
    );
}

function LandingFooter() {
    return (
        <footer className="kz-footer">
            <div className="kz-footer-inner">
                <div className="kz-foot-grid">
                    <div>
                        <Brand />
                        <p>
                            A non-partisan, open-source citizen-tech project. Powered by
                            Kiongozi. Built in Nairobi.
                        </p>
                    </div>
                    <div>
                        <strong>Product</strong>
                        <a href="/accounts/login/">Live results</a>
                        <a href="/ui/game/">PinVerify</a>
                        <a href="/ui/download-apk/">Get the app</a>
                    </div>
                    <div>
                        <strong>Project</strong>
                        <a href="https://github.com/shamash92/KuraZetu.git">GitHub</a>
                        <a href="https://kurazetu.readthedocs.io/">Documentation</a>
                        <a href="/api/schema/swagger/">Public API</a>
                    </div>
                    <div>
                        <strong>Account</strong>
                        <a href="/accounts/login/">Sign in</a>
                        <a href="/ui/signup/">Register</a>
                    </div>
                </div>
                <div className="kz-foot-bottom">
                    <span>
                        © 2026 Kura Zetu · MIT licensed · Not affiliated with IEBC
                    </span>
                    <span>
                        Built in Nairobi · Designed for elections, not against them.
                    </span>
                </div>
            </div>
        </footer>
    );
}

function PublicLanding() {
    useEffect(() => {
        window.initPerkFooterGrid?.();
    }, []);

    return (
        <main className="kz-landing">
            <div className="kz-paper-bg" aria-hidden="true" />
            <AtlasBackground />
            <LandingNav />

            <section className="kz-hero">
                <h1>
                    Election results,
                    <br />
                    uploaded by <span>you</span>.
                </h1>
                <p>
                    You photograph the Form 34A at your polling station. We aggregate
                    and verify. Anyone, anywhere, sees the count as it happens.
                </p>
                <div className="kz-hero-actions">
                    <a
                        className="kz-button kz-button-ink kz-button-large"
                        href="/accounts/login/"
                    >
                        See live results <ArrowRight size={16} />
                    </a>
                    <a
                        className="kz-button kz-button-large"
                        href="https://kurazetu.readthedocs.io/"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Read the docs
                    </a>
                </div>
                <div className="kz-pill-row">
                    <a
                        className="kz-pill kz-pill-ink"
                        href="https://github.com/shamash92/KuraZetu.git"
                    >
                        <Github size={14} />
                        Contribute
                    </a>
                    <a className="kz-pill kz-pill-mint" href="/ui/download-apk/">
                        <Smartphone size={14} />
                        Android
                    </a>
                    <span className="kz-pill kz-pill-blue">
                        <Smartphone size={14} />
                        iOS coming soon
                    </span>
                    <a className="kz-pill kz-pill-coral" href="/ui/game/">
                        <MapPin size={14} />
                        PinVerify254
                    </a>
                </div>
            </section>

            <PhoneStage />

            <section className="kz-trust-strip">
                <span>Built for public, verifiable participation</span>
                <div>
                    <b>Open source</b>
                    <b>Polling-station level</b>
                    <b>Community verified</b>
                    <b>Public API</b>
                </div>
            </section>

            <section className="kz-compare" id="about">
                <div className="kz-section-heading kz-section-heading-centered">
                    <span>Read this first</span>
                    <h2>
                        What KuraZetu is. And just as importantly, what it is{" "}
                        <em>not</em>.
                    </h2>
                    <p>
                        We are not the IEBC, a political party, or legal authority. We
                        are a parallel record built by citizens, for citizens.
                    </p>
                </div>
                <div className="kz-compare-table">
                    <div className="kz-compare-head">
                        <b>Aspect</b>
                        <b>What it is</b>
                        <b>What it is not</b>
                    </div>
                    {comparisonRows.map((row) => (
                        <div className="kz-compare-row" key={row.aspect}>
                            <strong>{row.aspect}</strong>
                            <p>
                                <i className="is-yes">
                                    <Check size={13} />
                                </i>
                                {row.is}
                            </p>
                            <p>
                                <i className="is-no">
                                    <X size={13} />
                                </i>
                                {row.isNot}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="kz-how">
                <div className="kz-section-heading">
                    <span>How it works</span>
                    <h2>
                        From the paper on the wall to the public dashboard, in four
                        steps.
                    </h2>
                </div>
                <div className="kz-steps">
                    {steps.map(({title, copy, icon: Icon}, index) => (
                        <article key={title}>
                            <span>0{index + 1}</span>
                            <i>
                                <Icon size={22} />
                            </i>
                            <h3>{title}</h3>
                            <p>{copy}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="kz-why">
                <div>
                    <span className="kz-eyebrow">Why trust it</span>
                    <h2>
                        Every number has a <b>Form 34A</b> behind it. Every form has a{" "}
                        <b>community verifier</b> behind it.
                    </h2>
                </div>
                <div className="kz-why-list">
                    {trustItems.map(([title, copy]) => (
                        <div key={title}>
                            <strong>{title}</strong>
                            <p>{copy}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="kz-cta-wrap">
                <div className="kz-cta">
                    <div>
                        <span>Get involved</span>
                        <h2>
                            Your phone.
                            <br />
                            Your polling station.
                            <br />
                            Your verified Form 34A.
                        </h2>
                        <p>
                            Sign up with your phone number. No password, email, or
                            public name required.
                        </p>
                    </div>
                    <div>
                        <a href="/ui/download-apk/">
                            Download for Android <ArrowRight size={16} />
                        </a>
                        <a className="is-ghost" href="/ui/signup/">
                            Create an account <ArrowRight size={16} />
                        </a>
                        <a className="is-text" href="/accounts/login/">
                            Just browse the results
                        </a>
                    </div>
                </div>
            </section>

            <LandingFooter />
        </main>
    );
}

function LandingPage() {
    const isAuthenticated = useAuth();

    if (isAuthenticated) {
        return (
            <div className="flex flex-col w-full">
                <LandingNav />
                <ResultsDashboard />
                <LandingFooter />
            </div>
        );
    }

    return <PublicLanding />;
}

export default LandingPage;
