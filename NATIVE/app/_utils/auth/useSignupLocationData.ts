import {useEffect, useState} from "react";
import {useReducedMotion} from "react-native-reanimated";
import type {FeatureCollection, Point} from "geojson";
import type {GeojsonProps} from "react-native-maps";
import type {ICountyFeature} from "@/app/types";
import {apiBaseURL} from "@/app/_utils/apiBaseURL";

type SignupLocationParams = {
    county?: string;
    countyName?: string;
    constituency?: string;
    constituencyName?: string;
    ward?: string;
    wardName?: string;
};

// boundariesLoading.json runs 124 frames at 30fps. Hold for one full pass of
// the atlas inking itself plus a beat on the finished map, so a fast response
// does not flash the scene and cut it.
const BOUNDARIES_INTRO_MS = (124 / 30) * 1000 + 300;
// Every signup step mounts this screen and refetches; only the first one in a
// session waits for the drawing.
let hasPlayedBoundariesIntro = false;

export function useSignupLocationData(
    step: "county" | "constituency" | "ward" | "centre",
    params: SignupLocationParams,
) {
    const [counties, setCounties] = useState<Array<ICountyFeature> | null>(null);
    const [countyLoadError, setCountyLoadError] = useState<string | null>(null);
    const [countyLoadAttempt, setCountyLoadAttempt] = useState(0);
    const reduceMotion = useReducedMotion();
    const [isIntroPlaying, setIsIntroPlaying] = useState(
        () => !hasPlayedBoundariesIntro && !reduceMotion,
    );
    const [constituencies, setConstituencies] = useState<GeojsonProps["geojson"] | null>(null);
    const [wards, setWards] = useState<GeojsonProps["geojson"] | null>(null);
    const [pollingCenters, setPollingCenters] = useState<FeatureCollection<Point> | null>(null);

    useEffect(() => {
        if (!isIntroPlaying) return;

        const timer = setTimeout(() => {
            hasPlayedBoundariesIntro = true;
            setIsIntroPlaying(false);
        }, BOUNDARIES_INTRO_MS);

        return () => clearTimeout(timer);
    }, [isIntroPlaying]);

    useEffect(() => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15_000);

        fetch(`${apiBaseURL}/api/stations/counties/boundaries/`, {
            signal: controller.signal,
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }
                return response.json();
            })
            .then((data) =>
                setCounties(
                    (data?.features ?? []).filter(
                        (item: any) =>
                            item.geometry &&
                            Array.isArray(item.geometry.coordinates) &&
                            item.geometry.coordinates.length,
                    ),
                ),
            )
            .catch(() => {
                if (!controller.signal.aborted) {
                    setCountyLoadError("Could not load map data. Check your connection and try again.");
                } else {
                    setCountyLoadError("Loading map data took too long. Please try again.");
                }
            })
            .finally(() => clearTimeout(timeout));

        return () => {
            clearTimeout(timeout);
            controller.abort();
        };
    }, [countyLoadAttempt]);

    useEffect(() => {
        if (step === "constituency" && params.county) {
            fetch(`${apiBaseURL}/api/stations/county/${Number(params.county)}/constituencies/boundaries/`)
                .then((response) => response.json())
                .then(setConstituencies);
        }
        if (step === "ward" && params.constituency) {
            fetch(`${apiBaseURL}/api/stations/constituencies/${Number(params.constituency)}/wards/boundaries/`)
                .then((response) => response.json())
                .then(setWards);
        }
        if (step === "centre" && params.ward) {
            fetch(`${apiBaseURL}/api/stations/wards/${Number(params.ward)}/polling-centers/pins/`)
                .then((response) => response.json())
                .then(setPollingCenters);
        }
    }, [step, params.county, params.constituency, params.ward]);

    function retry() {
        setCountyLoadError(null);
        setCountyLoadAttempt((attempt) => attempt + 1);
    }

    return {
        counties,
        constituencies,
        wards,
        pollingCenters,
        countyLoadError,
        isIntroPlaying,
        retry,
    };
}
