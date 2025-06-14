import React from "react";
import {MapPin, Play} from "lucide-react";

const PlayGameCallToActionButton = () => {
    return (
        <div className="flex items-center justify-center px-4 md:px-0">
            <div className="relative group">
                {/* Animated glow ring */}
                <div className="absolute transition-all duration-700 -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-2xl opacity-30 group-hover:opacity-50 animate-pulse blur-sm"></div>

                {/* Outer ring for depth */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl opacity-20 group-hover:opacity-30 transition-all duration-500"></div>

                {/* Main button */}
                <a
                    href={"/ui/game/"}
                    className="relative flex items-center gap-3 px-8 py-2 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-blue-500/25 group-hover:border-blue-500/30"
                >
                    {/* Icon container with subtle animation */}
                    <div className="relative">
                        <div className="p-2 transition-all duration-300 shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl group-hover:shadow-blue-500/50">
                            <MapPin className="w-5 h-5 text-white" />
                        </div>
                        {/* Small floating indicator */}
                        <div className="absolute w-3 h-3 rounded-full shadow-lg -top-1 -right-1 bg-gradient-to-r from-green-400 to-emerald-500 animate-bounce"></div>
                    </div>

                    {/* Text content */}
                    <div className="flex flex-col">
                        <span className="text-lg font-semibold tracking-wide text-white">
                            Play PinVerify254
                        </span>
                        <span className="text-sm font-medium text-slate-400">
                            Help us verify polling centers{" "}
                        </span>
                    </div>

                    {/* Arrow indicator */}
                    <div className="ml-2 transition-transform duration-300 transform group-hover:translate-x-1">
                        <Play className="w-4 h-4 fill-current text-slate-400" />
                    </div>

                    {/* Subtle shimmer effect */}
                    <div className="absolute inset-0 transition-opacity duration-700 opacity-0 rounded-2xl group-hover:opacity-100">
                        <div className="absolute inset-0 -skew-x-12 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
                    </div>
                </a>

                {/* Floating particles effect */}
                <div className="absolute w-1 h-1 bg-blue-400 rounded-full -top-2 -left-2 animate-ping opacity-60"></div>
                <div className="absolute w-1 h-1 bg-purple-400 rounded-full -bottom-1 -right-1 animate-ping opacity-40 animation-delay-1000"></div>
            </div>
        </div>
    );
};

export default PlayGameCallToActionButton;
