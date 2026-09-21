import {useEffect} from "react";
import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {MemoryRouter, Route, Routes} from "react-router-dom";

import SignupForm from "./signupForm";
import {
    SignupVerificationSessionProvider,
    useSignupVerificationSession,
} from "./SignupVerificationSession";

function VerifiedSignupForm() {
    const {setVerificationTicket} = useSignupVerificationSession();

    useEffect(() => {
        setVerificationTicket("verified-signup-ticket");
    }, [setVerificationTicket]);

    return <SignupForm />;
}

test("signup does not persist its returned API token in browser storage", async () => {
    window.localStorage.removeItem("token");
    document.cookie = "token=; Max-Age=0; path=/";
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
            Promise.resolve({
                message: "User signup successful",
                data: {token: "signup-api-token"},
            }),
    }) as unknown as typeof fetch;

    const user = userEvent.setup();
    const queryClient = new QueryClient();
    const {container} = render(
        <QueryClientProvider client={queryClient}>
            <SignupVerificationSessionProvider>
                <MemoryRouter initialEntries={["/ui/signup/accounts/"]}>
                    <Routes>
                        <Route
                            path="/ui/signup/accounts/"
                            element={<VerifiedSignupForm />}
                        />
                        <Route
                            path="/ui/signup/accounts/registration-success/"
                            element={<p>Registration complete</p>}
                        />
                    </Routes>
                </MemoryRouter>
            </SignupVerificationSessionProvider>
        </QueryClientProvider>,
    );

    await user.type(
        container.querySelector('input[name="first_name"]')!,
        "Ada",
    );
    await user.type(
        container.querySelector('input[name="last_name"]')!,
        "Lovelace",
    );
    await user.selectOptions(
        container.querySelectorAll("select")[0],
        "F",
    );
    await user.type(
        screen.getByPlaceholderText("Enter password"),
        "correct-horse-battery",
    );
    await user.type(
        screen.getByPlaceholderText("Confirm password"),
        "correct-horse-battery",
    );
    await user.click(screen.getByRole("button", {name: "Register"}));

    expect(await screen.findByText("Registration complete")).toBeInTheDocument();
    expect(window.localStorage.getItem("token")).toBeNull();
    expect(document.cookie).not.toContain("token=signup-api-token");
});
