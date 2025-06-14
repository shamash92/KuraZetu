import {Button} from "../@/components/ui/button";
import {
    ArrowRight,
    Download,
    Apple,
    Smartphone,
    Shield,
    GitBranchIcon,
    GitBranchPlus,
    File,
} from "lucide-react";
import {Alert, AlertDescription, AlertTitle} from "../@/components/ui/alert";
import {s3BaseUrl} from "../utils";
import AppScreenshots from "./appScreenshots";
import PlayGameCallToActionButton from "./gameButton";

export function Hero() {
    return (
        <div className=" flex  flex-col items-center bg-gradient-to-br from-red-50 via-white to-green-50 md:h-[50vh] min-h-[600px]">
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

            {/* Floating disclaimer */}
            <div className="relative md:absolute z-[10] top-[10] md:left-4 md:right-4 flex flex-col items-center justify-center">
                <Alert className="w-full border-red-200 md:max-w-md bg-red-50/90 backdrop-blur-sm">
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

            <div className="flex items-center h-full mx-auto max-w-7xl">
                <div className="flex flex-col items-center w-full gap-8 md:flex-row md:justify-evenly">
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
                            <a href="/ui/download-apk/">
                                <Button className="bg-gradient-to-r from-[#3DDC84] to-[#0A8754] hover:from-[#249E6B] hover:to-[#0A8754] text-white shadow-lg transform transition-all duration-200 hover:scale-105 flex items-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="w-5 h-5 mr-2"
                                    >
                                        <g>
                                            <circle cx="7" cy="4" r="1" fill="#fff" />
                                            <circle cx="17" cy="4" r="1" fill="#fff" />
                                            <path
                                                d="M4 9c0-3.31 3.13-6 7-6s7 2.69 7 6v6c0 2.21-1.79 4-4 4h-6c-2.21 0-4-1.79-4-4V9zm2 0v6c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V9c0-2.21-2.24-4-5-4s-5 1.79-5 4z"
                                                fill="#fff"
                                            />
                                            <rect
                                                x="8"
                                                y="19"
                                                width="2"
                                                height="2"
                                                rx="1"
                                                fill="#fff"
                                            />
                                            <rect
                                                x="14"
                                                y="19"
                                                width="2"
                                                height="2"
                                                rx="1"
                                                fill="#fff"
                                            />
                                        </g>
                                    </svg>
                                    Download Android APK
                                </Button>
                            </a>

                            <Button
                                variant="outline"
                                className="relative overflow-hidden border-gray-300 hover:bg-gray-50 group"
                            >
                                <Apple className="w-4 h-4 mr-2" />
                                <span>iOS (Coming Soon)</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            </Button>
                        </div>

                        <div className="flex flex-col-reverse items-center justify-center mt-6 gap-x-6 md:flex-row lg:justify-start">
                            <a
                                href="https://kurazetu.readthedocs.io/"
                                target="_blank"
                                className="mt-4 md:mt-0"
                            >
                                <Button className="flex items-center gap-2 text-gray-800 transition-all duration-200 transform bg-white shadow-lg hover:bg-gray-100 hover:scale-105">
                                    <File className="w-4 h-4 mr-2" />
                                    Read the Docs
                                </Button>
                            </a>

                            <a
                                href="https://github.com/shamash92/KuraZetu.git"
                                className=""
                            >
                                <Button className="flex items-center gap-2 text-white transition-all duration-200 transform bg-black shadow-lg hover:bg-gray-900 hover:scale-105">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="w-4 h-4 mr-2"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.337 4.695-4.566 4.944.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.744 0 .268.18.579.688.481C19.138 20.2 22 16.448 22 12.021 22 6.484 17.523 2 12 2z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Contribute on GitHub
                                </Button>
                            </a>
                        </div>

                        <div className="flex flex-col-reverse items-center justify-center mt-6 gap-x-6 md:flex-row lg:justify-start">
                            <PlayGameCallToActionButton />
                        </div>
                    </div>

                    {/* Right side - App wireframe mockup (Half page) */}
                    <div className="flex justify-center flex-1 lg:justify-end">
                        <AppScreenshots />
                        <div className="relative">
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
        </div>
    );
}
