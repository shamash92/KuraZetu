import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter, Route, Routes} from "react-router-dom";

import PhoneVerification from "./PhoneVerification";
import {
    SignupVerificationSessionProvider,
    useSignupVerificationSession,
} from "./SignupVerificationSession";

jest.mock("./useSignupFlow", () => ({
    useSignupFlow: () => ({
        ward: {number: 201},
        pollingCenter: {code: "201"},
    }),
}));

function SignupFormProbe() {
    const {verificationTicket} = useSignupVerificationSession();
    return <p>{verificationTicket ? "Verification ticket ready" : "Missing ticket"}</p>;
}

test("a phone is verified before the account form receives its ticket", async () => {
    global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
            ok: true,
            json: () =>
                Promise.resolve({
                    data: {
                        challenge_id: "8fd0e46d-56bf-44cb-bf69-909610bd46d1",
                        expires_in_seconds: 120,
                        retry_after_seconds: 30,
                    },
                }),
        })
        .mockResolvedValueOnce({
            ok: true,
            json: () =>
                Promise.resolve({
                    data: {
                        outcome: "verified",
                        verification_ticket: "opaque-signup-ticket",
                        expires_in_seconds: 600,
                    },
                }),
        }) as unknown as typeof fetch;

    const user = userEvent.setup();
    render(
        <SignupVerificationSessionProvider>
            <MemoryRouter initialEntries={["/ui/signup/verify/201/201/"]}>
                <Routes>
                    <Route
                        path="/ui/signup/verify/:wardCode/:pollingCenterCode/"
                        element={<PhoneVerification />}
                    />
                    <Route
                        path="/ui/signup/accounts/:wardCode/:pollingCenterCode/"
                        element={<SignupFormProbe />}
                    />
                </Routes>
            </MemoryRouter>
        </SignupVerificationSessionProvider>,
    );

    await user.type(screen.getByLabelText("Phone number"), "700000000");
    await user.click(screen.getByRole("button", {name: /send six-digit code/i}));

    await user.type(screen.getByLabelText("Six-digit code"), "123456");
    await user.click(screen.getByRole("button", {name: /verify and continue/i}));

    expect(await screen.findByText("Verification ticket ready")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        "/api/accounts/phone-verification/signup/start/",
        expect.objectContaining({body: JSON.stringify({phone_number: "+254700000000"})}),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        "/api/accounts/phone-verification/verify/",
        expect.objectContaining({
            body: JSON.stringify({
                challenge_id: "8fd0e46d-56bf-44cb-bf69-909610bd46d1",
                code: "123456",
            }),
        }),
    );
});

test("a verified existing phone is directed to sign in without a signup ticket", async () => {
    global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
            ok: true,
            json: () =>
                Promise.resolve({
                    data: {
                        challenge_id: "8fd0e46d-56bf-44cb-bf69-909610bd46d1",
                        expires_in_seconds: 120,
                        retry_after_seconds: 30,
                    },
                }),
        })
        .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({data: {outcome: "existing_account"}}),
        }) as unknown as typeof fetch;

    const user = userEvent.setup();
    render(
        <SignupVerificationSessionProvider>
            <MemoryRouter initialEntries={["/ui/signup/verify/201/201/"]}>
                <Routes>
                    <Route
                        path="/ui/signup/verify/:wardCode/:pollingCenterCode/"
                        element={<PhoneVerification />}
                    />
                </Routes>
            </MemoryRouter>
        </SignupVerificationSessionProvider>,
    );

    await user.type(screen.getByLabelText("Phone number"), "700000000");
    await user.click(screen.getByRole("button", {name: /send six-digit code/i}));
    await user.type(screen.getByLabelText("Six-digit code"), "123456");
    await user.click(screen.getByRole("button", {name: /verify and continue/i}));

    expect(
        await screen.findByText("This number already has an account."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", {name: /sign in/i})).toHaveAttribute(
        "href",
        "/accounts/login/",
    );
    expect(screen.getByRole("link", {name: /reset password/i})).toHaveAttribute(
        "href",
        "/accounts/password-reset/",
    );

    await user.click(screen.getByRole("button", {name: /use another number/i}));
    expect(screen.getByLabelText("Phone number")).toBeInTheDocument();
});

test("a number typed the way Kenyans write it is sent in international form", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
            Promise.resolve({
                data: {
                    challenge_id: "8fd0e46d-56bf-44cb-bf69-909610bd46d1",
                    expires_in_seconds: 120,
                    retry_after_seconds: 30,
                },
            }),
    }) as unknown as typeof fetch;

    const user = userEvent.setup();
    render(
        <SignupVerificationSessionProvider>
            <MemoryRouter initialEntries={["/ui/signup/verify/201/201/"]}>
                <Routes>
                    <Route
                        path="/ui/signup/verify/:wardCode/:pollingCenterCode/"
                        element={<PhoneVerification />}
                    />
                </Routes>
            </MemoryRouter>
        </SignupVerificationSessionProvider>,
    );

    await user.type(screen.getByLabelText("Phone number"), "0712345678");
    await user.click(screen.getByRole("button", {name: /send six-digit code/i}));

    expect(await screen.findByLabelText("Six-digit code")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        "/api/accounts/phone-verification/signup/start/",
        expect.objectContaining({body: JSON.stringify({phone_number: "+254712345678"})}),
    );
});
