import {useEffect, useState} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {Button} from "../@/components/ui/button";
import {Badge} from "../@/components/ui/badge";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerFooter,
} from "../@/components/ui/drawer";
import {Alert, AlertDescription} from "../@/components/ui/alert";
import {Trophy, MapPin, CheckCircle, HelpCircle, Edit} from "lucide-react";
import MapComponent from "./Map";
import {IPollingCenterFeature, TLevel} from "./types";
import {toast} from "sonner";
import cookie from "react-cookies";

interface GameMapProps {
    score: number;
    level: TLevel | null;
    onAddPoints: (points: number) => void;
}

interface Location {
    id: string;
    lat: number;
    lng: number;
    name: string;
    description: string;
    imageUrl: string;
}

export default function GameMap({score, level, onAddPoints}: GameMapProps) {
    const [currentLocation, setCurrentLocation] =
        useState<IPollingCenterFeature | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showConfirmDrawer, setShowConfirmDrawer] = useState(false);
    const [newPosition, setNewPosition] = useState<{lat: number; lng: number} | null>(
        null,
    );
    const [showAlert, setShowAlert] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    const [reload, setReload] = useState(false);

    const toggleReload = () => {
        setReload((prev) => !prev);
    };

    const csrfToken = cookie.load("csrftoken");

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
                    setCurrentLocation(null); // Clear current location
                    toggleReload(); // Trigger reload to fetch new location
                    return;
                }
                let unverifiedPollingCenter = data["data"];
                console.log(unverifiedPollingCenter, "unverified data");
                setCurrentLocation(unverifiedPollingCenter);
            })
            .catch((error) => {
                console.error("Error fetching locations:", error);
            });
    }, [reload]);

    const handleYes = () => {
        const csrfToken = cookie.load("csrftoken");

        console.log(csrfToken, "csrf token");

        fetch(`/api/stations/polling-centers/verify/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken,
            },
            credentials: "include",
            body: JSON.stringify({
                latitude: currentLocation?.properties.pin_location.coordinates[1],
                longitude: currentLocation?.properties.pin_location.coordinates[0],
                pollingCenterDBId: currentLocation?.id,
            }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then((data) => {
                console.log("Location verified:", data);
                console.log(data["message"], "message");
                console.log(
                    data["message"] === "Suggested pin saved successfully",
                    "message check",
                );

                if (data["message"] === "Suggested pin saved successfully") {
                    toast.success("Location verified successfully!");
                    onAddPoints(10);
                    setCurrentLocation(null); // Clear current location
                    toggleReload(); // Trigger reload to fetch new location
                }
            })
            .catch((error) => {
                console.error("Error verifying location:", error);
                setIsVerifying(false);
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

    const confirmEdit = async () => {
        if (newPosition) {
            setIsVerifying(true);

            // Simulate API call with new position
            try {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                onAddPoints(15);
                setShowConfirmDrawer(false);
                // nextLocation();
            } catch (error) {
                console.error("Edit confirmation failed:", error);
            } finally {
                setIsVerifying(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-[1000] bg-white/90 backdrop-blur-sm border-b">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <MapPin className="w-6 h-6 text-blue-600" />
                        <h1 className="text-xl font-bold">PinVerify254</h1>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-600" />
                        {score} points
                    </Badge>
                </div>
            </div>

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
                {currentLocation ? (
                    <MapComponent
                        location={currentLocation}
                        onPinDrag={handlePinDrag}
                        isEditing={isEditing}
                    />
                ) : (
                    <p>Loading current location</p>
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
                        className="absolute top-24 left-12 md:left-1/4 -translate-x-1/2 z-[1000] w-[75vw] md:w-[90vw] max-w-md bg-white/95 rounded-2xl shadow-2xl border border-gray-200 p-6"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <MapPin className="w-5 h-5 text-blue-500" />
                            <h3 className="text-xl font-bold text-gray-900">
                                {currentLocation.properties.name}
                            </h3>
                        </div>
                        <div className="mb-2 space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <span className="font-medium">
                                    {currentLocation.properties.ward}
                                </span>
                                <span className="text-gray-400">Ward</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <span className="font-medium">
                                    {currentLocation.properties.constituency}
                                </span>
                                <span className="text-gray-400">Constituency</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <span className="font-medium">
                                    {currentLocation.properties.county}
                                </span>
                                <span className="text-gray-400">County</span>
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
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1000]">
                <div className="flex gap-4">
                    <motion.div whileHover={{scale: 1.05}} whileTap={{scale: 0.95}}>
                        <Button
                            onClick={handleYes}
                            disabled={isVerifying}
                            className="px-6 py-3 text-white bg-green-600 rounded-full shadow-lg hover:bg-green-700"
                        >
                            <CheckCircle className="w-5 h-5 mr-2" />
                            {isVerifying ? "Verifying..." : "YES (+10)"}
                        </Button>
                    </motion.div>

                    <motion.div whileHover={{scale: 1.05}} whileTap={{scale: 0.95}}>
                        <Button
                            onClick={handleNoEdit}
                            variant="destructive"
                            className="px-6 py-3 bg-gray-400 rounded-full shadow-lg"
                        >
                            <Edit className="w-5 h-5 mr-2" />
                            EDIT (+15)
                        </Button>
                    </motion.div>

                    <motion.div whileHover={{scale: 1.05}} whileTap={{scale: 0.95}}>
                        <Button
                            onClick={handleSkip}
                            variant="outline"
                            className="px-6 py-3 text-white bg-red-500 rounded-full shadow-lg"
                        >
                            <HelpCircle className="w-5 h-5 mr-2" />
                            SKIP (+2)
                        </Button>
                    </motion.div>
                </div>
            </div>

            {/* Confirmation Drawer */}
            <Drawer open={showConfirmDrawer} onOpenChange={setShowConfirmDrawer}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Confirm Location Edit</DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4">
                        <p className="mb-4 text-gray-600">
                            You've moved the pin to a new location. Are you sure this is
                            the correct position?
                        </p>
                        {newPosition && (
                            <div className="p-3 mb-4 rounded-lg bg-gray-50">
                                <p className="text-sm">
                                    <strong>New coordinates:</strong>
                                    <br />
                                    Lat: {newPosition.lat.toFixed(6)}
                                    <br />
                                    Lng: {newPosition.lng.toFixed(6)}
                                </p>
                            </div>
                        )}
                    </div>
                    <DrawerFooter>
                        <Button onClick={confirmEdit} disabled={isVerifying}>
                            {isVerifying
                                ? "Confirming..."
                                : "Confirm Edit (+15 points)"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowConfirmDrawer(false)}
                        >
                            Cancel
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </div>
    );
}
