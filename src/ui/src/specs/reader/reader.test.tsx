import {render, screen, within} from "@testing-library/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {MemoryRouter, Route, Routes} from "react-router-dom";

import {SpecificationPage} from "./SpecificationPage";

jest.mock("../../App", () => ({useAuth: () => false}));

const LOCKED = {
    slug: "kz-901",
    title: "Safe title",
    summary: "Safe summary.",
    access: "locked",
    archived: false,
    published_at: null,
};

/** Answers each API path from `routes`; anything else is a 404. */
function mockApi(routes: Record<string, unknown>) {
    global.fetch = jest.fn((input: RequestInfo | URL) => {
        const body = routes[String(input)];
        return Promise.resolve({
            ok: body !== undefined,
            status: body === undefined ? 404 : 200,
            json: () => Promise.resolve(body ?? {detail: "Not found."}),
        });
    }) as unknown as typeof fetch;
}

function renderSpecs(path: string) {
    return render(
        <QueryClientProvider
            client={new QueryClient({defaultOptions: {queries: {retry: false}}})}
        >
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="/ui/specs/:slug/" element={<SpecificationPage />} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

test("a restricted page shows only its safe listing and a missing one says so", async () => {
    mockApi({"/api/specs/kz-901/": LOCKED});

    const locked = renderSpecs("/ui/specs/kz-901/");
    expect(
        await screen.findByRole("heading", {level: 1, name: "Safe title"}),
    ).toBeInTheDocument();
    expect(screen.getByText(/^Restricted\./)).toBeInTheDocument();
    // The notice offers nothing to do.
    expect(within(screen.getByRole("main")).queryByRole("button")).toBeNull();
    locked.unmount();

    renderSpecs("/ui/specs/kz-999/");
    expect(
        await screen.findByRole("heading", {name: "This page doesn’t exist."}),
    ).toBeInTheDocument();
});
