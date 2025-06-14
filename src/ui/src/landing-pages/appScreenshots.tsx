"use client";

import {useEffect} from "react";
import {motion, useAnimationControls} from "framer-motion";

export default function AppScreenshots() {
    // Create animation controls for each screenshot
    const controlsLeft = useAnimationControls();
    const controlsRight = useAnimationControls();

    // Run the animation sequence when the component mounts
    useEffect(() => {
        const animateScreenshots = async () => {
            // Start with a slight delay
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Animate both screenshots simultaneously
            await Promise.all([
                controlsLeft.start({
                    x: "-30%",
                    rotate: -5,
                    transition: {
                        type: "spring",
                        stiffness: 100,
                        damping: 15,
                        duration: 0.8,
                    },
                }),
                controlsRight.start({
                    x: "30%",
                    rotate: 5,
                    transition: {
                        type: "spring",
                        stiffness: 100,
                        damping: 15,
                        duration: 0.8,
                    },
                }),
            ]);
        };

        animateScreenshots();
    }, [controlsLeft, controlsRight]);

    return (
        <div className="w-full hidden md:flex md:w-[40vw] mx-auto h-[40vh] relative ">
            <div className="relative flex items-center justify-center w-full h-full">
                {/* Left Screenshot */}
                <motion.div
                    className="absolute w-[65%] max-w-[200px]"
                    initial={{x: "-5%", rotate: -2, opacity: 0}}
                    animate={controlsLeft}
                    whileInView={{opacity: 1}}
                    viewport={{once: true}}
                    transition={{opacity: {duration: 0.5}}}
                >
                    <div className="relative w-full overflow-hidden shadow-lg rounded-2xl">
                        <div className="aspect-[9/19] flex w-full border-red-900 border-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-1">
                            <div className="w-full h-full overflow-hidden rounded-xl">
                                <img
                                    src="https://kurazetu.s3.eu-west-1.amazonaws.com/static/images/landing-page/dashboard.png"
                                    alt="App Screenshot 1"
                                    className="object-contain h-full"
                                />
                            </div>

                            {/* Phone notch */}
                            <div className="absolute w-1/3 h-5 transform -translate-x-1/2 bg-black rounded-full top-2 left-1/2"></div>

                            {/* Reflection overlay */}
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Screenshot */}
                <motion.div
                    className="absolute w-[65%] max-w-[200px]"
                    initial={{x: "5%", rotate: 2, opacity: 0}}
                    animate={controlsRight}
                    whileInView={{opacity: 1}}
                    viewport={{once: true}}
                    transition={{opacity: {duration: 0.5, delay: 0.2}}}
                >
                    <div className="relative w-full overflow-hidden shadow-lg rounded-2xl">
                        <div className="aspect-[9/19] w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-1">
                            <div className="w-full h-full overflow-hidden rounded-xl">
                                <img
                                    src="https://kurazetu.s3.eu-west-1.amazonaws.com/static/images/landing-page/verify-centers.png"
                                    alt="App Screenshot 2"
                                    className="object-cover w-full h-full"
                                />
                            </div>

                            {/* Phone notch */}
                            <div className="absolute w-1/3 h-5 transform -translate-x-1/2 bg-black rounded-full top-2 left-1/2"></div>

                            {/* Reflection overlay */}
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
