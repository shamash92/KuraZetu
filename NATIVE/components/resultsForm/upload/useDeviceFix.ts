import * as Location from "expo-location";
import {useCallback, useEffect, useState} from "react";

import {type DeviceFix, moreAccurate} from "./deviceFix";

export type LocationPermission = "checking" | "granted" | "denied";

/**
 * Locate the phone while a submit screen is open and keep the most accurate
 * fix seen. Asks for location permission if it has not been given.
 */
export function useDeviceFix(active: boolean) {
    const [permission, setPermission] = useState<LocationPermission>("checking");
    const [fix, setFix] = useState<DeviceFix | null>(null);
    // Bumped by retry() to ask again and restart locating.
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (!active) return;
        let cancelled = false;
        let subscription: Location.LocationSubscription | null = null;

        void (async () => {
            const {status} = await Location.requestForegroundPermissionsAsync();
            if (cancelled) return;
            if (status !== "granted") {
                setPermission("denied");
                return;
            }
            setPermission("granted");
            // A fresh start each time the screen opens or Retry is tapped.
            setFix(null);
            const watch = await Location.watchPositionAsync(
                {accuracy: Location.Accuracy.Highest, distanceInterval: 0},
                ({coords}) => {
                    if (coords.accuracy === null) return;
                    setFix((kept) =>
                        moreAccurate(kept, {
                            latitude: coords.latitude,
                            longitude: coords.longitude,
                            accuracy: coords.accuracy as number,
                        }),
                    );
                },
            );
            if (cancelled) watch.remove();
            else subscription = watch;
        })();

        return () => {
            cancelled = true;
            subscription?.remove();
        };
    }, [active, attempt]);

    const retry = useCallback(() => setAttempt((n) => n + 1), []);

    return {permission, fix, retry};
}
