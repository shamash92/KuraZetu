// import {
//     AlertTriangle,
//     Badge,
//     Bug,
//     ChevronDown,
//     ChevronUp,
//     Clock,
//     Download,
//     ExternalLink,
//     Shield,
//     Smartphone,
// } from "lucide-react";
// import React, {useState} from "react";

// import {Helmet} from "react-helmet-async";
// import NavComponent from "../landing-pages/nav";

// export default function APKDownloadPage() {
//     const [changelogExpanded, setChangelogExpanded] = useState(false);

//     const changelog = [
//         {
//             version: "0.0.2",
//             codeName: "Sanji",
//             date: "2025-06-23",
//             changes: [
//                 "Added biometric authentication for secure login",
//                 "New login and registration UI",
//                 "Notifications support",
//                 "Loading screens for smoother user experience",
//                 "Refactored verify stack under tabs for better navigation (header title bug fix)",
//             ],
//         },
//         {
//             version: "0.0.1",
//             codeName: "Kamina",
//             date: "2025-06-10",
//             changes: [
//                 "User authentication and secure login flows",
//                 "Integrated Google Maps for polling station accuracy",
//                 "Push notifications with Expo",
//                 "Live results dashboard with improved visualizations",
//                 "Edit pin location feature added for flexibility",
//             ],
//         },
//         {
//             version: "0.0.0",
//             date: "2025-05-28",
//             codeName: "Mikasa",
//             changes: [
//                 "Minor UI improvements",
//                 "Bug fixes around station registration",
//                 "Enhanced error messages during data entry",
//             ],
//         },
//     ];

//     return (
//         <div className="w-full min-h-screen text-gray-900 bg-white">
//             <NavComponent />
//             <Helmet>
//                 <title>KuraZetu App APK Download | Beta for Android</title>
//                 <meta
//                     name="description"
//                     content="Download the latest beta APK of KuraZetu, a civic tech tool for collecting and verifying Kenyan election results. Stay informed. Stay empowered."
//                 />
//                 <meta property="og:title" content="KuraZetu App APK Download" />
//                 <meta
//                     property="og:description"
//                     content="Download the latest beta APK of KuraZetu, a civic tech tool for collecting and verifying Kenyan election results."
//                 />
//                 <meta property="og:type" content="website" />
//                 <meta
//                     property="og:url"
//                     content="https://kurazetu.com/ui/download-apk/"
//                 />
//                 {/* <meta property="og:image" content="https://kurazetu.com/og-image.png" /> */}
//                 <meta name="twitter:card" content="summary_large_image" />
//                 <meta name="twitter:title" content="KuraZetu App APK Download" />
//                 <meta
//                     name="twitter:description"
//                     content="Download the latest beta APK of KuraZetu, a civic tech tool for collecting and verifying Kenyan election results."
//                 />
//                 {/* <meta
//                     name="twitter:image"
//                     content="https://kurazetu.com/og-image.png"
//                 /> */}
//             </Helmet>

//             <div className="container max-w-4xl px-4 py-8 mx-auto">
//                 {/* Header */}
//                 <div className="mb-12 text-center">
//                     <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-green-600 shadow-lg rounded-2xl">
//                         <Smartphone className="w-10 h-10 text-white" />
//                     </div>
//                     <h1 className="mb-4 text-4xl font-bold text-green-700 md:text-6xl">
//                         KuraZetu App
//                     </h1>
//                     <p className="max-w-2xl mx-auto text-xl leading-relaxed text-gray-600">
//                         A civic tech tool for collecting and verifying Kenyan election
//                         results. Stay informed. Stay empowered.
//                     </p>
//                 </div>

//                 {/* Download Section */}

