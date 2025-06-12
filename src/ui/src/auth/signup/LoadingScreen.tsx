import React from "react";

export default function CountiesLoadingScreen() {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-red-900 via-orange-800 to-red-800">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute opacity-50 -inset-10">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-pulse"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${2 + Math.random() * 3}s`,
                            }}
                        >
                            <div className="w-1 h-1 bg-orange-400 rounded-full opacity-60"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main loading content */}
            <div className="relative z-10 space-y-8 text-center">
                {/* Animated loading spinner */}
                <div className="relative">
                    <div className="w-20 h-20 mx-auto mb-8 border-4 border-orange-200 rounded-full border-t-red-600 animate-spin"></div>
                    <div
                        className="absolute inset-0 w-20 h-20 mx-auto border-4 border-transparent rounded-full border-r-yellow-500 animate-spin"
                        style={{
                            animationDirection: "reverse",
                            animationDuration: "1.5s",
                        }}
                    ></div>
                </div>

                {/* Loading text with typing animation */}
                <div className="space-y-4">
                    <h1 className="text-4xl font-bold text-white md:text-6xl">
                        <span className="text-transparent bg-gradient-to-r from-orange-300 via-red-400 to-yellow-400 bg-clip-text">
                            Loading Counties
                        </span>
                    </h1>

                    {/* Animated dots */}
                    <div className="flex justify-center space-x-1">
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"
                                style={{animationDelay: `${i * 0.2}s`}}
                            ></div>
                        ))}
                    </div>

                    <p className="text-lg text-orange-200 opacity-80">
                        Tallying election results...
                    </p>
                </div>

                {/* Progress bar */}
                <div className="max-w-md mx-auto w-80">
                    <div className="h-2 overflow-hidden bg-red-800 rounded-full">
                        <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 animate-pulse"></div>
                    </div>
                </div>
            </div>

            {/* Floating geometric shapes */}
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute w-4 h-4 border-2 border-orange-400 top-1/4 left-1/4 opacity-30 animate-ping"
                    style={{animationDuration: "3s"}}
                ></div>
                <div
                    className="absolute w-6 h-6 border-2 border-yellow-400 top-3/4 right-1/4 opacity-20 animate-ping"
                    style={{animationDuration: "4s", animationDelay: "1s"}}
                ></div>
                <div
                    className="absolute w-3 h-3 bg-red-400 bottom-1/3 left-1/3 opacity-40 animate-pulse"
                    style={{animationDuration: "2.5s"}}
                ></div>
            </div>

            {/* Developer tip at bottom */}
            <div className="absolute left-0 right-0 px-8 bottom-8">
                <div className="max-w-2xl mx-auto">
                    <div className="p-4 border rounded-lg bg-red-900/40 backdrop-blur-sm border-red-700/50">
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-0.5">
                                <div className="flex items-center justify-center w-4 h-4 bg-yellow-500 rounded-full">
                                    <span className="text-xs font-bold text-red-900">
                                        💡
                                    </span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs leading-relaxed text-orange-200">
                                    <span className="font-medium text-yellow-400">
                                        Dev Tip:
                                    </span>{" "}
                                    If counties aren't loading, make sure your data
                                    scripts have been executed properly.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subtle glow effect */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-transparent via-transparent to-orange-900/20"></div>
        </div>
    );
}
