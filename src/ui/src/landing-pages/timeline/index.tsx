import React, {useState, useRef, useEffect} from "react";

const KuraZetuTimeline = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showScrollHint, setShowScrollHint] = useState(true);

    const steps = [
        {
            id: 1,
            title: "Initial Requirements",
            status: "done",
            description: "Defined key project and civic-tech goals.",
        },
        {
            id: 2,
            title: "Bootstrap Web Platform",
            status: "done",
            description: "Set up backend and frontend core systems.",
        },
        {
            id: 3,
            title: "PinVerify254 Game",
            status: "active",
            description: "A playful way to validate awareness and polling knowledge.",
        },
        {
            id: 4,
            title: "Launch Mobile App",
            status: "next",
            description: "KuraZetu mobile beta release for Android users.",
        },
        {
            id: 5,
            title: "Developer Onboarding",
            status: "upcoming",
            description: "Allow contributors to join and build together.",
        },
        {
            id: 6,
            title: "Verification at Stations",
            status: "upcoming",
            description: "Begin polling station-based data verification.",
        },
        {
            id: 7,
            title: "IEBC Data Sync",
            status: "upcoming",
            description: "Update based on latest open IEBC results.",
        },
        {
            id: 8,
            title: "Ground Simulations",
            status: "upcoming",
            description: "Run community simulations on field-based data gathering.",
        },
        {
            id: 9,
            title: "Aspirant Onboarding",
            status: "upcoming",
            description: "Engage candidates to share manifestos and vision.",
        },
        {
            id: 10,
            title: "Election Day (D-Day)",
            status: "final",
            description: "Live civic results, verified by the people.",
        },
    ];

    const getStepConfig = (status) => {
        const configs = {
            done: {
                bgColor: "bg-white",
                borderColor: "border-slate-200",
                numberBg: "bg-green-500",
                numberText: "text-white",
                titleText: "text-gray-900",
                descText: "text-gray-500",
                shadow: "shadow-sm",
                icon: "✓",
            },
            active: {
                bgColor: "bg-white",
                borderColor: "border-blue-600",
                numberBg: "bg-blue-600",
                numberText: "text-white",
                titleText: "text-blue-600",
                descText: "text-gray-600",
                shadow: "shadow-md ring-2 ring-blue-600 ring-opacity-20",
                icon: "⟳",
                pulse: true,
            },
            next: {
                bgColor: "bg-white",
                borderColor: "border-blue-600",
                numberBg: "bg-blue-600",
                numberText: "text-white",
                titleText: "text-blue-600",
                descText: "text-gray-600",
                shadow: "shadow-sm",
                icon: "→",
            },
            upcoming: {
                bgColor: "bg-slate-50",
                borderColor: "border-slate-200",
                numberBg: "bg-slate-300",
                numberText: "text-slate-600",
                titleText: "text-gray-700",
                descText: "text-gray-500",
                shadow: "shadow-sm",
                icon: "○",
            },
            final: {
                bgColor: "bg-slate-50",
                borderColor: "border-slate-200",
                numberBg: "bg-slate-400",
                numberText: "text-white",
                titleText: "text-gray-700",
                descText: "text-gray-500",
                shadow: "shadow-sm",
                icon: "🗳️",
            },
        };
        return configs[status] || configs.upcoming;
    };

    const scrollLeft = () => {
        scrollRef.current?.scrollBy({left: -240, behavior: "smooth"});
    };

    const scrollRight = () => {
        scrollRef.current?.scrollBy({left: 240, behavior: "smooth"});
    };

    useEffect(() => {
        const timer = setTimeout(() => setShowScrollHint(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    const currentStepIndex = steps.findIndex((step) => step.status === "active");

    return (
        <div className="flex flex-col items-center w-full px-6 pt-8 mx-auto overflow-hidden md:pb-8 md:pt-0 bg-gray-50">
            {/* Header */}
            <div className="flex flex-row items-center justify-between w-full mb-8 md:mb-8 md:max-w-7xl">
                <div>
                    <h2 className="mb-2 text-2xl font-semibold text-gray-900">
                        Project Timeline
                    </h2>
                    <p className="font-light text-gray-500">
                        Track our progress building KuraZetu civic-tech platform
                    </p>
                </div>

                {/* Current Step Indicator */}
                <div className="items-center hidden px-4 py-2 space-x-3 rounded-lg md:flex bg-blue-50">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-blue-600">
                        Currently: {steps[currentStepIndex]?.title}
                    </span>
                </div>
            </div>

            {/* Mobile View Note */}
            <div className="text-sm text-center text-gray-500 md:hidden">
                Swipe left or right to navigate timeline
            </div>

            {/* Timeline Container */}
            <div className="relative max-w-7xl">
                {/* Navigation Buttons */}
                <button
                    onClick={scrollLeft}
                    className="absolute left-0 z-10 flex items-center justify-center w-10 h-10 transition-all duration-200 -translate-y-1/2 bg-white border rounded-full shadow-md top-1/2 border-slate-200 hover:shadow-lg hover:bg-slate-50"
                >
                    <svg
                        className="w-5 h-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </button>

                <button
                    onClick={scrollRight}
                    className="absolute right-0 z-10 flex items-center justify-center w-10 h-10 transition-all duration-200 -translate-y-1/2 bg-white border rounded-full shadow-md top-1/2 border-slate-200 hover:shadow-lg hover:bg-slate-50"
                >
                    <svg
                        className="w-5 h-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </button>

                {/* Scroll Hint */}
                {showScrollHint && (
                    <div className="absolute top-0 z-20 px-3 py-1 text-xs text-white bg-gray-900 rounded shadow-lg right-16 animate-bounce">
                        Scroll to explore →
                    </div>
                )}

                {/* Scrollable Timeline */}
                <div
                    ref={scrollRef}
                    className="px-12 overflow-x-auto scrollbar-hide"
                    style={{scrollbarWidth: "none", msOverflowStyle: "none"}}
                >
                    <div
                        className="flex pb-4 space-x-6 md:pb-0 "
                        style={{width: "max-content"}}
                    >
                        {steps.map((step, index) => {
                            const config = getStepConfig(step.status);
                            const isActive = step.status === "active";

                            return (
                                <div key={step.id} className="flex-none ">
                                    {/* Step Card */}
                                    <div
                                        className={`
                    min-w-[220px] max-w-[220px] p-6 rounded-xl border-2 transition-all duration-300
                    ${config.bgColor} ${config.borderColor} ${config.shadow}
                    ${isActive ? "scale-105" : "hover:scale-102"}
                  `}
                                    >
                                        {/* Step Number */}
                                        <div
                                            className={`
                      w-10 h-10 rounded-full flex items-center justify-center mb-4 font-semibold text-sm
                      ${config.numberBg} ${config.numberText}
                      ${config.pulse ? "animate-pulse" : ""}
                    `}
                                        >
                                            {step.status === "done"
                                                ? config.icon
                                                : step.id}
                                        </div>

                                        {/* Content */}
                                        <div>
                                            <h3
                                                className={`font-semibold text-lg mb-3 leading-tight ${config.titleText}`}
                                            >
                                                {step.title}
                                            </h3>
                                            <p
                                                className={`text-sm leading-relaxed ${config.descText}`}
                                            >
                                                {step.description}
                                            </p>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="mt-4">
                                            <span
                                                className={`
                        inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                        ${
                            step.status === "done"
                                ? "bg-green-100 text-green-700"
                                : step.status === "active"
                                ? "bg-blue-100 text-blue-700"
                                : step.status === "next"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-slate-100 text-slate-600"
                        }
                      `}
                                            >
                                                {config.icon}{" "}
                                                {step.status === "done"
                                                    ? "Complete"
                                                    : step.status === "active"
                                                    ? "In Progress"
                                                    : step.status === "next"
                                                    ? "Up Next"
                                                    : step.status === "final"
                                                    ? "Final Goal"
                                                    : "Planned"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Progress Indicator */}
                <div className="hidden px-12 mt-8 md:mt-0 md:block">
                    <div className="flex items-center justify-between mb-2 text-sm text-gray-500">
                        <span>Progress</span>
                        <span>
                            {Math.round(
                                (steps.filter((s) => s.status === "done").length /
                                    steps.length) *
                                    100,
                            )}
                            % Complete
                        </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200">
                        <div
                            className="h-2 transition-all duration-700 rounded-full bg-gradient-to-r from-green-500 to-blue-600"
                            style={{
                                width: `${
                                    (steps.filter((s) => s.status === "done").length /
                                        steps.length) *
                                    100
                                }%`,
                            }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KuraZetuTimeline;
