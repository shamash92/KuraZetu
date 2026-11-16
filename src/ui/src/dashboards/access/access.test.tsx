import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {MemoryRouter, Route, Routes} from "react-router-dom";

import {DashboardAccess, DashboardOnboarding} from "./index";

function showPage(path: string) {
    const client = new QueryClient({
        defaultOptions: {queries: {retry: false}, mutations: {retry: false}},
    });
    render(
        <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route
                        path="/ui/dashboards/onboarding/"
                        element={<DashboardOnboarding />}
                    />
                    <Route
                        path="/ui/dashboards/:id/access/"
                        element={<DashboardAccess />}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

function response(data: unknown) {
    return Promise.resolve({ok: true, json: () => Promise.resolve(data)});
}

test("sales can search for an aspirant and onboard the selected record", async () => {
    const user = userEvent.setup();
    const fetchMock = jest.fn((url: string, init?: RequestInit) => {
        if (init?.method === "POST") return response({id: 1});
        if (url.includes("options/"))
            return response({
                options: [
                    {
                        id: 42,
                        label: "Example candidate · Governor · Example county · Example party",
                    },
                ],
                has_more: false,
            });
        if (url.endsWith("/1/"))
            return response({
                id: 1,
                name: "Campaign dashboard",
                kind: "aspirant",
                active: true,
                can_edit: false,
                owner_phone: null,
                target: null,
                members: [],
            });
        return response({dashboards: [], has_more: false});
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    showPage("/ui/dashboards/onboarding/");
    await user.click(await screen.findByRole("link", {name: "Aspirant"}));
    expect(
        fetchMock.mock.calls.filter(([url]) => url.includes("options/")),
    ).toHaveLength(0);
    await user.type(screen.getByRole("combobox", {name: "Aspirant"}), "Example");
    await user.click(await screen.findByRole("option", {name: /example candidate/i}));
    await user.type(screen.getByLabelText("Owner phone number"), "0700000012");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", {name: "Create dashboard"}));
    expect(
        await screen.findByRole("heading", {name: "Campaign dashboard"}),
    ).toBeInTheDocument();
    const saved = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(JSON.parse(String(saved?.[1]?.body))).toEqual({
        kind: "aspirant",
        aspirant: 42,
        owner_phone: "+254700000012",
        active: true,
    });
});

test("an owner can add and remove a viewer without sales controls", async () => {
    const user = userEvent.setup();
    const dashboard = {
        id: 1,
        name: "Campaign dashboard",
        kind: "aspirant",
        active: true,
        can_edit: false,
        owner_phone: null,
        target: null,
        members: [],
    };
    global.fetch = jest.fn((_url: string, init?: RequestInit) => {
        if (init?.method === "POST")
            return response({
                ...dashboard,
                members: [
                    {
                        id: 2,
                        phone: "+254700000XXX",
                        owner: false,
                        status: "Awaiting verified signup",
                    },
                ],
            });
        return response(dashboard);
    }) as unknown as typeof fetch;
    showPage("/ui/dashboards/1/access/");
    await screen.findByRole("heading", {name: "Campaign dashboard"});
    expect(
        screen.queryByRole("heading", {name: "Dashboard settings"}),
    ).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Add a viewer"), "0700000013");
    await user.click(screen.getByRole("button", {name: "Add"}));
    expect(await screen.findByText("Awaiting verified signup")).toBeInTheDocument();
    await user.click(screen.getByRole("button", {name: /^remove/i}));
    await waitFor(() =>
        expect(screen.queryByText("Awaiting verified signup")).not.toBeInTheDocument(),
    );
});
