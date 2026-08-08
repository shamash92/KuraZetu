import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CountyResults from "./countyResults";

function candidate(fullName: string, party: string) {
    return {
        fullName,
        party,
        party_color: "#000000",
        totalVotes: 1200,
        countedStreams: 3,
        percentage: 60,
        county_polling_stations_count: 5,
    };
}

const RESULTS: Record<string, unknown[]> = {
    president: [candidate("Asha Wanjiru", "Party A")],
    governor: [candidate("Baraka Otieno", "Party B")],
    senator: [],
};

beforeEach(() => {
    global.fetch = jest.fn((input: RequestInfo | URL) => {
        const level = String(input).split("/").filter(Boolean).at(-1) ?? "";
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({results: RESULTS[level] ?? []}),
        });
    }) as unknown as typeof fetch;
});

describe("county results tabs", () => {
    it("shows the presidential race first", async () => {
        render(<CountyResults />);

        expect(await screen.findByText("Asha Wanjiru")).toBeInTheDocument();
        expect(screen.queryByText("Baraka Otieno")).not.toBeInTheDocument();
    });

    it("loads a race only once its tab is opened", async () => {
        const user = userEvent.setup();
        render(<CountyResults />);

        await screen.findByText("Asha Wanjiru");
        expect(global.fetch).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole("button", {name: /governor/i}));

        expect(await screen.findByText("Baraka Otieno")).toBeInTheDocument();
        expect(screen.queryByText("Asha Wanjiru")).not.toBeInTheDocument();
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("shows the empty state for a race with no results", async () => {
        const user = userEvent.setup();
        render(<CountyResults />);

        await screen.findByText("Asha Wanjiru");
        await user.click(screen.getByRole("button", {name: /senator/i}));

        expect(
            await screen.findByText(/no results available for this level yet/i),
        ).toBeInTheDocument();
    });
});
