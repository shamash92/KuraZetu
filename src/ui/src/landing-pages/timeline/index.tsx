import React, {useEffect, useRef, useState} from "react";

const ProjectProgressCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(4); // Start at "Create Mobile App" (present)
    const [isAutoScrolling, setIsAutoScrolling] = useState(false);
    const carouselRef = useRef(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const projectSteps = [
        {
            id: 1,
            title: "Initial Requirements",
            description: "Defined goals, users, scope",
            status: "done",
            icon: "🧠",
            progress: 100,
        },
        {
            id: 2,
            title: "Bootstrap Docs",
            description: "Created foundational documentation",
            status: "done",
            icon: "📋",
            progress: 100,
        },
        {
            id: 3,
            title: "Backend & Frontend",
            description: "Built core infrastructure and UI",
            status: "done",
            icon: "🧑‍💻",
            progress: 100,
        },
        {
            id: 4,
            title: "PinVerify254 Game",
            description: "Interactive verification system",
            status: "in progress",
            icon: "🎮",
            progress: 75,
        },
        {
            id: 5,
            title: "Create Mobile App",
            description: "Native mobile application development",
            status: "present",
            icon: "📱",
            progress: 45,
        },
        {
            id: 6,
            title: "Marketing & Developer Onboarding",
            description: "Outreach and team expansion",
            status: "upcoming",
            icon: "📣",
            progress: 15,
        },
        {
            id: 7,
            title: "Verifying Polling Stations",
            description: "Ground truth data collection",
            status: "upcoming",
            icon: "🔍",
            progress: 5,
        },
        {
            id: 8,
            title: "Sync with IEBC Data",
            description: "Integration with official systems",
            status: "future",
            icon: "🔗",
            progress: 0,
        },
        {
            id: 9,
            title: "On-ground Simulation",
            description: "Real-world testing scenarios",
            status: "future",
            icon: "🧪",
            progress: 0,
        },
        {
            id: 10,
            title: "Aspirant Data Onboarding",
            description: "Candidate information integration",
            status: "future",
            icon: "👥",
            progress: 0,
        },
        {
            id: 11,
            title: "D-Day",
            description: "Election day deployment",
            status: "future",
            icon: "🗳️",
            progress: 0,
        },
    ];

    const getStatusConfig = (status) => {
        switch (status) {
            case "done":
                return {
                    gradient: "from-emerald-400 via-green-500 to-emerald-600",
                    cardBg: "bg-emerald-900/20",
                    cardBorder: "border-emerald-600/30",
                    shadow: "shadow-emerald-500/20",
                    glow: "shadow-emerald-500/40",
                    badge: "bg-emerald-600",
                    ring: "ring-emerald-400",
                };
            case "in progress":
                return {
                    gradient: "from-blue-400 via-cyan-500 to-blue-600",
                    cardBg: "bg-blue-900/20",
                    cardBorder: "border-blue-600/30",
                    shadow: "shadow-blue-500/20",
                    glow: "shadow-blue-500/40",
                    badge: "bg-blue-600",
                    ring: "ring-blue-400",
                };
            case "present":
                return {
                    gradient: "from-orange-400 via-red-500 to-pink-500",
                    cardBg: "bg-gradient-to-br from-orange-900/20 to-pink-900/20",
                    cardBorder: "border-orange-500/40",
                    shadow: "shadow-orange-500/20",
                    glow: "shadow-orange-500/40",
                    badge: "bg-gradient-to-r from-orange-500 to-pink-500",
                    ring: "ring-orange-400",
                };
            case "upcoming":
                return {
                    gradient: "from-purple-400 via-violet-500 to-indigo-500",
                    cardBg: "bg-purple-900/20",
                    cardBorder: "border-purple-600/30",
                    shadow: "shadow-purple-500/20",
                    glow: "shadow-purple-500/40",
                    badge: "bg-purple-600",
                    ring: "ring-purple-400",
                };
            case "future":
                return {
                    gradient: "from-gray-500 via-slate-600 to-gray-700",
                    cardBg: "bg-gray-800/20",
                    cardBorder: "border-gray-600/30",
                    shadow: "shadow-gray-500/20",
                    glow: "shadow-gray-500/40",
                    badge: "bg-gray-700",
                    ring: "ring-gray-400",
                };
            default:
                return {
                    gradient: "from-gray-500 to-gray-600",
                    cardBg: "bg-gray-800/20",
                    cardBorder: "border-gray-600/30",
                    shadow: "shadow-gray-500/20",
                    glow: "shadow-gray-500/40",
                    badge: "bg-gray-700",
                    ring: "ring-gray-400",
                };
        }
    };

    // Auto-scroll to present card on initial load
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsAutoScrolling(true);
            // Find the present card (index 4 - "Create Mobile App")
            const presentIndex = projectSteps.findIndex(
                (step) => step.status === "present",
            );
            if (presentIndex !== -1) {
                setCurrentIndex(presentIndex);
            }
            setTimeout(() => {
                setIsAutoScrolling(false);
                setIsInitialized(true);
            }, 2000);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % projectSteps.length);
    };

    const prevSlide = () => {
        setCurrentIndex(
            (prev) => (prev - 1 + projectSteps.length) % projectSteps.length,
        );
    };

    const goToSlide = (index) => {
        setCurrentIndex(index);
    };

    const StatusBadge = ({status, config}) => {
        const badges = {
            done: {text: "DONE", icon: "✓"},
            "in progress": {text: "ACTIVE", icon: "⟳"},
            present: {text: "CURRENT", icon: "◉"},
            upcoming: {text: "NEXT", icon: "◯"},
            future: {text: "PLANNED", icon: "○"},
        };

        const badge = badges[status];

        return (
            <div
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white ${config.badge} shadow-lg`}
            >
                <span
                    className={
                        status === "in progress"
                            ? "animate-spin mr-1"
                            : status === "present"
                            ? "animate-pulse mr-1"
                            : "mr-1"
                    }
                >
                    {badge.icon}
                </span>
                {badge.text}
            </div>
        );
    };

    const overallProgress = Math.round(
        projectSteps.reduce((sum, step) => sum + step.progress, 0) /
            projectSteps.length,
    );

    return (
        <div className="h-[50vh] justify-start px-4 pb-12 bg-gradient-to-br from-gray-50 via-white to-rose-50 sm:px-6 lg:px-8">
            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute rounded-full -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-pink-300/20 to-orange-400/20 blur-3xl animate-pulse"></div>
                <div
                    className="absolute rounded-full -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-rose-300/20 to-pink-400/20 blur-3xl animate-pulse"
                    style={{animationDelay: "2s"}}
                ></div>
            </div>

            <div className="relative mx-auto max-w-7xl">
                {/* Header */}
                <div className="py-4 mb-0 text-center md:mb-12 md:py-0">
                    <div className="flex flex-col items-center justify-center md:flex-row backdrop-blur-sm ">
                        <div className="flex flex-row items-center">
                            <h1 className="text-lg font-black text-transparent md:text-3xl sm:text-md bg-clip-text bg-gradient-to-r from-gray-800 via-pink-600 to-orange-600">
                                Project Timeline
                            </h1>
                        </div>
                        <div className="flex items-center justify-center pl-4 ">
                            <p className="font-bold text-gray-800 text-md md:text-2xl">
                                ( {overallProgress}% Complete)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Carousel Container */}
                <div className="relative ">
                    {/* Navigation Buttons */}
                    <button
                        onClick={prevSlide}
                        className="absolute z-20 flex items-center justify-center w-12 h-12 text-gray-700 transition-all duration-300 -translate-y-1/2 border rounded-full shadow-lg left-4 top-1/2 bg-white/80 backdrop-blur-sm border-pink-200/50 hover:bg-white/90 hover:shadow-xl group"
                    >
                        <svg
                            className="w-6 h-6 transition-transform transform group-hover:-translate-x-1"
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
                        onClick={nextSlide}
                        className="absolute z-20 flex items-center justify-center w-12 h-12 text-gray-700 transition-all duration-300 -translate-y-1/2 border rounded-full shadow-lg right-4 top-1/2 bg-white/80 backdrop-blur-sm border-pink-200/50 hover:bg-white/90 hover:shadow-xl group"
                    >
                        <svg
                            className="w-6 h-6 transition-transform transform group-hover:translate-x-1"
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

                    {/* Carousel Track with Blur Edges */}
                    <div className="relative overflow-hidden">
                        {/* Left blur edge */}
                        <div className="absolute top-0 bottom-0 left-0 z-10 w-20 pointer-events-none bg-gradient-to-r from-gray-50/80 to-transparent"></div>

                        {/* Right blur edge */}
                        <div className="absolute top-0 bottom-0 right-0 z-10 w-20 pointer-events-none bg-gradient-to-l from-gray-50/80 to-transparent"></div>

                        {/* Cards Container */}
                        <div
                            ref={carouselRef}
                            className="flex px-20 transition-transform duration-700 ease-out "
                            style={{
                                transform: `translateX(-${currentIndex * 25}vw)`,
                                transitionDuration: isAutoScrolling
                                    ? "2000ms"
                                    : "700ms",
                            }}
                        >
                            {projectSteps.map((step, index) => {
                                const config = getStatusConfig(step.status);
                                const isActive = index === currentIndex;
                                const isAdjacent = Math.abs(index - currentIndex) === 1;

                                return (
                                    <div
                                        key={step.id}
                                        className={`flex-shrink-0 transition-all duration-700 w-[80vw] md:w-[25vw] ${
                                            isActive
                                                ? "scale-110"
                                                : isAdjacent
                                                ? "scale-95"
                                                : "scale-90"
                                        } ${isActive ? "opacity-100" : "opacity-80"}`}
                                        style={{marginRight: "0"}}
                                    >
                                        <div
                                            className={`mx-2 h-full ${
                                                config.cardBg
                                            } backdrop-blur-sm rounded-2xl p-6 border ${
                                                config.cardBorder
                                            } transition-all duration-300 hover:shadow-2xl ${
                                                isActive
                                                    ? config.glow +
                                                      " " +
                                                      config.cardBorder
                                                    : ""
                                            } transform hover:-translate-y-2 cursor-pointer shadow-lg`}
                                            onClick={() => goToSlide(index)}
                                        >
                                            {/* Icon & Progress */}
                                            <div className="flex items-center justify-between mb-4">
                                                <div
                                                    className={`w-12 h-12 bg-gradient-to-br ${
                                                        config.gradient
                                                    } rounded-xl flex items-center justify-center text-xl shadow-lg transform transition-transform duration-300 ${
                                                        isActive
                                                            ? "rotate-12 scale-110"
                                                            : ""
                                                    }`}
                                                >
                                                    {step.icon}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="space-y-3">
                                                <h3 className="text-base font-bold leading-tight text-gray-800">
                                                    {step.title}
                                                </h3>

                                                <p className="text-sm leading-relaxed text-gray-600 line-clamp-2">
                                                    {step.description}
                                                </p>

                                                <div className="flex items-center justify-between pt-2">
                                                    <StatusBadge
                                                        status={step.status}
                                                        config={config}
                                                    />
                                                    <div className="text-right">
                                                        <div className="text-xs text-gray-500">
                                                            {step.id}/11
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Active indicator */}
                                            {isActive && (
                                                <div
                                                    className={`absolute -inset-0.5 bg-gradient-to-r ${config.gradient} rounded-2xl blur opacity-20 transition-opacity duration-300`}
                                                ></div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Carousel Indicators */}
                    <div className="flex justify-center mt-8 space-x-2">
                        {projectSteps.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                    index === currentIndex
                                        ? "bg-pink-500 shadow-lg"
                                        : "bg-pink-300/50 hover:bg-pink-400/70"
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectProgressCarousel;
