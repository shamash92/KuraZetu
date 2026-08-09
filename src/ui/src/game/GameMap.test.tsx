import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

import GameMap from "./GameMap";
import {IPollingCenterFeature} from "./types";

// The map is Leaflet, which jsdom cannot lay out, and none of the behaviour
// below is about it. Standing in for it keeps these tests about the round.
jest.mock("./Map", () => ({
    __esModule: true,
    default: () => <div data-testid="map" />,
}));

jest.mock("../App", () => ({useAuth: () => true}));

jest.mock("react-cookies", () => ({
    __esModule: true,
    default: {load: () => "test-csrf-token"},
}));

const mockToastError = jest.fn();
jest.mock("sonner", () => ({
    toast: {
        error: (message: string) => mockToastError(message),
        success: jest.fn(),
    },
}));

const RANDOM_URL = "/api/stations/polling-centers/unverified/random/ward/";
const VERIFY_URL = "/api/stations/polling-centers/verify/";

function pollingCenter(id: number, name: string): IPollingCenterFeature {
    return {
        id,
        type: "Feature",
        geometry: {type: "Polygon", coordinates: [[36.8, -1.3]]},
        properties: {
            name,
            code: `0${id}`,
            ward: "Kaloleni",
            constituency: "Kaloleni",
            county: "Kilifi",
            pin_location_error: null,
            is_verified: false,
            location_upvotes: 0,
            pin_location: {type: "Point", coordinates: [36.8, -1.3]},
        },
    };
}

function round(center: IPollingCenterFeature, extra: Record<string, unknown> = {}) {
    return {
        data: center,
        partially_verified: {features: []},
        total_stations_count: 40,
        verified_stations_count: 7,
        ...extra,
    };
}

/**
 * Installs a `fetch` that answers the draw endpoint with each queued body in
 * turn, and every write with the upvote endpoint's success body. Reports how
 * many draws and verifications were requested.
 */
function mockDraws(...bodies: Array<unknown>) {
    let call = 0;
    const fetchMock = jest.fn((input: RequestInfo | URL) => {
        if (String(input) !== RANDOM_URL) {
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () =>
                    Promise.resolve({
                        message: "Polling Center location upvoted successfully",
                    }),
            });
        }

        const body = bodies[Math.min(call, bodies.length - 1)];
        call += 1;
        return Promise.resolve({ok: true, json: () => Promise.resolve(body)});
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const countCalls = (url: string) =>
        fetchMock.mock.calls.filter(([input]) => String(input) === url).length;

    return {
        countDraws: () => countCalls(RANDOM_URL),
        countVerifications: () => countCalls(VERIFY_URL),
    };
}

function renderGame() {
    return render(
        <QueryClientProvider client={new QueryClient()}>
            <GameMap level="ward" />
        </QueryClientProvider>,
    );
}

test("a drawn polling center is shown with the volunteer's progress", async () => {
    mockDraws(round(pollingCenter(1, "Kaloleni Primary School")));

    renderGame();

    expect(await screen.findByText("Kaloleni Primary School")).toBeInTheDocument();
    expect(screen.getByText(/40 centers/)).toBeInTheDocument();
    expect(screen.getByText(/7 helped/)).toBeInTheDocument();
});

test("skipping draws a different polling center", async () => {
    const user = userEvent.setup();
    const {countDraws} = mockDraws(
        round(pollingCenter(1, "Kaloleni Primary School")),
        round(pollingCenter(2, "Mnarani Academy")),
    );

    renderGame();

    await screen.findByText("Kaloleni Primary School");
    expect(countDraws()).toBe(1);

    await user.click(screen.getByRole("button", {name: /skip/i}));

    expect(await screen.findByText("Mnarani Academy")).toBeInTheDocument();
    expect(screen.queryByText("Kaloleni Primary School")).not.toBeInTheDocument();
    expect(countDraws()).toBe(2);
});

test("confirming the pin records the verification and draws the next center", async () => {
    const user = userEvent.setup();
    const {countDraws, countVerifications} = mockDraws(
        round(pollingCenter(1, "Kaloleni Primary School")),
        round(pollingCenter(2, "Mnarani Academy")),
    );

    renderGame();

    await screen.findByText("Kaloleni Primary School");

    await user.click(screen.getByRole("button", {name: /yes — this pin is right/i}));

    expect(await screen.findByText("Mnarani Academy")).toBeInTheDocument();
    expect(countVerifications()).toBe(1);
    expect(countDraws()).toBe(2);
});

test("a verification refused inside a 200 is shown and keeps the same center", async () => {
    mockToastError.mockClear();
    const user = userEvent.setup();

    // The verify endpoint reports most refusals as `{error}` with a 200, so a
    // successful status is not a saved verification.
    const fetchMock = jest.fn((input: RequestInfo | URL) => {
        if (String(input) === RANDOM_URL) {
            return Promise.resolve({
                ok: true,
                json: () =>
                    Promise.resolve(
                        round(pollingCenter(1, "Kaloleni Primary School")),
                    ),
            });
        }

        return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
                Promise.resolve({
                    error: "You have already verified this polling center",
                }),
        });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    renderGame();

    await screen.findByText("Kaloleni Primary School");

    await user.click(screen.getByRole("button", {name: /yes — this pin is right/i}));

    await waitFor(() =>
        expect(mockToastError).toHaveBeenCalledWith(
            "You have already verified this polling center",
        ),
    );
    expect(screen.getByText("Kaloleni Primary School")).toBeInTheDocument();
    expect(
        fetchMock.mock.calls.filter(([input]) => String(input) === RANDOM_URL),
    ).toHaveLength(1);
});

test("a center the volunteer already verified is announced once, not treated as an error", async () => {
    mockToastError.mockClear();
    const center = pollingCenter(3, "Bofa Primary School");
    mockDraws(
        round(center, {
            error: "You have already verified this polling center",
            user_verification: null,
        }),
    );

    renderGame();

    await waitFor(() =>
        expect(mockToastError).toHaveBeenCalledWith(
            "You have already verified this polling center",
        ),
    );

    // Rendering again must not re-announce the same centre.
    expect(mockToastError).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("map")).toBeInTheDocument();
});

test("a failed draw is requested once and not retried on its own", async () => {
    const fetchMock = jest.fn(() =>
        Promise.resolve({
            ok: false,
            status: 503,
            json: () => Promise.resolve({error: "Draw unavailable"}),
        }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    renderGame();

    // The endpoint sorts the whole polling-centre table randomly on every call,
    // so a retry is the most expensive possible response to a failure.
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledTimes(1);
});
