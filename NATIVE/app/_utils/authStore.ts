import {deleteItemAsync} from "expo-secure-store";

import {create} from "zustand";
import {saveToSecureStore} from "./secureStore";

type UserState = {
    isLoggedIn: boolean;
    // Face ID or a fingerprint is needed before the app is shown again.
    isLocked: boolean;
    shouldCreateAccount: boolean;
    userToken: null | string;
    expoPushToken: string | null;
    setExpoPushToken: (expoPushToken: string | null) => void;
    logIn: (userToken: string) => void;
    logOut: () => Promise<void>;
    lock: () => void;
};

// Builds before Knox persisted a permanent DRF token. Nothing that grants
// access is stored now, so remove those values from phones that still have them.
void deleteItemAsync("auth-store").catch(() => {});
void deleteItemAsync("userToken").catch(() => {});

// The Knox token lives only in memory: a new process always starts signed out.
export const useAuthStore = create<UserState>((set) => ({
    isLoggedIn: false,
    isLocked: false,
    shouldCreateAccount: false,
    userToken: null,
    expoPushToken: null,
    setExpoPushToken: (expoPushToken: string | null) => {
        set((state) => {
            return {
                ...state,
                expoPushToken,
            };
        });
        if (expoPushToken) {
            saveToSecureStore("expoPushToken", expoPushToken);
        } else {
            // If the token is null, remove it from secure storage
            deleteItemAsync("expoPushToken");
        }
    },
    logIn: (token: string) => {
        set((state) => {
            return {
                ...state,
                isLoggedIn: true,
                isLocked: false,
                userToken: token,
            };
        });
    },
    logOut: async () => {
        set((state) => {
            return {
                ...state,
                isLoggedIn: false,
                isLocked: false,
                userToken: null,
            };
        });
    },
    lock: () => {
        set((state) => {
            return {
                ...state,
                isLocked: true,
            };
        });
    },
}));

export default useAuthStore;
