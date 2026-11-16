import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

import ResultsHome from "./home";

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

function tally(votes: [number, number]) {
    const reported = votes[0] + votes[1] > 0 ? 1 : 0;
    return {
        candidates: [
            {
                id: 1,
                name: "Amina Otieno",
                party: "EP",
                votes: votes[0],
                share: 0,
                focused: true,
            },
            {
                id: 2,
                name: "Brian Kamau",
                party: "OP",
                votes: votes[1],
                share: 0,
                focused: false,
            },
        ],
        votes: votes[0] + votes[1],
        reported,
        stations: 1,
        disagreements: 0,
        leader_ids:
            votes[0] === votes[1]
                ? reported
                    ? [1, 2]
                    : []
                : [votes[0] > votes[1] ? 1 : 2],
        status: !reported ? "No results" : votes[0] === votes[1] ? "Tied" : "Leading",
    };
}

function respond(context: unknown) {
    const requests: Array<string> = [];
    global.fetch = jest.fn((input: RequestInfo | URL) => {
        const url = String(input);
        requests.push(url);
        const body =
            url === "/api/results/dashboard/"
                ? context
                : url.startsWith("/api/results/dashboard/results/")
                  ? url.includes("area=center")
                      ? {
                            dashboard: "Amina Otieno MCA dashboard",
                            race: "mca",
                            focus: "Amina Otieno",
                            area: {level: "center", id: 7, name: "Kaloleni Primary"},
                            breadcrumbs: [
                                {level: "ward", id: 3, name: "Kaloleni"},
                                {level: "center", id: 7, name: "Kaloleni Primary"},
                            ],
                            summary: tally([0, 0]),
                            children: [],
                        }
                      : {
                            dashboard: "Amina Otieno MCA dashboard",
                            race: "mca",
                            focus: "Amina Otieno",
                            area: {level: "ward", id: 3, name: "Kaloleni"},
                            breadcrumbs: [{level: "ward", id: 3, name: "Kaloleni"}],
                            summary: tally([40, 40]),
                            children: [
                                {
                                    level: "center",
                                    id: 7,
                                    name: "Kaloleni Primary",
                                    ...tally([0, 0]),
                                },
                            ],
                        }
                  : url.startsWith("/api/results/dashboard/stations/")
                    ? {
                          area: {level: "ward", id: 3, name: "Kaloleni"},
                          stations: [
                              {
                                  level: "station",
                                  id: 9,
                                  name: "Kaloleni Primary · Station 1",
                                  center: {id: 7, name: "Kaloleni Primary"},
                                  stream: 1,
                                  reported: false,
                                  disagrees: false,
                                  votes: null,
                                  position: null,
                                  tied: false,
                                  leaders: [],
                              },
                          ],
                      }
                    : url.startsWith("/api/results/dashboard/activity/")
                      ? {contested_total: 0, contested: [], recent: []}
                      : url.startsWith("/api/results/dashboard/uploads/")
                        ? {
                              station: {level: "station", id: 9, name: "S"},
                              candidates: [],
                              uploads: [],
                          }
                        : {results: [], data: [], streams: 0};
        return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(body),
        });
    }) as unknown as typeof fetch;
    return requests;
}

function show() {
    render(
        <QueryClientProvider client={new QueryClient()}>
            <ResultsHome />
        </QueryClientProvider>,
    );
}

test("a ward dashboard lists centres with streams and opens one alongside", async () => {
    const requests = respond({
        dashboard: {id: 1, name: "Amina Otieno MCA dashboard", kind: "aspirant"},
        manage_url: "/ui/dashboards/1/access/",
        onboarding_url: null,
    });
    show();

    expect(
        await screen.findByRole("heading", {name: "MCA race · all of Kaloleni"}),
    ).toBeInTheDocument();
    expect(screen.getByText("Tied with Brian Kamau")).toBeInTheDocument();
    expect(screen.getByRole("link", {name: "Manage viewers"})).toHaveAttribute(
        "href",
        "/ui/dashboards/1/access/",
    );

    expect(
        await screen.findByText("Kaloleni Primary", {selector: "th"}),
    ).toBeInTheDocument();
    expect(requests).toContain("/api/results/dashboard/stations/?area=ward&id=3");
    expect(
        await screen.findByText("No station has uploads that disagree."),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", {name: "Stream 1"}));
    expect(
        await screen.findByRole("heading", {name: "Kaloleni Primary · Station 1"}),
    ).toBeInTheDocument();
    expect(await screen.findByText("No counted uploads yet.")).toBeInTheDocument();
    expect(requests).toContain("/api/results/dashboard/uploads/?id=9");
});

test("a person without an active dashboard gets the civilian results", async () => {
    respond({dashboard: null, manage_url: null, onboarding_url: null});
    show();

    expect(await screen.findByText(/County Election Results/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", {name: /MCA race/})).not.toBeInTheDocument();
});
