import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import {useEffect, useState} from "react";

import type {ReactNode} from "react";

import SignupForm from "./signupForm";
import {
    SignupVerificationSessionProvider,
    useSignupVerificationSession,
} from "./SignupVerificationSession";

// Signup clears the ticket on success, so keep rendering once it was set.
function WithVerifiedPhone({children}: {children: ReactNode}) {
    const {setVerificationTicket} = useSignupVerificationSession();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        setVerificationTicket("opaque-signup-ticket");
        setReady(true);
    }, [setVerificationTicket]);

    return ready ? children : null;
}

test("a completed signup reaches the success page without storing a token", async () => {
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
            Promise.resolve({
                message: "User signup successful",
                data: {user: {first_name: "Amina"}},
            }),
    }) as unknown as typeof fetch;

    const user = userEvent.setup();
    const {container} = render(
        <QueryClientProvider client={new QueryClient()}>
            <SignupVerificationSessionProvider>
                <MemoryRouter initialEntries={["/ui/signup/accounts/201/201/"]}>
                    <WithVerifiedPhone>
                        <Routes>
                            <Route
                                path="/ui/signup/accounts/:wardCode/:pollingCenterCode/"
                                element={<SignupForm />}
                            />
                            <Route
                                path="/ui/signup/accounts/registration-success/"
                                element={<p>Registered</p>}
                            />
                        </Routes>
                    </WithVerifiedPhone>
                </MemoryRouter>
            </SignupVerificationSessionProvider>
        </QueryClientProvider>,
    );

    const field = (name: string) =>
        container.querySelector(`[name="${name}"]`) as HTMLInputElement;

    await user.type(field("first_name"), "Amina");
    await user.type(field("last_name"), "Otieno");
    expect(screen.queryByText("Your Role")).not.toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox"), "F");
    await user.type(field("password"), "long-password");
    await user.type(field("confirm_password"), "long-password");
    expect(screen.getByRole("button", {name: "Register"})).toBeDisabled();
    await user.click(screen.getByRole("checkbox", {name: /accept the Terms of use/}));
    await user.click(screen.getByRole("button", {name: "Register"}));

    expect(await screen.findByText("Registered")).toBeInTheDocument();
    const signupRequest = jest.mocked(global.fetch).mock.calls[0][1];
    expect(JSON.parse(String(signupRequest?.body))).toEqual(
        expect.objectContaining({role: "voter", accepted_terms: true}),
    );
    expect(localStorage.getItem("token")).toBeNull();
    expect(document.cookie).not.toContain("token=");
});
