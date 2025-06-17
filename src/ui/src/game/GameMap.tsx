import {Alert, AlertDescription} from "../@/components/ui/alert";
import {AnimatePresence, motion} from "framer-motion";
import {CheckCircle, Edit, HelpCircle, MapPin, Trophy} from "lucide-react";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "../@/components/ui/drawer";
import {Home, Minus, Plus, ThumbsUp} from "lucide-react";
import {IPollingCenterFeature, TLevel} from "./types";
import {useEffect, useState} from "react";

import {Badge} from "../@/components/ui/badge";
import {Button} from "../@/components/ui/button";
import MapComponent from "./Map";
import PinEditComponent from "./PinEditComponent";
import cookie from "react-cookies";
import {toast} from "sonner";

interface GameMapProps {
    score: number;
    level: TLevel | null;
    onAddPoints: (points: number) => void;
}

export default function GameMap({score, level, onAddPoints}: GameMapProps) {
    const [currentLocation, setCurrentLocation] =
        useState<IPollingCenterFeature | null>(null);

    const [partiallyVerifiedLocations, setPartiallyVerifiedLocations] = useState<
        IPollingCenterFeature[] | null
    >(null);

    const [isEditing, setIsEditing] = useState(false);
    const [showConfirmDrawer, setShowConfirmDrawer] = useState(false);
    const [newPosition, setNewPosition] = useState<{lat: number; lng: number} | null>(
        null,
    );
    const [showAlert, setShowAlert] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    const [reload, setReload] = useState(false);

    const [suggestedLocation, setSuggestedLocation] =
        useState<IPollingCenterFeature | null>(null);

    const [alreadyVerifiedByUser, setAlreadyVerifiedByUser] = useState(false);
    const [alreadyVerifiedData, setAlreadyVerifiedData] =
        useState<IPollingCenterFeature | null>(null);

    const toggleReload = () => {
        setReload((prev) => !prev);
    };

    const [isDrawerOpen, setDrawerOpen] = useState(false);

    const handleCloseDrawer = () => setDrawerOpen(false);

    const csrfToken = cookie.load("csrftoken");

    const handleAlreadyVerified = (data: IPollingCenterFeature) => {
        setAlreadyVerifiedByUser(true);
        setAlreadyVerifiedData(data);
    };

    useEffect(() => {
        fetch(`/api/stations/polling-centers/unverified/random/${level}/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken,
            },
            credentials: "include",
        })
            .then((response) => response.json())
            .then((data) => {
                if (data["error"] === "You have already verified this polling center") {
                    toast.error("You have already verified this polling center");

                    handleAlreadyVerified(data["data"]);
                }
                let unverifiedPollingCenter = data["data"];
                console.log(unverifiedPollingCenter, "unverified data");

                let partiallyVerifiedPollingCenters = data["partially_verified"];

                console.log(partiallyVerifiedPollingCenters, "partially verified data");

                if (
                    partiallyVerifiedPollingCenters !== undefined &&
                    partiallyVerifiedPollingCenters.features.length > 0
                ) {
                    setPartiallyVerifiedLocations(
                        partiallyVerifiedPollingCenters.features,
                    );
                }
                if (unverifiedPollingCenter !== null) {
                    setCurrentLocation(unverifiedPollingCenter);
                }
            })
            .catch((error) => {
                console.error("Error fetching locations:", error);
            });
    }, [reload]);

    const handlePinAPIPost = async (
        latitude: number,
        longitude: number,
        pollingCenterDBId: number,
        isUpvote: boolean,
    ) => {
        try {
            const response = await fetch(`/api/stations/polling-centers/verify/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken,
                },
                credentials: "include",
                body: JSON.stringify({
                    latitude: latitude,
                    longitude: longitude,
                    pollingCenterDBId: pollingCenterDBId,
                    isUpvote: isUpvote,
                }),
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const data = await response.json();
            console.log("Location verified:", data);
            return data;
        } catch (error) {
            console.error("Error verifying location:", error);
            throw error;
        }
    };

    const handleYes = async () => {
        if (!currentLocation) {
            toast.error("No current location to verify");
            return;
        }

        let x = await handlePinAPIPost(
            currentLocation?.properties.pin_location.coordinates[1],
            currentLocation?.properties.pin_location.coordinates[0],
            currentLocation?.id,
            true,
        );

        console.log(x, "this is x");

        if (x.error) {
            toast.error(x.error);
            return;
        }
        if (x.message === "Polling Center location upvoted successfully") {
            toast.success("Pin location upvote successful!");
            toggleReload();
            setCurrentLocation(null); // Clear current location
        }
    };

    const handleUpdatedPinAndBoundary = async (pollingCenterDBId: number) => {
        const csrfToken = cookie.load("csrftoken");

        try {
            const response = await fetch(
                `/api/stations/polling-centers/partially-verified/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrfToken,
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        pollingCenterDBId: pollingCenterDBId,
                    }),
                },
            );

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const data = await response.json();
            console.log("Data get after upload", data);

            setSuggestedLocation(data["data"]);

            return data;
        } catch (error) {
            console.error("Error updating pin and boundary:", error);
            throw error;
        }
    };

    const handlePinUpdate = async (lat: number, lng: number) => {
        setNewPosition({lat, lng});
        handlePinAPIPost(
            lat,
            lng,
            currentLocation?.id || 0, // Use 0 if id is not available
            false,
        ).then((data) => {
            console.log(data, "data from pin update in secondary function");
            // close drawer

            onAddPoints(15);

            if (data.error) {
                toast.error(data.error);
                return;
            }
            toast.success("Pin location updated successfully!");

            // return data; // Return data if needed

            handleCloseDrawer();

            if (currentLocation) {
                handleUpdatedPinAndBoundary(currentLocation.id);
            }

            // nextLocation(); // Uncomment if you have a function to go to the next location
        });
    };

    const handleNoEdit = () => {
        setShowAlert(true);
        setIsEditing(true);
        setTimeout(() => setShowAlert(false), 3000);
    };

    const handleSkip = () => {
        onAddPoints(0.1);
        // nextLocation();
        setCurrentLocation(null); // Clear current location

        toggleReload(); // Trigger reload to fetch new location
    };

    const handlePinDrag = (lat: number, lng: number) => {
        if (isEditing) {
            setNewPosition({lat, lng});
            setShowConfirmDrawer(true);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-[1000] bg-white/95 shadow-md backdrop-blur-lg">
                <div className="flex items-center justify-between px-6 py-3 mx-auto">
                    <a
                        href="/ui"
                        className="flex items-center gap-2 font-semibold text-blue-700 transition-colors hover:text-blue-900"
                        style={{
                            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                        }}
                    >
                        <Home className="w-4 h-4" />
                        <span className="text-sm tracking-tight ">Go Home</span>
                    </a>

                    <a
                        href="/ui/game"
                        className="flex items-center gap-2 font-semibold text-blue-700 transition-colors hover:text-blue-900"
                        style={{
                            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                        }}
                    >
                        <MapPin className="w-6 h-6" />
                        <span className="font-extrabold tracking-tight text-md ">
                            PinVerify254
                        </span>
                    </a>
                    <Badge
                        variant="secondary"
                        className="flex items-center gap-2 px-3 py-1 font-medium text-yellow-800 border border-yellow-200 rounded-full shadow-sm bg-yellow-50"
                        style={{
                            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                        }}
                    >
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="text-base">{score.toFixed(1)} points</span>
                    </Badge>
                </div>
            </header>

            {/* Alert for editing mode */}
            <AnimatePresence>
                {showAlert && (
                    <motion.div
                        initial={{opacity: 0, y: -50}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -50}}
                        className="absolute top-[20vh] left-4 right-4 z-[1000]"
                    >
                        <Alert className="border-blue-200 bg-blue-50">
                            <Edit className="w-4 h-4" />
                            <AlertDescription>
                                Drag the pin to the correct location, then confirm your
                                edit.
                            </AlertDescription>
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Map */}

            <div className="absolute inset-0 pt-16">
                {currentLocation && alreadyVerifiedByUser === false ? (
                    <MapComponent
                        location={currentLocation}
                        onPinDrag={handlePinDrag}
                        isEditing={isEditing}
                        suggestedLocation={suggestedLocation ? suggestedLocation : null}
                        partiallyVerifiedLocations={
                            partiallyVerifiedLocations
                                ? partiallyVerifiedLocations
                                : null
                        }
                    />
                ) : alreadyVerifiedByUser ? (
                    <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-b from-blue-50 to-blue-200">
                        <div className="flex flex-col items-center gap-4 p-8 bg-white shadow-xl rounded-2xl">
                            <CheckCircle className="w-16 h-16 mb-2 text-green-500" />
                            <h2 className="text-2xl font-bold text-gray-800">
                                Already Verified!
                            </h2>
                            <p className="text-lg text-center text-gray-600">
                                You have already verified
                                <span className="block mt-1 font-semibold text-blue-700">
                                    {alreadyVerifiedData?.properties.name}
                                </span>
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-b from-gray-50 to-gray-200">
                        <svg
                            className="w-10 h-10 mb-4 text-blue-500 animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            ></path>
                        </svg>
                        <p className="text-lg font-medium text-gray-700">
                            Loading next pin location...
                        </p>
                    </div>
                )}
            </div>

            {/* Location Info */}
            <AnimatePresence>
                {currentLocation && (
                    <motion.div
                        initial={{opacity: 0, y: -20}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -20}}
                        transition={{duration: 0.25}}
                        className="absolute top-24 left-12 md:left-1/4 -translate-x-1/2 z-[1000] w-[75vw] md:w-[90vw] max-w-md bg-white/95 rounded-2xl shadow-2xl border border-gray-200 p-2 md:p-6"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <MapPin className="w-5 h-5 text-blue-500" />
                            <h3 className="text-sm font-bold text-gray-900 md:text-xl">
                                {currentLocation.properties.name}
                            </h3>
                        </div>
                        <div className="mb-2 space-y-1">
                            <div className="flex items-center gap-2 text-xs text-gray-700 md:text-sm">
                                <span className="font-medium">
                                    {currentLocation.properties.ward}
                                </span>
                                <span className="text-gray-400">Ward</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-700 md:text-sm">
                                <span className="font-medium">
                                    {currentLocation.properties.constituency}
                                </span>
                                <span className="text-gray-400">Constituency</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-700 md:text-sm">
                                <span className="font-bold">
                                    {currentLocation.properties.county}
                                </span>
                            </div>
                        </div>
                        {currentLocation.properties.pin_location_error ? (
                            <div className="flex items-center gap-2 px-2 py-1 mt-2 text-sm text-red-600 rounded bg-red-50">
                                <HelpCircle className="w-4 h-4" />
                                <span>
                                    Error:{" "}
                                    {currentLocation.properties.pin_location_error}
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-2 py-1 mt-2 text-sm text-green-700 rounded bg-green-50">
                                <CheckCircle className="w-4 h-4" />
                                <span>No errors reported</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                            <span>
                                <span className="font-semibold">Lat:</span>{" "}
                                {currentLocation.properties.pin_location.coordinates[1].toFixed(
                                    5,
                                )}
                            </span>
                            <span>
                                <span className="font-semibold">Lng:</span>{" "}
                                {currentLocation.properties.pin_location.coordinates[0].toFixed(
                                    5,
                                )}
                            </span>
                        </div>

                        <div className="flex flex-row items-center gap-2 mt-4 text-gray-500">
                            <ThumbsUp className="inline w-4 h-4 mr-2 text-green-500" />
                            <span className="font-semibold">Upvotes:</span>{" "}
                            {currentLocation.properties.location_upvotes}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Action Buttons */}

            {suggestedLocation ? (
                <div className="absolute bottom-8 left-0 w-[100vw]   z-[1000] ">
                    <div className="flex items-center justify-center w-full gap-4 ">
                        <Button
                            onClick={() => {
                                toggleReload();
                                setSuggestedLocation(null);
                                setCurrentLocation(null);
                            }}
                            className="w-full h-12 px-6 py-3 text-white bg-green-600 rounded-full shadow-lg md:w-1/4 hover:bg-green-700"
                        >
                            <MapPin className="w-10 h-10 text-white-500" />
                            <span className="text-xl font-bold text-white-900 md:text-lg">
                                Proceed
                            </span>
                        </Button>
                    </div>
                </div>
            ) : alreadyVerifiedByUser ? (
                <div className="absolute bottom-8 left-0 w-[100vw]   z-[1000] ">
                    <div className="flex items-center justify-center w-full gap-4 ">
                        <Button
                            onClick={() => {
                                toggleReload();
                                setAlreadyVerifiedByUser(false);
                                setCurrentLocation(null);
                            }}
                            className="w-full h-12 px-6 py-3 text-white bg-gray-400 rounded-full shadow-lg md:w-1/4 hover:bg-gray-500"
                        >
                            <CheckCircle className="w-10 h-10 text-white-500" />
                            <span className="text-xl font-bold text-white-900 md:text-lg">
                                Load another
                            </span>
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1000]">
                    <div className="flex gap-4">
                        <motion.div whileHover={{scale: 1.05}} whileTap={{scale: 0.95}}>
                            <Button
                                onClick={handleYes}
                                className="px-6 py-3 text-white bg-green-600 rounded-full shadow-lg hover:bg-green-700"
                            >
                                <ThumbsUp className="w-5 h-5" />
                                Correct Pin{" "}
                            </Button>
                        </motion.div>

                        <Drawer open={isDrawerOpen} onOpenChange={setDrawerOpen}>
                            <DrawerTrigger asChild>
                                <Button
                                    variant="destructive"
                                    className="px-6 py-3 bg-gray-400 rounded-full shadow-lg"
                                >
                                    <Edit className="w-5 h-5 mr-2" />
                                    EDIT (+15)
                                </Button>
                            </DrawerTrigger>
                            <DrawerContent className="w-full h-[99vh] bg-gray-100">
                                <div className="flex flex-col justify-start w-full mx-auto bg-white backdrop-blur-sm">
                                    <DrawerHeader className="py-0 my-0 ">
                                        <DrawerTitle>
                                            Edit {currentLocation?.properties.name}
                                        </DrawerTitle>
                                    </DrawerHeader>
                                    <div className="pb-0 md:p-4">
                                        {currentLocation && (
                                            <PinEditComponent
                                                initialPosition={{
                                                    lat: currentLocation.properties
                                                        .pin_location.coordinates[1],
                                                    lng: currentLocation.properties
                                                        .pin_location.coordinates[0],
                                                }}
                                                onSave={async (
                                                    lat: number,
                                                    lng: number,
                                                ) => {
                                                    // Handle save logic here
                                                    console.log(
                                                        `New coordinates: ${lat}, ${lng}`,
                                                    );

                                                    let y = await handlePinUpdate(
                                                        lat,
                                                        lng,
                                                    );
                                                    console.log(y, " yyyyyyyyy");
                                                    return y;
                                                }}
                                            />
                                        )}
                                    </div>
                                    <DrawerFooter>
                                        <DrawerClose asChild>
                                            <Button
                                                variant="outline"
                                                className="text-white bg-gray-700 border-gray-300 hover:bg-black"
                                            >
                                                Cancel
                                            </Button>
                                        </DrawerClose>
                                    </DrawerFooter>
                                </div>
                            </DrawerContent>
                        </Drawer>

                        <motion.div whileHover={{scale: 1.05}} whileTap={{scale: 0.95}}>
                            <Button
                                onClick={handleSkip}
                                variant="destructive"
                                className="z-auto px-6 py-3 text-white bg-red-500 rounded-full shadow-lg"
                            >
                                <HelpCircle className="w-5 h-5 mr-2" />
                                SKIP (+2)
                            </Button>
                        </motion.div>
                    </div>
                </div>
            )}
        </div>
    );
}