//                 <div className="p-8 mb-8 border border-green-100 shadow-lg rounded-2xl bg-gradient-to-br from-green-50 via-white to-green-100">
//                     <div className="flex flex-col items-center gap-4 md:flex-row md:items-start md:gap-8">
//                         <div className="flex items-center justify-center w-16 h-16 mb-4 bg-green-600 shadow-md rounded-xl md:mb-0">
//                             <Download className="w-8 h-8 text-white" />
//                         </div>
//                         <div className="flex-1 text-center md:text-left">
//                             <h2 className="mb-2 text-2xl font-extrabold text-green-800">
//                                 Download Latest Beta
//                             </h2>
//                             <div className="mb-3 text-sm font-semibold text-green-700">
//                                 Version v{changelog[0].version}{" "}
//                                 <span className="mx-2 text-xs text-green-900 bg-green-200 rounded px-2 py-0.5">
//                                     {changelog[0].codeName}
//                                 </span>
//                             </div>
//                             <a
//                                 href={`https://kurazetu.s3.eu-west-1.amazonaws.com/static/builds/${changelog[0].version}.apk`}
//                                 className="inline-flex items-center gap-2 px-6 py-3 mb-3 text-base font-semibold text-white transition bg-green-600 rounded-lg shadow hover:bg-green-700"
//                             >
//                                 <Download className="w-5 h-5" />
//                                 Download APK
//                                 <span className="ml-2 text-xs font-normal text-green-100">
//                                     (136.0 MB)
//                                 </span>
//                             </a>
//                             <div className="flex flex-wrap items-center justify-center gap-2 mt-2 text-xs text-gray-600 md:justify-start">
//                                 <span className="flex items-center gap-1">
//                                     <Smartphone className="w-4 h-4" />
//                                     Android 7.0+
//                                 </span>
//                                 <span className="hidden md:inline">•</span>
//                                 <span className="flex items-center gap-1">
//                                     <Clock className="w-4 h-4" />
//                                     Released{" "}
//                                     {new Date(changelog[0].date).toLocaleDateString(
//                                         "en-US",
//                                         {
//                                             year: "numeric",
//                                             month: "long",
//                                             day: "numeric",
//                                         },
//                                     )}
//                                 </span>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Beta Notice */}
//                 <div className="p-6 mb-8 border border-yellow-300 rounded-lg shadow-sm bg-yellow-50">
//                     <div className="flex items-start gap-4">
//                         <div className="p-2 bg-yellow-400 rounded-md">
//                             <AlertTriangle className="w-4 h-4 text-white" />
//                         </div>
//                         <div>
//                             <h3 className="mb-2 text-lg font-semibold text-yellow-800">
//                                 Beta Testing Notice
//                             </h3>
//                             <p className="text-sm text-gray-700">
//                                 This is a <strong>beta version</strong> of the KuraZetu
//                                 mobile app. While stable for most users, it may still
//                                 contain bugs or incomplete features. Help us refine the
//                                 platform by reporting any issues you encounter.
//                             </p>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Bug Report */}
//                 <div className="p-6 mb-8 border border-red-300 rounded-lg shadow-sm bg-red-50">
//                     <div className="flex items-center justify-between">
//                         <div className="flex items-center gap-4">
//                             <div className="p-2 bg-red-600 rounded-md">
//                                 <Bug className="w-4 h-4 text-white" />
//                             </div>
//                             <div>
//                                 <h3 className="mb-1 text-lg font-semibold text-red-600">
//                                     Found a Bug?
//                                 </h3>
//                                 <p className="text-sm text-gray-700">
//                                     Report issues and help us improve KuraZetu.
//                                 </p>
//                             </div>
//                         </div>
//                         <a
//                             href="https://github.com/shamash92/KuraZetu/issues/new?title=bug%3A+TYPE+YOUR+ISSUE+HERE&body=*Please%20describe%20the%20bug%20or%20issue%20you%27re%20facing%20with%20%22Kura%20Zetu%20documentation%22.*%0A%0A%0A%0A%0A---%0A*Reported+from%3A+https://kurazetu.com/*"
//                             className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
//                         >
//                             Report Issue
//                             <ExternalLink className="w-4 h-4" />
//                         </a>
//                     </div>
//                 </div>

