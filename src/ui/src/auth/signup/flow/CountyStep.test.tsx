import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CountyStep from "./CountyStep";
import type {SignupFlow} from "../useSignupFlow";

// The success path mounts a Leaflet map, which jsdom cannot lay out, so it is
// verified by hand. Everything below is a branch that renders without the map.

function renderStep() {
    // A fresh client per test, with retries off so a failure surfaces at once
    // rather than after the production retry delay.
    const queryClient = new QueryClient({
        defaultOptions: {queries: {retry: false}},
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <CountyStep flow={{back: jest.fn()} as unknown as SignupFlow} />
        </QueryClientProvider>,
    );
}

afterEach(() => {
    jest.restoreAllMocks();
});

describe("CountyStep", () => {
    it("shows the loading screen while the boundaries are in flight", async () => {
        global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch;

        renderStep();

        expect(await screen.findByText(/loading counties/i)).toBeInTheDocument();
    });

    it("shows a retryable error when the request fails", async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                status: 500,
                json: () => Promise.resolve({error: "Boundaries are unavailable"}),
            }),
        ) as unknown as typeof fetch;

        const user = userEvent.setup();
        renderStep();

        expect(
            await screen.findByText("Boundaries are unavailable"),
        ).toBeInTheDocument();
        expect(global.fetch).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole("button", {name: /try again/i}));

        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("shows an empty state, not an error, when no counties come back", async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({features: []}),
            }),
        ) as unknown as typeof fetch;

        renderStep();

        expect(await screen.findByText(/no counties available/i)).toBeInTheDocument();
        expect(screen.queryByText(/could not load/i)).not.toBeInTheDocument();
    });

    it("passes an abort signal so a cancelled step drops its request", async () => {
        const fetchMock = jest.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({features: []}),
            }),
        );
        global.fetch = fetchMock as unknown as typeof fetch;

        renderStep();
        await screen.findByText(/no counties available/i);

        const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
        expect(init.signal).toBeInstanceOf(AbortSignal);
    });
});
