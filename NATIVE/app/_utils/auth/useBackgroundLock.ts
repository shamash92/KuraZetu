import {AppState} from "react-native";
import {useEffect, useState} from "react";

import useAuthStore from "./authStore";
import {getBiometricUnlock} from "./biometricUnlock";
import {shouldLock} from "./lockRules";
import {signOut} from "./session";

// Returns true while the app is not in front, so a cover can hide it from the
// app switcher. Only time in the background counts towards the lock: a long
// stay on one screen, or a Face ID prompt ("inactive"), never locks.
export function useBackgroundLock() {
    const [isAway, setIsAway] = useState(false);

    useEffect(() => {
        let backgroundedAt: number | null = null;

        const subscription = AppState.addEventListener("change", async (state) => {
            if (state !== "active") {
                setIsAway(true);
                if (state === "background") backgroundedAt = Date.now();
                return;
            }

            const leftAt = backgroundedAt;
            backgroundedAt = null;
            const {isLoggedIn, isLocked, lock} = useAuthStore.getState();

            if (leftAt !== null && isLoggedIn && !isLocked) {
                const biometricUnlock = (await getBiometricUnlock()) === "on";

                if (shouldLock(leftAt, Date.now(), biometricUnlock)) {
                    if (biometricUnlock) {
                        lock();
                    } else {
                        // Nothing to drop: this branch only runs with unlock not on.
                        await signOut("keep");
                    }
                }
            }
            // Only now, so the app is never shown before the lock decision.
            setIsAway(false);
        });

        return () => subscription.remove();
    }, []);

    return isAway;
}
