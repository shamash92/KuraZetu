import {AppState} from "react-native";
import {useEffect} from "react";

import {apiBaseURL} from "../apiBaseURL";
import {useAuthStore} from "./authStore";

// Asks the server whether this person has accepted the current terms, on
// every sign-in and each time the app comes back to the front.
export function useTermsCheck() {
    const userToken = useAuthStore((state) => state.userToken);

    useEffect(() => {
        if (!userToken) return;

        const check = async () => {
            const response = await fetch(`${apiBaseURL}/api/accounts/native/session/`, {
                headers: {Authorization: `Bearer ${userToken}`},
            }).catch(() => null);
            if (response?.status !== 200) return;

            const body = await response.json().catch(() => null);
            const {userToken: currentToken, setTermsOutdated} = useAuthStore.getState();
            // A sign-out while the request ran makes the answer stale.
            if (currentToken === userToken && body?.data) {
                setTermsOutdated(body.data.terms_outdated === true);
            }
        };

        void check();
        const subscription = AppState.addEventListener("change", (state) => {
            if (state === "active") void check();
        });
        return () => subscription.remove();
    }, [userToken]);
}
