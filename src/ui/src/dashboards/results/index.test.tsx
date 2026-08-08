import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

import ResultsDashboard from "./index";

// The dashboard also mounts the county and polling-centre sections, which read
// their own endpoints. Mocking the context keeps them pointed at a signed-in
// user, so their requests are answered by the catch-all in `mockFetch` rather
// than failing in a way that could be mistaken for a national failure.
jest.mock("../../App", () => ({
    useUser: () => ({
        djangoUserPollingCenterCode: "001",
        djangoUserPollingCenterName: "Kaloleni Primary School",
        djangoUserWardNumber: 1234,
        djangoUserConstName: "Kaloleni",
        djangoUserCountyName: "Kilifi",
        djangoUserCountyNumber: 3,
        djangoUserWardName: "Kaloleni",
    }),
}));

const NATIONAL_URL = "/api/results/total-votes/presidential/";

function candidate(name: string, party: string, votes: number, percentage: number) {
    return {
        name,
        party,
        party_color: "#000000",
        votes,
        percentage,
        total_polling_stations_with_results: 3,
        nationwide_polling_stations_count: 10,
        image: "",
    };
}

function okResponse(body: unknown) {
    return Promise.resolve({ok: true, json: () => Promise.resolve(body)});
}

function failedResponse(status: number, error: string) {
    return Promise.resolve({
        ok: false,
        status,
        json: () => Promise.resolve({error}),
    });
}

/**
 * Installs a `fetch` that answers the national endpoint with `national` and
 * every other endpoint on the page with an empty payload. Returns a way to
 * count national requests, so a test can assert retry behaviour without
 * reaching back into the global.
 */
function mockFetch(national: () => Promise<unknown>) {
    const fetchMock = jest.fn((input: RequestInfo | URL) =>
        String(input) === NATIONAL_URL
            ? national()
            : okResponse({results: [], data: [], streams: 0}),
    );

    global.fetch = fetchMock as unknown as typeof fetch;

    return {
        countNationalRequests: () =>
            fetchMock.mock.calls.filter(([input]) => String(input) === NATIONAL_URL)
                .length,
    };
}

/**
 * A client per render, so one test's cache cannot answer another's request.
 * `retry` is left at the client default, so the national policy's own
 * `retry: false` is what the tests observe rather than a test-only override.
 */
function renderDashboard() {
    return render(
        <QueryClientProvider client={new QueryClient()}>
            <ResultsDashboard />
        </QueryClientProvider>,
    );
}

test("the national tally replaces its loading state with every candidate", async () => {
    let release: (value: unknown) => void = () => {};
    const inFlight = new Promise((resolve) => {
        release = resolve;
    });
    mockFetch(() => inFlight);

    renderDashboard();

    expect(screen.getByText(/loading national results/i)).toBeInTheDocument();

    release({
        ok: true,
        json: () =>
            Promise.resolve({
                results: [
                    candidate("Asha Wanjiru", "Party A", 1200, 60),
                    candidate("Baraka Otieno", "Party B", 800, 40),
                ],
            }),
    });

    expect(await screen.findByText("Asha Wanjiru")).toBeInTheDocument();
    expect(screen.getByText("Baraka Otieno")).toBeInTheDocument();
    expect(screen.getByText("1,200 votes")).toBeInTheDocument();
    expect(screen.getByText("3 / 10")).toBeInTheDocument();
    expect(screen.queryByText(/loading national results/i)).not.toBeInTheDocument();
});

test("a tally with nothing counted shows an empty state rather than an error", async () => {
    mockFetch(() => okResponse({results: []}));

    renderDashboard();

    expect(
        await screen.findByText(/no presidential results have been counted yet/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", {name: /try again/i})).not.toBeInTheDocument();
});

test("a failed tally offers a retry that recovers", async () => {
    const user = userEvent.setup();
    let attempt = 0;
    mockFetch(() => {
        attempt += 1;
        return attempt === 1
            ? failedResponse(503, "Origin unavailable")
            : okResponse({results: [candidate("Asha Wanjiru", "Party A", 1200, 60)]});
    });

    renderDashboard();

    expect(await screen.findByText("Origin unavailable")).toBeInTheDocument();

    await user.click(screen.getByRole("button", {name: /try again/i}));

    expect(await screen.findByText("Asha Wanjiru")).toBeInTheDocument();
});

test("a failed tally is requested once and not retried on its own", async () => {
    const {countNationalRequests} = mockFetch(() =>
        failedResponse(503, "Origin unavailable"),
    );

    renderDashboard();

    await screen.findByText("Origin unavailable");

    // The client's global rule retries a 5xx once. National results override it:
    // a quarter of a million clients retrying an outage in unison is the
    // failure the polling gate exists to prevent.
    await waitFor(() => expect(countNationalRequests()).toBe(1));
    expect(countNationalRequests()).toBe(1);
});
