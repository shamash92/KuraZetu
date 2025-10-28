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

import {Alert, AlertDescription, AlertTitle} from "../@/components/ui/alert";

const Footer = () => {
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
        <div className="px-6 py-12 bg-white border-t border-stone-200">
            <div className="mx-auto max-w-7xl">
                <div className="flex flex-col items-center justify-between md:flex-row">
                    <div className="mb-4 text-2xl font-bold text-stone-900 md:mb-0">
                        Kurazetu<span className="text-red-500">.</span>
                    </div>
                    <div className="flex space-x-8 text-stone-600">
                        <a href="#" className="transition-colors hover:text-stone-900">
                            Privacy
                        </a>
                        <a href="#" className="transition-colors hover:text-stone-900">
                            Terms
                        </a>
                        <a href="#" className="transition-colors hover:text-stone-900">
                            Contact
                        </a>
                    </div>
                </div>
                <div className="pt-8 mt-8 text-sm text-center border-t border-stone-200 text-stone-500">
                    © 2025 Shamash. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default Footer;
