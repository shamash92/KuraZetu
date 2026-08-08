import {Navigate, Route, Routes, useLocation} from "react-router-dom";

import LandingPage from "../landing-pages";
import React from "react";
import RegistrationSuccessPage from "../auth/signup/RegistrationSuccess";
import SignupComponent from "../auth/signup/index";
import SignupForm from "../auth/signup/signupForm";
import UserDashBoard from "../dashboards/results";
import {useAuth} from "../App";
import APKDownloadPage from "../pages/APKDownload";
import GameLandingPage from "../game";

export function NotFound() {
    return (
        <div>
            <h1>404 - Page Not Found</h1>
            <h2>or</h2>
            <h1>You are most likely not logged in</h1>
            <br />

            <a href="/">
                <button className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700">
                    Go home
                </button>
            </a>
        </div>
    );
}

/**
 * Renders `children` only for someone who arrived by finishing signup.
 *
 * The signup form sets `justRegistered` when it navigates; opening the URL
 * directly carries no such state, and there is no registration to confirm.
 * React Router keeps the flag in `history.state`, so a refresh or a
 * back/forward still counts as having arrived properly.
 */
function RequireJustRegistered({children}: {children: React.ReactElement}) {
    const {state} = useLocation();

    if ((state as {justRegistered?: boolean} | null)?.justRegistered !== true) {
        return <Navigate to="/ui/signup/" replace />;
    }

    return children;
}

function RoutesApp() {
    const isAuthenticated = useAuth();
    console.log(JSON.stringify(isAuthenticated, null, 2));

    return (
        <Routes>
            <Route path="/ui/" element={<LandingPage />} />
            <Route path="/ui/download-apk/" element={<APKDownloadPage />} />
            <Route path="/ui/game/" element={<GameLandingPage />} />

            {/* Public Routes */}

            {isAuthenticated ? (
                <>
                    <Route path="/ui/dashboards/user/" element={<UserDashBoard />} />
                </>
            ) : (
                <>
                    <Route path="/ui/signup/" element={<SignupComponent />} />
                    <Route
                        path="/ui/signup/accounts/:wardCode/:pollingCenterCode/"
                        element={<SignupForm />}
                    />
                    <Route
                        path="/ui/signup/accounts/registration-success/"
                        element={
                            <RequireJustRegistered>
                                <RegistrationSuccessPage />
                            </RequireJustRegistered>
                        }
                    />
                </>
            )}

            {/* 404 fallback route */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default RoutesApp;