//                 {/* Installation Guide */}
//                 <div className="p-6 mb-8 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
//                     <div className="flex items-start gap-4">
//                         <div className="p-2 bg-gray-300 rounded-md">
//                             <Shield className="w-4 h-4 text-gray-700" />
//                         </div>
//                         <div>
//                             <h3 className="mb-2 text-lg font-semibold text-gray-800">
//                                 Installation Instructions
//                             </h3>
//                             <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
//                                 <li>
//                                     Enable "Install Unknown Apps" in Android settings
//                                 </li>
//                                 <li>Download the APK file above</li>
//                                 <li>Open the file and follow the prompts</li>
//                                 <li>Launch KuraZetu and start verifying results</li>
//                             </ol>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Changelog */}
//                 <div className="p-8 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
//                     <div className="flex items-center justify-between mb-6">
//                         <div className="flex items-center gap-3">
//                             <Clock className="w-5 h-5 text-gray-500" />
//                             <h2 className="text-xl font-semibold text-gray-800">
//                                 Changelog
//                             </h2>
//                         </div>
//                         <button
//                             onClick={() => setChangelogExpanded(!changelogExpanded)}
//                             className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
//                         >
//                             {changelogExpanded ? "Collapse" : "View All"}
//                             {changelogExpanded ? <ChevronUp /> : <ChevronDown />}
//                         </button>
//                     </div>
//                     <div className="space-y-6">
//                         {changelog
//                             .slice(0, changelogExpanded ? changelog.length : 1)
//                             .map((release, index) => (
//                                 <div
//                                     key={release.version}
//                                     className={
//                                         index > 0 ? "pt-6 border-t border-gray-200" : ""
//                                     }
//                                 >
//                                     <div className="flex flex-col gap-4 mb-4 md:flex-row md:items-center">
//                                         <span className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md">
//                                             v{release.version}{" "}
//                                         </span>
//                                         <span
//                                             className={`mx-2 text-xs rounded px-2 py-0.5 ${
//                                                 index === 0
//                                                     ? "text-green-900 bg-green-200"
//                                                     : "text-red-900 bg-red-200"
//                                             }`}
//                                         >
//                                             {release.codeName}
//                                         </span>
//                                         <span className="text-sm text-gray-500">
//                                             {new Date(release.date).toLocaleDateString(
//                                                 "en-US",
//                                                 {
//                                                     year: "numeric",
//                                                     month: "long",
//                                                     day: "numeric",
//                                                 },
//                                             )}
//                                         </span>
//                                     </div>
//                                     <ul className="space-y-2">
//                                         {release.changes.map((change, idx) => (
//                                             <li
//                                                 key={idx}
//                                                 className="flex items-start gap-3 text-sm text-gray-700"
//                                             >
//                                                 <div className="w-1.5 h-1.5 mt-2 bg-green-500 rounded-full flex-shrink-0"></div>
//                                                 {change}
//                                             </li>
//                                         ))}
//                                     </ul>
//                                 </div>
//                             ))}
//                     </div>
//                 </div>

//                 {/* Footer */}
//                 <div className="mt-12 text-sm text-center text-gray-500">
//                     © 2025 KuraZetu. All rights reserved. Beta version for testers.
//                 </div>
//             </div>
//         </div>
//     );
// }

import {
    AlertTriangle,
    Bug,
    ChevronDown,
    ChevronUp,
    Clock,
    Download,
    ExternalLink,
    Shield,
    Smartphone,
} from "lucide-react";
import React, {useState} from "react";

