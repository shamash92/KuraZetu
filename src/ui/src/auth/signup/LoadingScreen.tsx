import React from "react";

export default function CountiesLoadingScreen() {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-transparent">
            {/* Main loading content */}
            <div className="relative z-10 space-y-8 text-center">
                {/* Animated loading spinner */}
                <div className="relative">
                    <div className="w-20 h-20 mx-auto mb-8 border-4 border-gray-300 rounded-full border-t-gray-600 animate-spin"></div>
                    <div
                        className="absolute inset-0 w-20 h-20 mx-auto border-4 border-transparent rounded-full border-r-gray-400 animate-spin"
                        style={{
                            animationDirection: "reverse",
                            animationDuration: "1.5s",
                        }}
                    ></div>
                </div>

                {/* Loading text */}
                <div className="space-y-4">
                    <h1 className="text-4xl font-bold text-gray-800 md:text-6xl">
                        Loading Counties
                    </h1>

                    {/* Animated dots */}
                    <div className="flex justify-center space-x-1">
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"
                                style={{animationDelay: `${i * 0.2}s`}}
                            ></div>
                        ))}
                    </div>

                    <p className="text-lg text-gray-500 opacity-80">
                        Tallying election results...
                    </p>
                </div>

                {/* Progress bar */}
                <div className="max-w-md mx-auto w-80">
                    <div className="h-2 overflow-hidden bg-gray-200 rounded-full">
                        <div className="h-full bg-gray-400 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>

            {/* Developer tip at bottom */}
            <div className="absolute left-0 right-0 px-8 bottom-8">
                <div className="max-w-2xl mx-auto">
                    <div className="p-4 border border-gray-300 rounded-lg bg-white/70 backdrop-blur-sm">
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-0.5">
                                <div className="flex items-center justify-center w-4 h-4 bg-yellow-400 rounded-full">
                                    <span className="text-xs font-bold text-gray-900">
                                        💡
                                    </span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs leading-relaxed text-gray-700">
                                    <span className="font-medium text-yellow-600">
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
        </div>
    );
}
