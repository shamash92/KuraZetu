import "../landing-pages/landing.css";
import "./apk-download.css";

import {AlertTriangle, Download, ExternalLink} from "lucide-react";

import {LandingFooter, LandingNav} from "../landing-pages";

type Release = {
    version: string;
    codeName: string;
    date: string;
    changes: Array<string>;
};

const releases: Array<Release> = [
    {
        version: "0.0.2",
        codeName: "Sanji",
        date: "2025-06-23",
        changes: [
            "Added biometric authentication for secure login",
            "New login and registration UI",
            "Notifications support",
            "Loading screens for smoother user experience",
            "Refactored verify stack under tabs for better navigation (header title bug fix)",
        ],
    },
    {
        version: "0.0.1",
        codeName: "Kamina",
        date: "2025-06-10",
        changes: [
            "User authentication and secure login flows",
            "Integrated Google Maps for polling station accuracy",
            "Push notifications with Expo",
            "Live results dashboard with improved visualizations",
            "Edit pin location feature added for flexibility",
        ],
    },
    {
        version: "0.0.0",
        codeName: "Mikasa",
        date: "2025-05-28",
        changes: [
            "Minor UI improvements",
            "Bug fixes around station registration",
            "Enhanced error messages during data entry",
        ],
    },
];

const installSteps = [
    "Enable “Install unknown apps” in Android settings",
    "Download the APK file",
    "Open the downloaded file and follow the prompts",
    "Launch KuraZetu and start verifying results",
];

const APK_SIZE = "136.0 MB";
const MIN_ANDROID = "Android 7.0+";
const BUG_REPORT_URL =
    "https://github.com/shamash92/KuraZetu/issues/new?title=bug%3A+TYPE+YOUR+ISSUE+HERE&body=*Please%20describe%20the%20bug%20or%20issue%20you%27re%20facing%20with%20%22Kura%20Zetu%20documentation%22.*%0A%0A%0A%0A%0A---%0A*Reported+from%3A+https://kurazetu.com/*";

function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    });
}

export default function APKDownloadPage() {
    const latest = releases[0];

    return (
        <main className="kz-landing kz-apk">
            <div className="kz-paper-bg" aria-hidden="true" />
            <LandingNav />

            <section className="kz-apk-hero">
                <div className="kz-apk-lead">
                    <h1>
                        KuraZetu for <span>Android</span>
                    </h1>
                    <p>
                        Collect and verify Kenyan election results from your own polling
                        station. Photograph the Form 34A, enter the figures, and check
                        what others submitted.
                    </p>
                    <a
                        className="kz-button kz-button-lime kz-button-large"
                        href={`https://kurazetu.s3.eu-west-1.amazonaws.com/static/builds/${latest.version}.apk`}
                    >
                        <Download size={17} aria-hidden="true" />
                        Download APK
                    </a>
                    <ul className="kz-apk-meta" aria-label="About this build">
                        <li>
                            v{latest.version} {latest.codeName}
                        </li>
                        <li>{APK_SIZE}</li>
                        <li>{MIN_ANDROID}</li>
                        <li>{formatDate(latest.date)}</li>
                    </ul>
                </div>

                <aside className="kz-apk-install" aria-labelledby="kz-apk-install-title">
                    <h2 id="kz-apk-install-title">Installation instructions</h2>
                    <ol>
                        {installSteps.map((step) => (
                            <li key={step}>{step}</li>
                        ))}
                    </ol>
                    <div className="kz-apk-beta">
                        <AlertTriangle size={18} aria-hidden="true" />
                        <div>
                            <strong>Beta testing notice</strong>
                            <p>
                                This is a <b>beta version</b> of the KuraZetu mobile
                                app. While stable for most users, it may still contain
                                bugs or incomplete features. Help us refine the platform
                                by reporting any issues you encounter.
                            </p>
                        </div>
                    </div>
                </aside>
            </section>

            <section className="kz-apk-releases">
                <h2>Release history</h2>
                <div className="kz-apk-release-list">
                    {releases.map((release, index) => (
                        <article key={release.version}>
                            <header>
                                <h3>
                                    v{release.version}
                                    {index === 0 && <span>Latest</span>}
                                </h3>
                                <p>{release.codeName}</p>
                                <time dateTime={release.date}>
                                    {formatDate(release.date)}
                                </time>
                            </header>
                            <ul>
                                {release.changes.map((change) => (
                                    <li key={change}>{change}</li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            </section>

            <section className="kz-apk-bug-wrap">
                <div className="kz-apk-bug">
                    <div>
                        <h2>Found a bug?</h2>
                        <p>Report issues and help us improve KuraZetu.</p>
                    </div>
                    <a href={BUG_REPORT_URL} target="_blank" rel="noreferrer">
                        Report issue <ExternalLink size={16} aria-hidden="true" />
                    </a>
                </div>
            </section>

            <LandingFooter />
        </main>
    );
}
