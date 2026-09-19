import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter} from "react-router-dom";

import PasswordReset from "./PasswordReset";

test("a person resets a password after proving control of their phone", async () => {
    global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
            ok: true,
            json: () =>
                Promise.resolve({
                    data: {
                        challenge_id: "8fd0e46d-56bf-44cb-bf69-909610bd46d1",
                        expires_in_seconds: 120,
                        retry_after_seconds: 120,
                    },
                }),
        })
        .mockResolvedValueOnce({
            ok: true,
            json: () =>
                Promise.resolve({
                    data: {
                        outcome: "verified",
                        verification_ticket: "opaque-reset-ticket",
                        expires_in_seconds: 600,
                    },
                }),
        })
        .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({message: "Your password has been reset."}),
        }) as unknown as typeof fetch;

    const user = userEvent.setup();
    render(
        <MemoryRouter>
            <PasswordReset />
        </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Phone number"), "700000000");
    await user.click(screen.getByRole("button", {name: /send six-digit code/i}));
    await user.type(screen.getByLabelText("Six-digit code"), "123456");
    await user.click(screen.getByRole("button", {name: /verify and continue/i}));
    await user.type(screen.getByLabelText("New password"), "New-long-unique-password-123!");
    await user.type(
        screen.getByLabelText("Confirm new password"),
        "New-long-unique-password-123!",
    );
    await user.click(screen.getByRole("button", {name: /update password/i}));

    expect(await screen.findByRole("link", {name: /sign in/i})).toHaveAttribute(
        "href",
        "/accounts/login/",
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        "/api/accounts/phone-verification/password-reset/start/",
        expect.objectContaining({body: JSON.stringify({phone_number: "+254700000000"})}),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
        3,
        "/api/accounts/phone-verification/password-reset/complete/",
        expect.objectContaining({
            body: JSON.stringify({
                verification_ticket: "opaque-reset-ticket",
                new_password: "New-long-unique-password-123!",
            }),
        }),
    );
});
