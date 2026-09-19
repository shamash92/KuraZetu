import {Navigate, Outlet, Route, Routes, useLocation} from "react-router-dom";

import LandingPage from "../landing-pages";
import React from "react";
import RegistrationSuccessPage from "../auth/signup/RegistrationSuccess";
import SignupComponent from "../auth/signup/index";
import SignupForm from "../auth/signup/signupForm";
import PhoneVerification from "../auth/signup/PhoneVerification";
import {SignupVerificationSessionProvider} from "../auth/signup/SignupVerificationSession";
import PasswordReset from "../auth/passwordReset/PasswordReset";
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
 * Leaves the React router for a Django-rendered page.
 *
 * `Navigate` only moves within this route table, and the site root is served by
 * Django, so a signed-in visitor sent there needs a real page load.
 */
function RedirectToSite({to}: {to: string}) {
    React.useEffect(() => {
        window.location.replace(to);
    }, [to]);

    return null;
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

/** Keeps a verified signup ticket in memory only while completing signup. */
function SignupVerificationLayout() {
    return (
        <SignupVerificationSessionProvider>
            <Outlet />
        </SignupVerificationSessionProvider>
    );
}

function RoutesApp() {
    const isAuthenticated = useAuth();
    console.log(JSON.stringify(isAuthenticated, null, 2));

    return (
        <Routes>
            <Route path="/ui/" element={<LandingPage />} />
            <Route path="/ui/download-apk/" element={<APKDownloadPage />} />
            <Route path="/ui/game/" element={<GameLandingPage />} />
            <Route path="/ui/password-reset/" element={<PasswordReset />} />

            {/* Public Routes */}

            {isAuthenticated ? (
                <>
                    <Route path="/ui/dashboards/user/" element={<UserDashBoard />} />
                    {/* Signing up again is not a thing an account holder does. */}
                    <Route path="/ui/signup/*" element={<RedirectToSite to="/" />} />
                </>
            ) : (
                <>
                    <Route element={<SignupVerificationLayout />}>
                        <Route path="/ui/signup/" element={<SignupComponent />} />
                    <Route
                        path="/ui/signup/verify/:wardCode/:pollingCenterCode/"
                        element={<PhoneVerification />}
                    />
                    <Route
                        path="/ui/signup/accounts/:wardCode/:pollingCenterCode/"
                        element={<SignupForm />}
                    />
                    </Route>
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
