import React, {createContext, useContext} from "react";

import RoutesApp from "./routes";

let djangoAuth = {djangoAuthenticated: window.djangoAuthenticated || "false"}; //  this comes from the django html template inside the script tag

let djangoUserDetails = {
    djangoUserPhoneNumber: window.djangoUserPhoneNumber || null,
    djangoUserPollingCenterCode: window.djangoUserPollingCenterCode || null,
    djangoUserPollingCenterName: window.djangoUserPollingCenterName || null,

    djangoUserWardNumber: window.djangoUserWardNumber || null,

    djangoUserWardName: window.djangoUserWardName || null,

    djangoUserConstName: window.djangoUserConstName || null,
    djangoUserConstNumber: window.djangoUserConstNumber || null,

    djangoUserCountyName: window.djangoUserCountyName || null,
    djangoUserCountyNumber: window.djangoUserCountyNumber || null,
};
// console.log(djangoAuth, "djangoAuth in App.tsx");
// console.log(djangoUserDetails, "djangoUserdetails");

let isAuthenticated: boolean =
    djangoAuth["djangoAuthenticated"] === "true" ? true : false;

// Create a contexts
const AuthContext = createContext<boolean>(false);

export interface IDjangoUser {
    djangoUserPhoneNumber: string | null;
    djangoUserPollingCenterCode: string | null;
    djangoUserPollingCenterName: string | null;
    djangoUserWardNumber: number | null;
    djangoUserWardName: string | null;
    djangoUserConstName: string | null;
    djangoUserConstNumber: number | null;
    djangoUserCountyName: string | null;
    djangoUserCountyNumber: number | null;
}
const UserContext = createContext<IDjangoUser>({
    djangoUserPhoneNumber: null,
    djangoUserPollingCenterCode: null,
    djangoUserPollingCenterName: null,
    djangoUserWardNumber: null,
    djangoUserWardName: null,
    djangoUserConstName: null,
    djangoUserConstNumber: null,
    djangoUserCountyName: null,
    djangoUserCountyNumber: null,
});

// Create a provider component
function AuthProvider({children}) {
    return (
        <AuthContext.Provider value={isAuthenticated}>{children}</AuthContext.Provider>
    );
}
function UserProvider({children}) {
    return (
        <UserContext.Provider value={djangoUserDetails}>
            {children}
        </UserContext.Provider>
    );
}

// Custom hook to use the AuthContext
export const useAuth = () => useContext(AuthContext);
export const useUser = () => useContext(UserContext);

function App() {
    return (
        <div className="flex flex-col items-center justify-start w-full min-h-screen">
            <AuthProvider>
                <UserProvider>
                    <RoutesApp />
                </UserProvider>
            </AuthProvider>
        </div>
    );
}

export default App;
