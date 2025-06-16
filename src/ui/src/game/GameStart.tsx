import {MapPin, Target, Trophy} from "lucide-react";

import {Button} from "../@/components/ui/button";
import {TLevel} from "./types";
import {motion} from "framer-motion";
import {useAuth} from "../App";

interface GameStartProps {
    onStart: (level: TLevel | null) => void;
}

export default function GameStart({onStart}: GameStartProps) {
    let auth = useAuth();

    console.log(auth, "auth from game start");

    return (
        <div className="flex items-center justify-center w-full min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
            <motion.div
                initial={{opacity: 0, scale: 0.8}}
                animate={{opacity: 1, scale: 1}}
                transition={{duration: 0.6}}
                className="max-w-lg p-8 mx-auto text-center text-white"
            >
                <motion.div
                    initial={{y: -20}}
                    animate={{y: 0}}
                    transition={{delay: 0.2, duration: 0.5}}
                    className="mb-8"
                >
                    <div className="flex justify-center w-full mb-4 ">
                        <div className="relative">
                            <MapPin className="w-16 h-16 text-blue-400" />
                            <motion.div
                                animate={{scale: [1, 1.2, 1]}}
                                transition={{
                                    repeat: Number.POSITIVE_INFINITY,
                                    duration: 2,
                                }}
                                className="absolute -top-1 -right-1"
                            >
                                <Target className="w-6 h-6 text-yellow-400" />
                            </motion.div>
                        </div>
                    </div>
                    <h1 className="mb-4 text-4xl font-bold">KuraZetu: PinVerify254</h1>
                    <p className="mb-8 text-xl text-blue-200">
                        Help verify the locations of polling centers across Kenya and
                        support transparent elections!
                    </p>
                </motion.div>

                <motion.div
                    initial={{y: 20, opacity: 0}}
                    animate={{y: 0, opacity: 1}}
                    transition={{delay: 0.4, duration: 0.5}}
                    className="space-y-4"
                >
                    <div className="p-6 mb-6 rounded-lg bg-white/10 backdrop-blur-sm">
                        <h3 className="flex items-center gap-2 mb-3 text-lg font-semibold">
                            <Trophy className="w-5 h-5 text-yellow-400" />
                            How to Participate
                        </h3>
                        <ul className="space-y-2 text-sm text-left text-blue-100">
                            <li>
                                • Review the pin location for a polling center on the
                                map
                            </li>
                            <li>
                                • Select YES if the polling center is correctly placed
                                (+10 points)
                            </li>
                            <li>
                                • Select NO/EDIT to move the pin to the correct location
                                (+15 points)
                            </li>
                            <li>• Select SKIP if you are unsure (+2 points)</li>
                        </ul>
                    </div>

                    <div>
                        <p>
                            You can{" "}
                            <a
                                className="text-blue-400 underline"
                                href="/accounts/login/"
                            >
                                login
                            </a>{" "}
                            to start with centers in your ward
                        </p>
                    </div>

                    <Button
                        onClick={() => onStart(null)}
                        size="lg"
                        className="w-full py-4 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Start with Random Polling Centers
                    </Button>

                    {auth && (
                        <>
                            <h2 className="mb-4">OR</h2>
                            <Button
                                onClick={() => onStart("ward")}
                                size="lg"
                                className="w-full py-4 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Start with your Ward
                            </Button>
                            <Button
                                onClick={() => onStart("constituency")}
                                size="lg"
                                className="w-full py-4 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Start with your Constituency
                            </Button>{" "}
                            <Button
                                onClick={() => onStart("county")}
                                size="lg"
                                className="w-full py-4 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Start with your County
                            </Button>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
}
