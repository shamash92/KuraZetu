import {
    CheckCircle,
    Edit,
    FastForward,
    HelpCircle,
    MapPin,
    Save,
    Sparkles,
    ThumbsUp,
    X,
} from "lucide-react";
import {useEffect, useState} from "react";
import {IConsensus, IPollingCenterFeature, TLevel} from "./types";

import cookie from "react-cookies";
import {toast} from "sonner";
import MapComponent from "./Map";
import {useAuth} from "../App";
import "./game-active.css";

interface GameMapProps {
    level: TLevel | null;
}

type DraftPosition = {lat: number; lng: number};

export default function GameMap({level}: GameMapProps) {
    const [currentLocation, setCurrentLocation] =
        useState<IPollingCenterFeature | null>(null);

    const [partiallyVerifiedLocations, setPartiallyVerifiedLocations] = useState<
        IPollingCenterFeature[] | null
    >(null);

    const [totalStationsCount, setTotalStationsCount] = useState<number>(0);
    const [verifiedStationsCount, setVerifiedStationsCount] = useState<number>(0);

    const [reload, setReload] = useState(false);

    const [consensus, setConsensus] = useState<IConsensus | null>(null);

    const [suggestedLocation, setSuggestedLocation] =
        useState<IPollingCenterFeature | null>(null);

    const [alreadyVerifiedByUser, setAlreadyVerifiedByUser] = useState(false);
    const [alreadyVerifiedData, setAlreadyVerifiedData] =
        useState<IPollingCenterFeature | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [draftPosition, setDraftPosition] = useState<DraftPosition | null>(null);
    const [draftInsideWard, setDraftInsideWard] = useState(true);
    const [isSavingPin, setIsSavingPin] = useState(false);

    const toggleReload = () => {
        setReload((prev) => !prev);
    };

    const csrfToken = cookie.load("csrftoken");

    const isAuthenticated = useAuth();

    const handleAlreadyVerified = (data: IPollingCenterFeature) => {
        setAlreadyVerifiedByUser(true);
        setAlreadyVerifiedData(data);
    };

    const isUnlocated = currentLocation?.properties.is_unlocated === true;

    useEffect(() => {
        setConsensus(null);
        setIsEditing(false);
        setDraftPosition(null);
        setDraftInsideWard(true);
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

                setTotalStationsCount(data["total_stations_count"]);
                setVerifiedStationsCount(data["verified_stations_count"]);

                let partiallyVerifiedPollingCenters = data["partially_verified"];

                if (
                    partiallyVerifiedPollingCenters !== undefined &&
                    partiallyVerifiedPollingCenters.features.length > 0
                ) {
                    setPartiallyVerifiedLocations(
                        partiallyVerifiedPollingCenters.features,
                    );
                } else {
                    setPartiallyVerifiedLocations(null);
                }
                if (unverifiedPollingCenter !== null) {
                    setCurrentLocation(unverifiedPollingCenter);
                }
            })
            .catch((error) => {
                console.error("Error fetching locations:", error);
            });
    }, [reload, level]);

    const handlePinAPIPost = async (
        latitude: number,
        longitude: number,
        pollingCenterDBId: number,
        isUpvote: boolean,
    ) => {
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

        // The ward guard returns 400 with an {error} body — surface it instead
        // of throwing a generic network error.
        const data = await response.json();
        return data;
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

        if (x.error) {
            toast.error(x.error);
            return;
        }
        if (x.message === "Polling Center location upvoted successfully") {
            toast.success("Asante — your confirmation was recorded.");
            toggleReload();
            setCurrentLocation(null);
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
            setSuggestedLocation(data["data"]);
            return data;
        } catch (error) {
            console.error("Error updating pin and boundary:", error);
            throw error;
        }
    };

    const handlePinUpdate = async (lat: number, lng: number) => {
        setIsSavingPin(true);
        try {
            const data = await handlePinAPIPost(
                lat,
                lng,
                currentLocation?.id || 0,
                false,
            );
            if (data.error) {
                toast.error(data.error);
                return;
            }

            if (data.consensus) {
                setConsensus(data.consensus as IConsensus);
            }
            if (data.consensus?.verified) {
                toast.success("Asante — enough neighbours agreed. Center verified.");
            } else {
                toast.success("Asante — your pin was recorded.");
            }

            setIsEditing(false);
            setDraftPosition(null);

            if (currentLocation) {
                await handleUpdatedPinAndBoundary(currentLocation.id);
            }
        } finally {
            setIsSavingPin(false);
        }
    };

    const handleSkip = () => {
        setCurrentLocation(null);
        toggleReload();
    };

    const openMovePin = () => {
        if (!currentLocation) return;
        setDraftPosition(
            isUnlocated
                ? null
                : {
                      lat: currentLocation.properties.pin_location.coordinates[1],
                      lng: currentLocation.properties.pin_location.coordinates[0],
                  },
        );
        setDraftInsideWard(true);
        setIsEditing(true);
    };

    const cancelMovePin = () => {
        setIsEditing(false);
        setDraftPosition(null);
        setDraftInsideWard(true);
    };

    const updateDraftPosition = (
        position: DraftPosition,
        isInsideWard: boolean,
    ) => {
        setDraftPosition(position);
        setDraftInsideWard(isInsideWard);
    };

    const saveDraftPosition = async () => {
        if (!draftPosition) {
            toast.error("Search for the center or drag the pin before saving.");
            return;
        }
        if (!draftInsideWard) {
            toast.error(
                `The pin must stay inside ${currentLocation?.properties.ward} ward.`,
            );
            return;
        }
        await handlePinUpdate(draftPosition.lat, draftPosition.lng);
    };

    useEffect(() => {
        const handleShortcut = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (
                target?.tagName === "INPUT" ||
                target?.tagName === "TEXTAREA" ||
                target?.isContentEditable
            ) {
                return;
            }

            if (
                event.key.toLowerCase() === "y" &&
                currentLocation &&
                !isUnlocated &&
                !isEditing
            ) {
                void handleYes();
            }
            if (
                event.key.toLowerCase() === "m" &&
                currentLocation &&
                !isEditing
            ) {
                openMovePin();
            }
            if (event.key === "Escape" && isEditing) {
                cancelMovePin();
            }
            if (event.key.toLowerCase() === "s" && currentLocation) {
                if (isEditing) {
                    void saveDraftPosition();
                } else if (!isUnlocated) {
                    handleSkip();
                }
            }
        };

        window.addEventListener("keydown", handleShortcut);
        return () => window.removeEventListener("keydown", handleShortcut);
    }, [
        currentLocation,
        draftInsideWard,
        draftPosition,
        isEditing,
        isUnlocated,
    ]);

    const consensusView: IConsensus = consensus ?? {
        verified: currentLocation?.properties.is_verified ?? false,
        agree: Math.min(currentLocation?.properties.location_upvotes ?? 0, 3),
        needed: 3,
        outliers:
            partiallyVerifiedLocations?.filter(
                (location) => location.properties.is_outlier,
            ).length ?? 0,
    };

    const nextLocation = () => {
        setSuggestedLocation(null);
        setAlreadyVerifiedByUser(false);
        setCurrentLocation(null);
        toggleReload();
    };

    return (
        <div className="pv-game">
            <header className="pv-game-nav">
                <a className="pv-game-brand" href="/ui/">
                    <strong>KuraZetu</strong>
                    <span>Powered by Kiongozi</span>
                </a>

                <nav className="pv-game-pills" aria-label="KuraZetu">
                    <a href="/ui/dashboards/user/">Results</a>
                    <a className="is-active" href="/ui/game/">
                        PinVerify
                    </a>
                    <a href="/ui/#contribute">Contribute</a>
                    <a href="/ui/#about">About</a>
                </nav>

                <div className="pv-game-nav-right">
                    {isAuthenticated && (
                        <span className="pv-game-track">
                            {level || "Kenya"} · {totalStationsCount} centers
                        </span>
                    )}
                    <span className="pv-game-helped">
                        {verifiedStationsCount} helped
                    </span>
                </div>
            </header>

            <main className="pv-game-workspace">
                <section className="pv-game-map-shell" aria-label="Polling center map">
                {currentLocation && alreadyVerifiedByUser === false ? (
                    <MapComponent
                        location={currentLocation}
                        wardNumber={currentLocation.properties.ward_number ?? null}
                        suggestedLocation={suggestedLocation ? suggestedLocation : null}
                        isEditing={isEditing}
                        draftPosition={draftPosition}
                        onDraftPositionChange={updateDraftPosition}
                        partiallyVerifiedLocations={
                            partiallyVerifiedLocations
                                ? partiallyVerifiedLocations
                                : null
                        }
                    />
                ) : (
                    <div className="pv-game-loading">
                        Loading the next polling center
                    </div>
                )}

                    {currentLocation && isUnlocated && !isEditing && (
                        <div className="pv-first-locate">
                            <div className="pv-first-locate-card">
                                <span className="pv-first-locate-icon">
                                    <Sparkles size={22} />
                                </span>
                                <h3>You're the first to locate this center.</h3>
                                <p>
                                    Search the school name, then place the first pin
                                    inside {currentLocation.properties.ward} ward.
                                </p>
                                <button type="button" onClick={openMovePin}>
                                    Place the first pin
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                <aside className="pv-game-panel">
                    {suggestedLocation ? (
                        <div className="pv-panel-state">
                            <span className="pv-panel-state-icon">
                                <CheckCircle size={24} />
                            </span>
                            <h2>Pin recorded</h2>
                            <p>
                                Asante. Your suggestion is now part of the community
                                cluster and will count when neighbours agree.
                            </p>
                            <button type="button" onClick={nextLocation}>
                                Next polling center
                            </button>
                        </div>
                    ) : alreadyVerifiedByUser ? (
                        <div className="pv-panel-state">
                            <span className="pv-panel-state-icon">
                                <CheckCircle size={24} />
                            </span>
                            <h2>Already verified</h2>
                            <p>
                                You have already helped with{" "}
                                <strong>{alreadyVerifiedData?.properties.name}</strong>.
                            </p>
                            <button type="button" onClick={nextLocation}>
                                Load another
                            </button>
                        </div>
                    ) : currentLocation ? (
                        <>
                            <h1>{currentLocation.properties.name}</h1>
                            <div className="pv-station-tag">
                                Station · {currentLocation.properties.code}
                            </div>

                            <dl className="pv-station-meta">
                                <dt>Ward</dt>
                                <dd>{currentLocation.properties.ward}</dd>
                                <dt>Const.</dt>
                                <dd>{currentLocation.properties.constituency}</dd>
                                <dt>County</dt>
                                <dd>{currentLocation.properties.county}</dd>
                                <dt>Source</dt>
                                <dd>IEBC roster</dd>
                            </dl>

                            {currentLocation.properties.pin_location_error ? (
                                <div className="pv-ward-warning">
                                    <HelpCircle size={14} />
                                    {currentLocation.properties.pin_location_error}
                                </div>
                            ) : (
                                <div className="pv-ward-ok">
                                    <CheckCircle size={14} />
                                    Pin is inside {currentLocation.properties.ward} ward
                                </div>
                            )}

                            <div className="pv-consensus">
                                <div className="pv-consensus-head">
                                    <span>Consensus</span>
                                    <strong>
                                        {consensusView.agree} of {consensusView.needed}
                                    </strong>
                                </div>
                                <div className="pv-consensus-pips">
                                    {Array.from({length: consensusView.needed}).map(
                                        (_, index) => (
                                            <span
                                                className={
                                                    index < consensusView.agree
                                                        ? "is-on"
                                                        : ""
                                                }
                                                key={index}
                                            />
                                        ),
                                    )}
                                </div>
                                <p>
                                    {consensusView.verified ? (
                                        <strong>Verified by neighbour agreement.</strong>
                                    ) : (
                                        <>
                                            <strong>
                                                {Math.max(
                                                    consensusView.needed -
                                                        consensusView.agree,
                                                    0,
                                                )}{" "}
                                                more matching pin
                                                {consensusView.needed -
                                                    consensusView.agree ===
                                                1
                                                    ? ""
                                                    : "s"}
                                            </strong>{" "}
                                            auto-verifies this center.
                                        </>
                                    )}
                                    {consensusView.outliers > 0 &&
                                        ` ${consensusView.outliers} far from the cluster ignored.`}
                                </p>
                            </div>

                            {isEditing ? (
                                <div className="pv-inline-editor">
                                    <div className="pv-inline-editor-heading">
                                        <span className="pv-inline-editor-icon">
                                            <Edit size={17} />
                                        </span>
                                        <div>
                                            <strong>
                                                {isUnlocated
                                                    ? "Place the first pin"
                                                    : "Move the pin"}
                                            </strong>
                                            <span>
                                                Drag the blue pin on the map or use
                                                search to jump to the school.
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pv-inline-editor-coords">
                                        {draftPosition ? (
                                            <>
                                                <span>
                                                    Lat{" "}
                                                    <strong>
                                                        {draftPosition.lat.toFixed(6)}
                                                    </strong>
                                                </span>
                                                <span>
                                                    Lng{" "}
                                                    <strong>
                                                        {draftPosition.lng.toFixed(6)}
                                                    </strong>
                                                </span>
                                            </>
                                        ) : (
                                            <span>
                                                Search for the center to place a pin
                                            </span>
                                        )}
                                    </div>

                                    <div
                                        className={`pv-inline-editor-status ${
                                            !draftPosition
                                                ? "is-awaiting"
                                                : draftInsideWard
                                                ? ""
                                                : "is-outside"
                                        }`}
                                    >
                                        {!draftPosition ? (
                                            <MapPin size={14} />
                                        ) : draftInsideWard ? (
                                            <CheckCircle size={14} />
                                        ) : (
                                            <HelpCircle size={14} />
                                        )}
                                        {!draftPosition
                                            ? "Choose a search result to seed the pin"
                                            : draftInsideWard
                                            ? `Pin stays inside ${currentLocation.properties.ward} ward`
                                            : `Move the pin back inside ${currentLocation.properties.ward} ward`}
                                    </div>

                                    <div className="pv-inline-editor-actions">
                                        <button
                                            className="pv-inline-cancel"
                                            type="button"
                                            onClick={cancelMovePin}
                                            disabled={isSavingPin}
                                        >
                                            <X size={15} />
                                            Cancel
                                        </button>
                                        <button
                                            className="pv-inline-save"
                                            type="button"
                                            onClick={() => void saveDraftPosition()}
                                            disabled={
                                                !draftPosition ||
                                                !draftInsideWard ||
                                                isSavingPin
                                            }
                                        >
                                            <Save size={15} />
                                            {isSavingPin
                                                ? "Saving..."
                                                : "Save this pin"}
                                            <span>S</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                            <div className="pv-game-decision">
                                <div className="pv-game-decision-label">Your call</div>
                                {!isUnlocated && (
                                    <button
                                        className="pv-decision-button is-yes"
                                        type="button"
                                        onClick={handleYes}
                                    >
                                        <span className="pv-decision-icon">
                                            <ThumbsUp size={16} />
                                        </span>
                                        <span className="pv-decision-copy">
                                            Yes — this pin is right
                                            <small>
                                                Building lines up with the satellite
                                                view
                                            </small>
                                        </span>
                                        <span className="pv-decision-key">Y</span>
                                    </button>
                                )}

                                <button
                                    className="pv-decision-button is-move"
                                    type="button"
                                    onClick={openMovePin}
                                >
                                    <span className="pv-decision-icon">
                                        <Edit size={16} />
                                    </span>
                                    <span className="pv-decision-copy">
                                        {isUnlocated
                                            ? "Place the first pin"
                                            : "Move the pin"}
                                        <small>
                                            Drag inside the ward to the right spot
                                        </small>
                                    </span>
                                    <span className="pv-decision-key">M</span>
                                </button>

                                {!isUnlocated && (
                                    <button
                                        className="pv-decision-button is-skip"
                                        type="button"
                                        onClick={handleSkip}
                                    >
                                        <span className="pv-decision-icon">
                                            <FastForward size={16} />
                                        </span>
                                        <span className="pv-decision-copy">
                                            Skip
                                            <small>
                                                Not sure — pass to the next center
                                            </small>
                                        </span>
                                        <span className="pv-decision-key">S</span>
                                    </button>
                                )}
                            </div>
                            )}
                        </>
                    ) : (
                        <div className="pv-panel-state">
                            <span className="pv-panel-state-icon">
                                <MapPin size={24} />
                            </span>
                            <h2>Finding a center</h2>
                            <p>Preparing the next location for review.</p>
                        </div>
                    )}
                </aside>
            </main>
        </div>
    );
}
