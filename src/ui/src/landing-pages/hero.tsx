import {Button} from "../@/components/ui/button";
import {ArrowRight, Download, Apple, Smartphone, Shield} from "lucide-react";
import {Alert, AlertDescription, AlertTitle} from "../@/components/ui/alert";

export function Hero() {
    return (
        <div className=" flex  bg-gradient-to-br from-red-50 via-white to-green-50 h-[50vh] min-h-[600px]">
            <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-500/10 via-transparent to-green-600/10 animate-pulse" />
                <div
                    className="absolute right-0 rounded-full top-1/4 w-96 h-96 bg-gradient-to-l from-red-400/20 to-transparent blur-3xl animate-bounce"
                    style={{animationDuration: "3s"}}
                />
                <div
                    className="absolute left-0 rounded-full bottom-1/4 w-80 h-80 bg-gradient-to-r from-green-500/20 to-transparent blur-3xl animate-bounce"
                    style={{animationDuration: "4s", animationDelay: "1s"}}
                />
                <div
                    className="absolute w-64 h-64 transform -translate-x-1/2 -translate-y-1/2 rounded-full top-1/2 left-1/2 bg-gradient-to-br from-yellow-400/15 to-orange-500/15 blur-2xl animate-pulse"
                    style={{animationDelay: "2s"}}
                />
            </div>

            <div className="absolute inset-0 opacity-5">
                <div
                    className="absolute w-4 h-4 rotate-45 bg-red-600 top-10 left-10 animate-spin"
                    style={{animationDuration: "10s"}}
                />
                <div
                    className="absolute w-3 h-3 rotate-45 bg-green-600 top-20 right-20 animate-spin"
                    style={{animationDuration: "8s", animationDirection: "reverse"}}
                />
                <div
                    className="absolute w-5 h-5 rotate-45 bg-yellow-500 bottom-20 left-20 animate-spin"
                    style={{animationDuration: "12s"}}
                />
                <div
                    className="absolute w-3 h-3 rotate-45 bg-orange-500 bottom-10 right-10 animate-spin"
                    style={{animationDuration: "9s", animationDirection: "reverse"}}
                />
            </div>

            <div className="flex items-center h-full mx-auto max-w-7xl">
                <div className="flex flex-col items-center w-full gap-8 md:flex-row">
                    {/* Left side - Content (Half page) */}
                    <div className="flex flex-col text-center lg:text-left lg:pr-8">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                            <span className="text-transparent bg-gradient-to-r from-red-600 via-green-600 to-yellow-500 bg-clip-text">
                                Kura
                            </span>

                            <span className="pl-4 text-gray-900">Zetu</span>
                        </h1>
                        <p className="max-w-xl mt-4 text-base leading-7 text-gray-700">
                            Empowering Kenyans to track, verify, and tally election
                            results at the polling station level. Built by the
                            community, for the community.
                        </p>

                        {/* Download buttons */}
                        <div className="flex flex-col items-center justify-center gap-3 mt-8 sm:flex-row lg:justify-start">
                            <a href="https://kurazetu.readthedocs.io/tutorials/setup-android/#running-the-app">
                                <Button className="bg-gradient-to-r from-[#008751] to-green-600 hover:from-[#006B40] hover:to-green-700 text-white shadow-lg transform transition-all duration-200 hover:scale-105">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Development APK
                                </Button>
                            </a>

                            <Button
                                variant="outline"
                                className="relative overflow-hidden border-gray-300 hover:bg-gray-50 group"
                            >
                                <Apple className="w-4 h-4 mr-2" />
                                <span>iOS Coming Soon</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            </Button>
                        </div>

                        <div className="flex items-center justify-center mt-6 lg:justify-start gap-x-6">
                            <a href="https://kurazetu.readthedocs.io">
                                <Button className="bg-gradient-to-r from-[#008751] to-green-600 hover:from-[#006B40] hover:to-green-700 text-white shadow-lg transform transition-all duration-200 hover:scale-105">
                                    Documentation
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                </Button>
                            </a>
                        </div>
                    </div>

                    {/* Right side - App wireframe mockup (Half page) */}
                    <div className="flex justify-center flex-1 lg:justify-end">
                        <div className="relative">
                            {/* Phone frame with wireframe styling */}
                            <div className="relative w-64 h-[400px] bg-white border-2 border-gray-300 rounded-[2.5rem] p-3 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                                {/* Screen */}
                                <div className="w-full h-full bg-gray-50 rounded-[2rem] overflow-hidden relative border border-gray-200">
                                    {/* Status bar */}
                                    <div className="flex items-center justify-between h-8 px-4 text-xs text-gray-600 bg-gray-100 border-b border-gray-200">
                                        <span className="font-mono">9:41</span>
                                        <div className="flex space-x-1">
                                            <div className="w-4 h-2 bg-green-400 border border-gray-400 rounded-sm"></div>
                                            <div className="w-1 h-2 bg-gray-400 rounded-full"></div>
                                            <div className="w-1 h-2 bg-gray-400 rounded-full"></div>
                                            <div className="w-1 h-2 bg-gray-400 rounded-full"></div>
                                        </div>
                                    </div>

                                    {/* App header mockup */}
                                    <div className="p-6 space-y-5">
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-gradient-to-br from-[#008751] to-green-600 rounded-2xl mx-auto mb-3 flex items-center justify-center animate-pulse">
                                                <Smartphone className="w-8 h-8 text-white" />
                                            </div>
                                            <div className="w-20 h-4 mx-auto mb-2 bg-gray-300 rounded"></div>
                                            <div className="w-24 h-2 mx-auto bg-gray-200 rounded"></div>
                                        </div>

                                        {/* Wireframe content sections */}
                                        <div className="space-y-3">
                                            <div className="space-y-2">
                                                <div className="w-16 h-3 bg-gray-300 rounded"></div>
                                                <div className="flex items-center h-12 px-3 bg-white border-2 border-gray-200 rounded-lg">
                                                    <div className="w-20 h-3 bg-gray-200 rounded"></div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="w-20 h-3 bg-gray-300 rounded"></div>
                                                <div className="flex items-center h-12 px-3 bg-white border-2 border-gray-200 rounded-lg">
                                                    <div className="w-24 h-3 bg-gray-200 rounded"></div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="h-3 bg-gray-300 rounded w-18"></div>
                                                <div className="flex items-center h-12 px-3 bg-white border-2 border-gray-200 rounded-lg">
                                                    <div className="w-16 h-3 bg-gray-200 rounded"></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action buttons wireframe */}
                                        <div className="pt-4 space-y-3">
                                            <div className="h-12 bg-gradient-to-r from-[#008751] to-green-600 rounded-lg animate-pulse"></div>
                                            <div className="h-10 bg-white border-2 border-gray-200 rounded-lg"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Home indicator */}
                                <div className="absolute h-1 transform -translate-x-1/2 bg-gray-400 rounded-full bottom-2 left-1/2 w-28" />
                            </div>

                            {/* Floating wireframe elements */}
                            <div
                                className="absolute w-8 h-8 border-2 border-red-400 rounded-lg -top-4 -left-4 bg-red-400/30 animate-bounce"
                                style={{animationDelay: "0.5s"}}
                            />
                            <div
                                className="absolute w-6 h-6 border-2 border-green-400 rounded-lg -bottom-4 -right-4 bg-green-400/30 animate-bounce"
                                style={{animationDelay: "1s"}}
                            />
                            <div
                                className="absolute w-4 h-4 border-2 border-yellow-400 rounded-lg top-1/2 -right-8 bg-yellow-400/30 animate-bounce"
                                style={{animationDelay: "1.5s"}}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating disclaimer */}
            <div className="absolute z-[10] top-[10] left-4 right-4">
                <Alert className="max-w-md border-red-200 bg-red-50/90 backdrop-blur-sm">
                    <Shield className="w-4 h-4 text-red-600" />
                    <AlertTitle className="text-sm font-semibold text-red-600">
                        Important Disclaimer
                    </AlertTitle>
                    <AlertDescription className="text-xs text-red-700">
                        This is not an official IEBC tallying system. Kura Zetu is a
                        citizen-led initiative for transparency.
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    );
}