export default function APKDownloadPage() {
    const [changelogExpanded, setChangelogExpanded] = useState(false);

    const changelog = [
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
            date: "2025-05-28",
            codeName: "Mikasa",
            changes: [
                "Minor UI improvements",
                "Bug fixes around station registration",
                "Enhanced error messages during data entry",
            ],
        },
    ];

    return (
        <div className="w-full min-h-screen" style={{backgroundColor: "#F7F6F4"}}>
            {/* Beta Notice */}
            <div className="absolute top-8 left-[10vw] p-8 bg-white border-l-4 shadow-lg rounded-2xl w-[90vw] md:w-[80vw] lg:w-[80vw] z-50">
                <div className="flex items-start gap-6">
                    <div
                        className="flex items-center justify-center w-12 h-12 rounded-xl"
                        style={{backgroundColor: "red"}}
                    >
                        <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3
                            className="mb-3 text-sm font-bold md:mb-0"
                            style={{color: "#111"}}
                        >
                            Beta Testing Notice
                        </h3>
                        <p className="text-xs leading-relaxed text-gray-700">
                            This is a <strong>beta version</strong> of the KuraZetu
                            mobile app. While stable for most users, it may still
                            contain bugs or incomplete features. Help us refine the
                            platform by reporting any issues you encounter.
                        </p>
                    </div>
                </div>
            </div>
            {/* Hero Section */}
            <div className="px-6 mx-auto text-center md:pt-20 md:pb-0 max-w-7xl">
                <div
                    className="inline-flex items-center justify-center w-24 h-24 mb-8 shadow-lg rounded-3xl"
                    style={{backgroundColor: "#A8E05F"}}
                >
                    <Smartphone className="w-12 h-12 text-white" />
                </div>

                <h1
                    className="mb-6 text-5xl font-bold md:text-7xl"
                    style={{color: "#111"}}
                >
                    KuraZetu Android App
                </h1>

                <p className="max-w-2xl mx-auto mb-12 text-lg leading-relaxed text-gray-700 md:text-xl">
                    The all-in-one civic tech platform for collecting and verifying
                    Kenyan election results. Stay informed. Stay empowered. Democracy
                    made transparent.
                </p>

                {/* Primary CTA */}
                <div className="mb-4 md:mb-4">
                    <a
                        href={`https://kurazetu.s3.eu-west-1.amazonaws.com/static/builds/${changelog[0].version}.apk`}
                        className="inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold text-white transition-all duration-300 transform rounded-lg shadow-md hover:shadow-lg hover:scale-105"
                        style={{backgroundColor: "#A8E05F"}}
                    >
                        <Download className="w-6 h-6" />
                        Download APK v{changelog[0].version}
                        <span className="ml-2 text-sm font-normal opacity-90">
                            (136.0 MB)
                        </span>
                    </a>

                    <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-600">
                        <span className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            Android 7.0+
                        </span>
                        <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Released{" "}
                            {new Date(changelog[0].date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content Sections */}
            <div className="max-w-4xl px-6 py-4 mx-auto space-y-8 md:py-8">
                {/* Installation Guide */}
                <div className="p-8 bg-white shadow-lg rounded-2xl">
                    <div className="flex items-start gap-6">
                        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl">
                            <Shield className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="flex-1">
                            <h3
                                className="mb-4 text-xl font-bold"
                                style={{color: "#111"}}
                            >
                                Installation Instructions
                            </h3>
                            <div className="space-y-3">
                                {[
                                    "Enable 'Install Unknown Apps' in Android settings",
                                    "Download the APK file using the button above",
                                    "Open the downloaded file and follow the prompts",
                                    "Launch KuraZetu and start verifying results",
                                ].map((step, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div
                                            className="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full"
                                            style={{backgroundColor: "#A8E05F"}}
                                        >
                                            {idx + 1}
                                        </div>
                                        <p className="text-gray-700">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Changelog */}
                <div className="p-8 bg-white shadow-lg rounded-2xl">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Clock className="w-6 h-6 text-gray-500" />
                            <h2 className="text-2xl font-bold" style={{color: "#111"}}>
                                Release History
                            </h2>
                        </div>
                        <button
                            onClick={() => setChangelogExpanded(!changelogExpanded)}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 transition-all duration-300 rounded-lg hover:text-gray-800 hover:bg-gray-50"
                        >
                            {changelogExpanded ? "Show Less" : "View All"}
                            {changelogExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                        </button>
                    </div>

                    <div className="space-y-8">
                        {changelog
                            .slice(0, changelogExpanded ? changelog.length : 1)
                            .map((release, index) => (
                                <div
                                    key={release.version}
                                    className={
                                        index > 0 ? "pt-8 border-t border-gray-100" : ""
                                    }
                                >
                                    <div className="flex flex-wrap items-center gap-4 mb-6">
                                        <span
                                            className="px-4 py-2 text-sm font-bold text-white rounded-lg"
                                            style={{backgroundColor: "#A8E05F"}}
                                        >
                                            v{release.version}
                                        </span>
                                        <span className="px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-100 rounded-full">
                                            {release.codeName}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {new Date(release.date).toLocaleDateString(
                                                "en-US",
                                                {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                },
                                            )}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {release.changes.map((change, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-start gap-4"
                                            >
                                                <div
                                                    className="flex-shrink-0 w-2 h-2 mt-2 rounded-full"
                                                    style={{backgroundColor: "#A8E05F"}}
                                                ></div>
                                                <p className="leading-relaxed text-gray-700">
                                                    {change}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Bug Report */}
                <div className="p-8 bg-white shadow-lg rounded-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl">
                                <Bug className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3
                                    className="mb-2 text-xl font-bold"
                                    style={{color: "#111"}}
                                >
                                    Found a Bug?
                                </h3>
                                <p className="text-gray-700">
                                    Report issues and help us improve KuraZetu.
                                </p>
                            </div>
                        </div>
                        <a
                            href="https://github.com/shamash92/KuraZetu/issues/new?title=bug%3A+TYPE+YOUR+ISSUE+HERE&body=*Please%20describe%20the%20bug%20or%20issue%20you%27re%20facing%20with%20%22Kura%20Zetu%20documentation%22.*%0A%0A%0A%0A%0A---%0A*Reported+from%3A+https://kurazetu.com/*"
                            className="flex items-center gap-2 px-6 py-3 font-semibold text-white transition-all duration-300 rounded-lg hover:shadow-lg"
                            style={{backgroundColor: "#A8E05F"}}
                        >
                            Report Issue
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="py-12 mt-16 text-sm text-center text-gray-500 border-t border-gray-200">
                <div className="px-6 mx-auto max-w-7xl">
                    <p>
                        © 2025 KuraZetu. All rights reserved. Beta version for testers.
                    </p>
                    <div className="flex justify-center gap-6 mt-4">
                        <a
                            href="#"
                            className="transition-colors duration-300 hover:text-gray-700"
                        >
                            Privacy Policy
                        </a>
                        <a
                            href="#"
                            className="transition-colors duration-300 hover:text-gray-700"
                        >
                            Terms of Service
                        </a>
                        <a
                            href="#"
                            className="transition-colors duration-300 hover:text-gray-700"
                        >
                            Support
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
