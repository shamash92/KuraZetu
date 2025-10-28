import {Alert, AlertDescription, AlertTitle} from "../@/components/ui/alert";
import {
    AlertTriangle,
    Eye,
    FileText,
    GamepadIcon,
    PieChart,
    Shield,
    Smartphone,
    Trophy,
    UserCheck,
    Users,
    Vote,
} from "lucide-react";
import {useEffect, useState} from "react";

const Hero = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const fadeInUp = (delay = 0) => ({
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        opacity: isVisible ? 1 : 0,
        transition: `all 0.8s ease-out ${delay}s`,
    });

    const scaleIn = (delay = 0) => ({
        transform: isVisible ? "scale(1)" : "scale(0.95)",
        opacity: isVisible ? 1 : 0,
        transition: `all 0.8s ease-out ${delay}s`,
    });

    return (
        <div className="flex flex-col w-full bg-stone-50">
            {/* Floating disclaimer */}
            <div className="relative md:absolute z-[10] top-[10] md:left-4 md:right-4 flex flex-col items-center justify-center">
                <Alert className="w-full md:max-w-md backdrop-blur-sm">
                    <Shield className="w-4 h-4 text-red-600" />
                    <AlertTitle className="text-xs font-semibold text-red-600">
                        Important Disclaimer
                    </AlertTitle>
                    <AlertDescription className="text-xs text-gray-500">
                        This is not an official IEBC tallying system. Kura Zetu is a
                        citizen-led initiative for transparency.
                    </AlertDescription>
                </Alert>
            </div>

            {/* Hero Section */}
            <section className="relative md:min-h-[70vh] flex flex-col w-full overflow-hidden md:px-6 md:py-20 md:flex-row">
                <div className="flex mx-auto md:max-w-7xl">
                    <div className="grid items-center gap-12 lg:grid-cols-2">
                        <div className="text-center lg:text-left">
                            <h1
                                className="mb-6 text-5xl font-bold leading-tight md:text-6xl lg:text-7xl text-stone-900"
                                style={fadeInUp(0)}
                            >
                                KuraZetu:{" "}
                                <span className="relative">
                                    Election results, uploaded{" "}
                                    <div className="absolute left-0 w-full h-3 -bottom-2 bg-green-400/30 -rotate-1"></div>
                                </span>
                                by
                                <span className="underline decoration-red-400 decoration-4 underline-offset-8">
                                    {" "}
                                    you.
                                </span>
                            </h1>

                            <p
                                className="max-w-lg mx-auto mb-8 text-lg md:text-xl text-stone-600 lg:mx-0"
                                style={fadeInUp(0.2)}
                            >
                                Empowering Kenyans to track, verify, and tally election
                                results at the polling station level (from MCA to
                                President). Built by the community, for the community .
                            </p>

                            <div
                                className="flex flex-col justify-center gap-4 mb-8 sm:flex-row lg:justify-start"
                                style={fadeInUp(0.4)}
                            >
                                <a
                                href= "/accounts/login/"

                                className="px-8 py-4 text-lg font-semibold text-white transition-all duration-300 transform bg-green-600 rounded-full shadow-lg hover:bg-green-700 hover:scale-105">
                                    Get started
                                </a>
                                <a
                                    href="https://kurazetu.readthedocs.io/"
                                    target="_blank"
                                    className="flex flex-row items-center px-8 py-4 text-lg font-semibold transition-all duration-300 border-2 rounded-full justify-evenly border-stone-300 hover:border-stone-400 text-stone-700 hover:text-stone-900"
                                >
                                    <FileText className="w-4 h-4" />
                                    <p className="ml-4">Documentation</p>
                                </a>
                            </div>

                            {/* Action Buttons */}
                            <div
                                className="grid w-full grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4"
                                style={fadeInUp(0.6)}
                            >
                                <a
                                    href="https://github.com/shamash92/KuraZetu.git"
                                    target="_blank"
                                    className="flex items-center justify-center px-4 py-3 space-x-2 text-sm text-white transition-all duration-300 rounded-lg bg-stone-800 hover:bg-stone-900"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="w-6 h-6 mr-2 "
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.337 4.695-4.566 4.944.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.744 0 .268.18.579.688.481C19.138 20.2 22 16.448 22 12.021 22 6.484 17.523 2 12 2z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span>Contribute</span>
                                </a>
                                <a
                                    href="/ui/download-apk/"
                                    className="flex items-center justify-center px-4 py-3 space-x-2 text-sm text-green-800 transition-all duration-300 bg-green-100 rounded-lg hover:bg-green-200"
                                >
                                    <Smartphone className="w-4 h-4" />
                                    <span>Android</span>
                                </a>
                                <button className="flex items-center justify-center px-4 py-3 space-x-2 text-sm text-gray-500 bg-gray-100 rounded-lg cursor-not-allowed">
                                    <Smartphone className="w-4 h-4" />
                                    <span>iOS (Coming Soon)</span>
                                </button>

                                <a
                                    href="/ui/game/"
                                    className="flex items-center justify-center px-4 py-3 space-x-2 text-sm text-red-800 transition-all duration-300 bg-red-100 rounded-lg hover:bg-red-200"
                                >
                                    <GamepadIcon className="w-4 h-4" />
                                    <span>PinVerify254</span>
                                </a>
                            </div>
                        </div>

                        {/* Phone Mockup */}
                        <div className="relative" style={scaleIn(0.6)}>
                            <div className="relative mx-auto w-80 h-[600px] bg-black rounded-[3rem] p-2 shadow-2xl">
                                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                                    {/* Phone screen content */}
                                    <div className="p-6">
                                        {/* Status bar */}
                                        <div className="flex items-center justify-between mb-8 text-sm">
                                            <span className="font-semibold">9:41</span>
                                            <div className="flex items-center space-x-1">
                                                <div className="w-4 h-2 rounded-sm bg-stone-300"></div>
                                                <div className="w-6 h-3 border rounded-sm border-stone-300">
                                                    <div className="w-4 h-1 bg-green-500 rounded-sm m-0.5"></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* App content */}
                                        <div className="mb-6">
                                            <h2 className="mb-2 text-2xl font-bold">
                                                Hello, Wanjiku
                                            </h2>
                                            <p className="text-stone-600">
                                                Check your constituency results
                                            </p>
                                        </div>

                                        {/* Quick actions */}
                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="text-center">
                                                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-green-100 rounded-2xl">
                                                    <Vote className="w-6 h-6 text-green-600" />
                                                </div>
                                                <span className="text-xs text-stone-600">
                                                    Presidential
                                                </span>
                                            </div>
                                            <div className="text-center">
                                                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-red-100 rounded-2xl">
                                                    <Users className="w-6 h-6 text-red-600" />
                                                </div>
                                                <span className="text-xs text-stone-600">
                                                    Governor
                                                </span>
                                            </div>
                                            <div className="text-center">
                                                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-blue-100 rounded-2xl">
                                                    <UserCheck className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <span className="text-xs text-stone-600">
                                                    MP
                                                </span>
                                            </div>
                                            <div className="text-center">
                                                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-orange-100 rounded-2xl">
                                                    <Eye className="w-6 h-6 text-orange-600" />
                                                </div>
                                                <span className="text-xs text-stone-600">
                                                    MCA
                                                </span>
                                            </div>
                                        </div>

                                        {/* Recent searches */}
                                        <div className="mb-6">
                                            <h3 className="mb-3 font-semibold text-stone-900">
                                                Your Constituency
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            Westlands
                                                        </p>
                                                        <p className="text-xs text-stone-500">
                                                            Nairobi County
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="px-2 py-1 text-xs text-green-700 bg-green-100 rounded-full">
                                                            Verified
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quick results */}
                                        <div>
                                            <h3 className="mb-3 font-semibold text-stone-900">
                                                Latest Results
                                            </h3>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                                                    <span className="text-sm">
                                                        Presidential Results
                                                    </span>
                                                    <span className="px-2 py-1 text-xs text-green-700 bg-green-100 rounded-full">
                                                        89% Counted
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                                                    <span className="text-sm">
                                                        Governor Race
                                                    </span>
                                                    <span className="px-2 py-1 text-xs text-red-700 bg-red-100 rounded-full">
                                                        Live
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating elements */}
                            {/* Floating Notification: Candidate Leading */}
                            <div
                                className="absolute p-4 bg-white shadow-lg -left-8 top-20 rounded-2xl"
                                style={fadeInUp(1)}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                                        <Trophy className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">
                                            Candidate Z
                                        </p>
                                        <p className="text-xs text-stone-500">
                                            Leading in Westlands
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Card: Nairobi Election Summary */}
                            <div
                                className="absolute p-4 bg-white shadow-lg -right-8 top-32 rounded-2xl w-52"
                                style={fadeInUp(1.2)}
                            >
                                <h4 className="mb-2 text-sm font-semibold text-stone-900">
                                    Nairobi County
                                </h4>
                                <ul className="space-y-1 text-xs text-stone-600">
                                    <li>Presidential: 93% tallied</li>
                                    <li>Governor: 85% tallied</li>
                                    <li>Senate: 90% tallied</li>
                                    <li>Women Rep: 87% tallied</li>
                                </ul>
                            </div>

                            {/* Floating Alert: Discrepancy Found */}
                            <div
                                className="absolute p-4 bg-red-100 shadow-lg -right-12 bottom-20 rounded-2xl"
                                style={fadeInUp(1.6)}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center justify-center w-10 h-10 bg-red-200 rounded-full">
                                        <AlertTriangle className="w-5 h-5 text-red-700" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-red-800">
                                            Alert
                                        </p>
                                        <p className="text-xs text-stone-600">
                                            Discrepancy at Station 114B
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Card: Tally Update */}
                            <div
                                className="absolute w-64 p-3 shadow-lg left-4 bottom-8 bg-lime-400 text-stone-900 rounded-xl"
                                style={fadeInUp(1.8)}
                            >
                                <div className="mb-1 text-sm font-semibold">
                                    Presidential Tally
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="text-xs">
                                        <div className="text-lg font-bold">
                                            93% Counted
                                        </div>
                                        <div className="text-stone-700">
                                            National Average
                                        </div>
                                    </div>
                                    <PieChart className="w-6 h-6 text-stone-800" />
                                </div>
                                <button className="w-full px-4 py-2 mt-3 text-xs font-semibold transition-colors bg-white rounded-lg hover:bg-stone-100 text-stone-800">
                                    View Full Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Hero;
