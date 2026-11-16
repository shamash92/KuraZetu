import {fireEvent, render, screen} from "@testing-library/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

import {AreaMap} from "./AreaMap";
import type {Results, Tally} from "./dashboardApi";

function tally(votes: [number, number], reported: number): Tally {
    const [mine, theirs] = votes;
    const total = mine + theirs;
    const top = Math.max(mine, theirs);
    return {
        candidates: [
            {
                id: 1,
                name: "Amina Otieno",
                party: "A",
                colour: null,
                votes: mine,
                share: total ? (mine * 100) / total : 0,
                focused: true,
            },
            {
                id: 2,
                name: "Brian Kamau",
                party: "B",
                colour: null,
                votes: theirs,
                share: total ? (theirs * 100) / total : 0,
                focused: false,
            },
        ].sort((a, b) => b.votes - a.votes),
        votes: total,
        reported,
        stations: 4,
        disagreements: 0,
        leader_ids: top
            ? [1, 2].filter((id) => (id === 1 ? mine : theirs) === top)
            : [],
        status: !reported ? "No results" : mine === theirs ? "Tied" : "Leading",
    };
}

const data: Results = {
    dashboard: "MP",
    race: "mp",
    focus: "Amina Otieno",
    area: {level: "constituency", id: 5, name: "Westlands"},
    breadcrumbs: [{level: "constituency", id: 5, name: "Westlands"}],
    summary: tally([30, 20], 3),
    children: [
        {level: "ward", id: 11, name: "Kangemi", ...tally([30, 10], 2)},
        {level: "ward", id: 12, name: "Karura", ...tally([0, 10], 1)},
        {level: "ward", id: 13, name: "Kitisuru", ...tally([0, 0], 0)},
    ],
};

const square = (x: number) => ({
    type: "Polygon",
    coordinates: [
        [
            [36 + x, -1],
            [36.1 + x, -1],
            [36.1 + x, -0.9],
            [36 + x, -0.9],
            [36 + x, -1],
        ],
    ],
});

test("areas are shaded by the same figures as the list and open on click", async () => {
    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
                Promise.resolve({
                    area: data.area,
                    outline: null,
                    shapes: [
                        {id: 11, geometry: square(0)},
                        {id: 12, geometry: square(0.1)},
                        {id: 13, geometry: null},
                    ],
                }),
        }),
    ) as unknown as typeof fetch;
    const onOpen = jest.fn();
    render(
        <QueryClientProvider client={new QueryClient()}>
            <AreaMap data={data} onOpen={onOpen} />
        </QueryClientProvider>,
    );

    const kangemi = await screen.findByRole("button", {
        name: "Kangemi: 1st · 30 votes, 2 of 4 stations reported",
    });
    expect(kangemi).toHaveClass("rd-fill-lead");
    expect(screen.getByRole("button", {name: /^Karura: 2nd/})).toHaveClass(
        "rd-fill-trail",
    );
    expect(screen.getByText("No map location for Kitisuru.")).toBeInTheDocument();
    expect(screen.getByText("Amina Otieno leading")).toBeInTheDocument();

    fireEvent.click(kangemi);
    expect(onOpen).toHaveBeenCalledWith(data.children[0]);
    fireEvent.keyDown(screen.getByRole("button", {name: /^Karura/}), {key: "Enter"});
    expect(onOpen).toHaveBeenCalledWith(data.children[1]);
});
