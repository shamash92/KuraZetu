import {useEffect, useState} from "react";
import {useAuth} from "../App";

import {Menu, X} from "lucide-react";
import {a} from "framer-motion/dist/types.d-B_QPEvFK";

export default function NavComponent() {
    const [isVisible, setIsVisible] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const authInfo = useAuth();
    // console.log("Auth Info:", authInfo);
    return (
        <header className="relative z-50 border-b bg-white/80 backdrop-blur-sm border-stone-200">
            <div className="px-6 mx-auto max-w-7xl">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <a href="/" className="text-2xl font-bold text-stone-900">
                            KuraZetu<span className="text-red-500">.</span>
                        </a>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="items-center hidden space-x-8 md:flex">
                        <a
                            href="/ui/game/"
                            className="font-medium transition-colors text-stone-700 hover:text-stone-900"
                        >
                            pinVerify254
                        </a>
                        <a
                            href="https://github.com/shamash92/KuraZetu.git"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium transition-colors text-stone-700 hover:text-stone-900"
                        >
                            Contribute
                        </a>
                        <a
                            href="#"
                            className="font-medium transition-colors text-stone-700 hover:text-stone-900"
                        >
                            About
                        </a>
                        <a
                            href="/api/schema/swagger/"
                            className="font-medium transition-colors text-stone-700 hover:text-stone-900"
                        >
                            API
                        </a>
                    </nav>

                    {authInfo ? (
                        <div className="items-center hidden space-x-4 md:flex">
                            <a
                                href="/accounts/logout/"
                                className="px-6 py-2 font-semibold text-white transition-all duration-300 transform bg-red-600 rounded-full shadow-md hover:bg-green-700 hover:scale-105"
                            >
                                Logout
                            </a>
                        </div>
                    ) : (
                        <div className="items-center hidden space-x-4 md:flex">
                            <a
                                href="/accounts/login/"
                                className="px-6 py-2 font-semibold text-white transition-all duration-300 transform bg-green-600 rounded-full shadow-md hover:bg-green-700 hover:scale-105"
                            >
                                Login
                            </a>
                            <a
                                href="/ui/signup/"
                                className="px-6 py-2 font-semibold transition-all duration-300 border rounded-full border-stone-300 hover:border-stone-400 text-stone-700 hover:text-stone-900"
                            >
                                Register
                            </a>
                        </div>
                    )}

                    {/* Mobile menu button */}
                    <button
                        className="p-2 md:hidden"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="absolute left-0 w-full bg-white border-b shadow-lg md:hidden top-16 border-stone-200">
                    <div className="px-6 py-4 space-y-4">
                        <a
                            href="/ui/game/"
                            className="block font-medium text-stone-700"
                        >
                            pinVerify254
                        </a>
                        <a
                            href="https://github.com/shamash92/KuraZetu.git"
                            className="block font-medium text-stone-700"
                        >
                            Contribute
                        </a>
                        <a href="#" className="block font-medium text-stone-700">
                            About
                        </a>
                        <a
                            href="/api/schema/swagger/"
                            className="block font-medium text-stone-700"
                        >
                            API
                        </a>
                        {authInfo ? (
                            <a
                                href="/accounts/logout/"
                                className="block px-6 py-2 font-semibold text-white bg-red-600 rounded-full"
                            >
                                Logout
                            </a>
                        ) : (
                            <>
                                <a
                                    href="/accounts/login/"
                                    className="block px-6 py-2 font-semibold text-white bg-green-600 rounded-full"
                                >
                                    Login
                                </a>
                                <a
                                    href="/ui/signup/"
                                    className="block px-6 py-2 font-semibold border rounded-full border-stone-300 text-stone-700"
                                >
                                    Sign Up
                                </a>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
