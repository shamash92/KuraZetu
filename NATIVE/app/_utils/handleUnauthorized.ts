import {router} from "expo-router";

import useAuthStore from "./authStore";

let signOutPromise: Promise<void> | null = null;

async function signOutForInvalidToken() {
    if (!signOutPromise) {
        signOutPromise = useAuthStore
            .getState()
            .logOut()
            .finally(() => {
                router.replace("/auth/login");
                signOutPromise = null;
            });
    }

    await signOutPromise;
}

export async function handleUnauthorized(response: Response) {
    if (response.status !== 401) return false;

    await signOutForInvalidToken();
    return true;
}
