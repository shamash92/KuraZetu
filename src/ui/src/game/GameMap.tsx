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
import {useEffect, useRef, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {IConsensus, IPollingCenterFeature, TLevel} from "./types";

import cookie from "react-cookies";
import {toast} from "sonner";
import MapComponent from "./Map";
import {useAuth} from "../App";
import {
    POLLING_CENTER_PARTIALLY_VERIFIED_URL,
    POLLING_CENTER_VERIFY_URL,
    randomUnverifiedCenterUrl,
} from "../api/apiUrls";
import {gameKeys} from "../api/queryKeys";
import {querySettings} from "../api/querySettings";
import "./game-active.css";

interface GameMapProps {
    level: TLevel | null;
}

type DraftPosition = {lat: number; lng: number};

/**
 * Three shapes come back on a 200: the anonymous one carries only `data`, and
 * an authenticated caller gets the counts plus either `partially_verified` or,
 * when they have already verified this centre, `error` and
 * `user_verification`.
 */
type GameRoundResponse = {
    data: IPollingCenterFeature | null;
    error?: string;
    user_verification?: IPollingCenterFeature | null;
    partially_verified?: {features: IPollingCenterFeature[]};
    total_stations_count?: number;
    verified_stations_count?: number;
};

/**
 * A verdict on the drawn centre's pin. An upvote agrees with the pin as it
 * stands, so it carries the centre's own coordinates back; a suggestion
 * carries the volunteer's.
 */
type VerifyVariables = {
    latitude: number;
    longitude: number;
    pollingCenterDBId: number;
    isUpvote: boolean;
};

type VerifyResponse = {
    error?: string;
    message?: string;
    consensus?: IConsensus;
    location_upvotes?: number;
};

export default function GameMap({level}: GameMapProps) {
    const [consensus, setConsensus] = useState<IConsensus | null>(null);

    const [suggestedLocation, setSuggestedLocation] =
        useState<IPollingCenterFeature | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [draftPosition, setDraftPosition] = useState<DraftPosition | null>(null);
    const [draftInsideWard, setDraftInsideWard] = useState(true);

    const csrfToken = cookie.load("csrftoken");

    const isAuthenticated = useAuth();
    const queryClient = useQueryClient();

    const roundQuery = useQuery({
        queryKey: gameKeys.randomCenter(level),

        queryFn: async ({signal}): Promise<GameRoundResponse> => {
            // No `X-CSRFToken` here. Django enforces CSRF on unsafe methods
            // only, so a GET never needed it, and the token cannot go in the
            // query key: keys are held in memory and shown in devtools.
            const response = await fetch(randomUnverifiedCenterUrl(level), {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
                credentials: "include",
                signal,
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw Object.assign(
                    new Error(data?.error ?? "Could not load a polling center"),
                    {
                        status: response.status,
                        payload: data,
                    },
                );
            }

            // `error` is not a failure on this endpoint. "You have already
            // verified this polling center" arrives with the centre and the
            // caller's own verification attached, and is a round the interface
            // has a screen for.
            return data;
        },

        ...querySettings.gameRound,
    });

    // Blank between rounds, the way clearing the location did: a refetch is a
    // new draw, so the previous centre is gone the moment one is asked for.
    const round = roundQuery.isFetching ? undefined : roundQuery.data;

    const toggleReload = () => {
        void roundQuery.refetch();
    };

    const alreadyVerifiedByUser =
        round?.error === "You have already verified this polling center";
    const alreadyVerifiedData = alreadyVerifiedByUser ? (round?.data ?? null) : null;
    const alreadyVerifiedSuggestion =
        alreadyVerifiedByUser && !round?.user_verification?.properties.is_upvote
            ? (round?.user_verification ?? null)
            : null;

    const currentLocation = round?.data ?? null;
    const partiallyVerifiedLocations = round?.partially_verified?.features?.length
        ? round.partially_verified.features
        : null;
    const totalStationsCount = round?.total_stations_count ?? 0;
    const verifiedStationsCount = round?.verified_stations_count ?? 0;

    const isUnlocated = currentLocation?.properties.is_unlocated === true;

    // Announce the already-verified round once per draw rather than on every
    // render that reads the same cached response.
    const announcedCenterId = useRef<number | null>(null);
    useEffect(() => {
        if (!alreadyVerifiedByUser || currentLocation == null) return;
        if (announcedCenterId.current === currentLocation.id) return;
        announcedCenterId.current = currentLocation.id;
        toast.error("You have already verified this polling center");
    }, [alreadyVerifiedByUser, currentLocation]);

    // A new centre is a fresh round, so the pin edit and the consensus read
    // from the last one must not carry over.
    const editedCenterId = useRef<number | null>(null);
    useEffect(() => {
        if (currentLocation == null) return;
        if (editedCenterId.current === currentLocation.id) return;
        editedCenterId.current = currentLocation.id;
        setConsensus(null);
        setIsEditing(false);
        setDraftPosition(null);
        setDraftInsideWard(true);
    }, [currentLocation]);

    // The volunteer's own suggestion, read back after it is saved so the map
    // can show where it landed. A POST that only reads; it is a mutation here
    // because it runs once as the tail of a write, not because of its verb.
    const suggestionMutation = useMutation({
        mutationFn: async (pollingCenterDBId: number) => {
            const response = await fetch(POLLING_CENTER_PARTIALLY_VERIFIED_URL, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken,
                },
                credentials: "include",
                body: JSON.stringify({pollingCenterDBId}),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok || data?.error) {
                throw Object.assign(
                    new Error(data?.error ?? "Could not load your suggested pin"),
                    {
                        status: response.status,
                        payload: data,
                    },
                );
            }

            return data as {data: IPollingCenterFeature};
        },

        onSuccess(data) {
            setSuggestedLocation(data.data);
        },

        onError(error: Error) {
            toast.error(error.message);
        },
    });

    const verifyMutation = useMutation({
        mutationFn: async (variables: VerifyVariables): Promise<VerifyResponse> => {
            const response = await fetch(POLLING_CENTER_VERIFY_URL, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken,
                },
                credentials: "include",
                body: JSON.stringify(variables),
            });

            const data = await response.json().catch(() => null);

            // This endpoint refuses in two shapes: the ward guard is a 400,
            // and everything else — an unknown centre, a second verification
            // of the same one — is `{error}` inside a 200. Neither saved
            // anything, so both throw.
            if (!response.ok || data?.error) {
                throw Object.assign(
                    new Error(data?.error ?? "Your verification could not be saved"),
                    {
                        status: response.status,
                        payload: data,
                    },
                );
            }

            return data;
        },

        onSuccess(data, variables) {
            if (variables.isUpvote) {
                toast.success("Asante — your confirmation was recorded.");
                // This centre now carries the volunteer's vote, so their round
                // is spent. Invalidating the key draws the next one.
                void queryClient.invalidateQueries({
                    queryKey: gameKeys.randomCenter(level),
                });
                return;
            }

            if (data.consensus) {
                setConsensus(data.consensus);
            }
            toast.success(
                data.consensus?.verified
                    ? "Asante — enough neighbours agreed. Center verified."
                    : "Asante — your pin was recorded.",
            );

            setIsEditing(false);
            setDraftPosition(null);

            // Deliberately no invalidation: a suggestion leaves the volunteer
            // on this centre to see their pin, and they draw the next one
            // themselves.
            suggestionMutation.mutate(variables.pollingCenterDBId);
        },

        onError(error: Error) {
            toast.error(error.message);
        },
    });

    const isSavingPin = verifyMutation.isPending || suggestionMutation.isPending;

    const handleYes = () => {
        if (!currentLocation) {
            toast.error("No current location to verify");
            return;
        }

        verifyMutation.mutate({
            latitude: currentLocation.properties.pin_location.coordinates[1],
            longitude: currentLocation.properties.pin_location.coordinates[0],
            pollingCenterDBId: currentLocation.id,
            isUpvote: true,
        });
    };

    const handleSkip = () => {
        toggleReload();
    };

    const openMovePin = () => {
        if (!currentLocation) return;
        setDraftPosition(null);
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

    const saveDraftPosition = () => {
        if (!draftPosition) {
            toast.error("Pan the map and choose Put pin here before saving.");
            return;
        }
        if (!draftInsideWard) {
            toast.error(
                `The pin must stay inside ${currentLocation?.properties.ward} ward.`,
            );
            return;
        }
        if (!currentLocation) return;

        verifyMutation.mutate({
            latitude: draftPosition.lat,
            longitude: draftPosition.lng,
            pollingCenterDBId: currentLocation.id,
            isUpvote: false,
        });
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
                !isEditing &&
                !isSavingPin
            ) {
                handleYes();
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
                    if (!isSavingPin) saveDraftPosition();
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
        isSavingPin,
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

    // The already-verified state now derives from the round, so drawing the
    // next one clears it.
    const nextLocation = () => {
        setSuggestedLocation(null);
        toggleReload();
    };

    const mapLocation = alreadyVerifiedByUser
        ? alreadyVerifiedData
        : currentLocation;

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
                {mapLocation ? (
                    <MapComponent
                        location={mapLocation}
                        wardNumber={mapLocation.properties.ward_number ?? null}
                        suggestedLocation={suggestedLocation ? suggestedLocation : null}
                        highlightedSuggestion={
                            alreadyVerifiedByUser
                                ? alreadyVerifiedSuggestion
                                : null
                        }
                        isReadOnly={alreadyVerifiedByUser}
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
                                You have already{" "}
                                {alreadyVerifiedSuggestion
                                    ? "suggested a location for "
                                    : "confirmed the original pin for "}
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
                                                Pan the map until the target is over the
                                                building, then choose Put pin here.
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
                                                No new location selected yet
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
                                            ? "Pan or search, then choose Put pin here"
                                            : draftInsideWard
                                            ? `Pin stays inside ${currentLocation.properties.ward} ward`
                                            : `Pan back inside ${currentLocation.properties.ward} ward`}
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
                                            onClick={saveDraftPosition}
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
                                        disabled={isSavingPin}
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
                                            Pan the map and place the target on the building
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
