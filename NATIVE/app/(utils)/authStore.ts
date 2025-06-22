import {createJSONStorage, persist} from "zustand/middleware";
import {deleteItemAsync, getItem, setItem} from "expo-secure-store";

import {create} from "zustand";
import {saveToSecureStore} from "./secureStore";

type UserState = {
    isLoggedIn: boolean;
    hasSavedUserToken: boolean;
    shouldCreateAccount: boolean;
    userToken: null | string;
    expoPushToken: string | null;
    setExpoPushToken: (expoPushToken: string | null) => void;
    logIn: (userToken: string) => void;
    logOut: () => void;
};

// TODO: not sure if having both userToken and hasSavedUserToken is necessary.
// Is there a scenario in which one exists without the other?

export const useAuthStore = create(
    persist<UserState>(
        (set) => ({
            isLoggedIn: false,
            hasSavedUserToken: false,
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
                saveToSecureStore("userToken", token);

                set((state) => {
                    return {
                        ...state,
                        isLoggedIn: true,
                        hasSavedUserToken: true,
                        userToken: token,
                    };
                });
            },
            logOut: () => {
                set((state) => {
                    return {
                        ...state,
                        isLoggedIn: false,
                    };
                });
            },
        }),
        {
            name: "auth-store",
            storage: createJSONStorage(() => ({
                setItem,
                getItem,
                removeItem: deleteItemAsync,
            })),
        },
    ),
);

export default useAuthStore;
