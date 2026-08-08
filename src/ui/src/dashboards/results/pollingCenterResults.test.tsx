import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

import PollingCenterResults from "./pollingCenterResults";

const WARD_NUMBER = 1234;
const CENTER_CODE = "001";

// The real context reads `window.django*` at module load, which is too early
// for a test to set. Mocking the module supplies a signed-in user whose ward
// and centre appear in every URL asserted below.
jest.mock("../../App", () => ({
    useUser: () => ({
        djangoUserPollingCenterCode: "001",
        djangoUserPollingCenterName: "Kaloleni Primary School",
        djangoUserWardNumber: 1234,
    }),
}));

// A client per test, so one test's cache cannot answer another's fetch and
// make the request-count assertions below meaningless.
function renderPollingCenterResults() {
    const client = new QueryClient({
        defaultOptions: {queries: {retry: false}},
    });
    return render(
        <QueryClientProvider client={client}>
            <PollingCenterResults />
        </QueryClientProvider>,
    );
}

function station(code: string, streamNumber: number) {
    return {
        code,
        stream_number: streamNumber,
        registered_voters: 700,
        date_created: "2026-08-01T00:00:00Z",
        date_modified: "2026-08-01T00:00:00Z",
        is_verified: true,
    };
}

function aspirant(id: number, firstName: string, lastName: string, party: string) {
    return {
        id,
        first_name: firstName,
        last_name: lastName,
        surname: null,
        party,
        party_color: "#000000",
        level: "president",
        passport_photo: null,
        county: null,
        constituency: null,
        ward: null,
        is_verified: true,
        verified_by_party: true,
    };
}

// Two streams of the same centre, so the aggregation the component relies on
// has something to add up.
const RESPONSES: Record<string, unknown[]> = {
    presidential: [
        {
            polling_station: station("001-1", 1),
            presidential_candidate: aspirant(1, "Asha", "Wanjiru", "Party A"),
            votes: 500,
            is_verified: true,
        },
        {
            polling_station: station("001-2", 2),
            presidential_candidate: aspirant(1, "Asha", "Wanjiru", "Party A"),
            votes: 700,
            is_verified: true,
        },
    ],
    governor: [
        {
            polling_station: station("001-1", 1),
            governor_candidate: aspirant(2, "Baraka", "Otieno", "Party B"),
            votes: 300,
            is_verified: true,
        },
    ],
    senator: [],
};

// Deliberately larger than the number of streams that appear in `RESPONSES`, so
// the "x/y streams" denominator can only come from the API's own count.
const CENTER_STREAMS = 5;

beforeEach(() => {
    global.fetch = jest.fn((input: RequestInfo | URL) => {
        const level = String(input).split("/").filter(Boolean).at(-1) ?? "";
        return Promise.resolve({
            ok: true,
            json: () =>
                Promise.resolve({
                    data: RESPONSES[level] ?? [],
                    streams: CENTER_STREAMS,
                }),
        });
    }) as unknown as typeof fetch;
});

describe("polling center results tabs", () => {
    it("shows the presidential race first, aggregated across streams", async () => {
        renderPollingCenterResults();

        expect(await screen.findByText("Asha Wanjiru")).toBeInTheDocument();
        expect(screen.getByText("1,200 votes")).toBeInTheDocument();
        expect(screen.queryByText("Baraka Otieno")).not.toBeInTheDocument();
    });

    it("counts reported streams against every stream at the centre", async () => {
        renderPollingCenterResults();

        // Two of the centre's five streams have reported this candidate. The
        // count of streams present in the response would read "2/2".
        expect(await screen.findByText("2/5 streams")).toBeInTheDocument();
    });

    it("requests the signed-in user's ward and centre", async () => {
        renderPollingCenterResults();

        await screen.findByText("Asha Wanjiru");
        expect(global.fetch).toHaveBeenCalledWith(
            `/api/results/polling-center/${WARD_NUMBER}/${CENTER_CODE}/presidential/`,
            expect.objectContaining({method: "GET"}),
        );
    });

    it("loads a race only once its tab is opened", async () => {
        const user = userEvent.setup();
        renderPollingCenterResults();

        await screen.findByText("Asha Wanjiru");
        expect(global.fetch).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole("button", {name: /governor/i}));

        expect(await screen.findByText("Baraka Otieno")).toBeInTheDocument();
        expect(screen.queryByText("Asha Wanjiru")).not.toBeInTheDocument();
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("serves a revisited tab from cache", async () => {
        const user = userEvent.setup();
        renderPollingCenterResults();

        await screen.findByText("Asha Wanjiru");
        await user.click(screen.getByRole("button", {name: /governor/i}));
        await screen.findByText("Baraka Otieno");
        expect(global.fetch).toHaveBeenCalledTimes(2);

        await user.click(screen.getByRole("button", {name: /president/i}));

        expect(await screen.findByText("Asha Wanjiru")).toBeInTheDocument();
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("shows the empty state for a race with no results", async () => {
        const user = userEvent.setup();
        renderPollingCenterResults();

        await screen.findByText("Asha Wanjiru");
        await user.click(screen.getByRole("button", {name: /senator/i}));

        expect(
            await screen.findByText(/no results available for this level yet/i),
        ).toBeInTheDocument();
    });

    it("shows an error with a retry action when the request fails", async () => {
        const user = userEvent.setup();
        global.fetch = jest
            .fn()
            .mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: () => Promise.resolve({error: "Server exploded"}),
            })
            .mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({data: RESPONSES.presidential, streams: 2}),
            }) as unknown as typeof fetch;

        renderPollingCenterResults();

        expect(await screen.findByText("Server exploded")).toBeInTheDocument();

        await user.click(screen.getByRole("button", {name: /try again/i}));

        expect(await screen.findByText("Asha Wanjiru")).toBeInTheDocument();
    });

    it("treats a 200 carrying an error body as a failure", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({error: "Polling center not found."}),
        }) as unknown as typeof fetch;

        renderPollingCenterResults();

        expect(
            await screen.findByText("Polling center not found."),
        ).toBeInTheDocument();
    });
});
