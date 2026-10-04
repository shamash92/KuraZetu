import {render, screen, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {MemoryRouter, Route, Routes} from "react-router-dom";

import {Library} from "./Library";
import {SpecificationPage} from "./SpecificationPage";

jest.mock("../App", () => ({useAuth: () => false}));

const PUBLIC = {
    slug: "kz-900",
    title: "Synthetic public specification",
    summary: "Placeholder summary.",
    access: "full",
    archived: false,
    published_at: "2026-10-03T12:00:00Z",
};
const LOCKED = {
    slug: "kz-901",
    title: "Safe title",
    summary: "Safe summary.",
    access: "locked",
    archived: false,
    published_at: null,
};

const BODY = "Synthetic body.";

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
                    <Route path="/ui/specs/" element={<Library />} />
                    <Route path="/ui/specs/:slug/" element={<SpecificationPage />} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

test("a visitor browses the library and reads a public specification", async () => {
    mockApi({
        "/api/specs/": [PUBLIC, LOCKED],
        "/api/specs/kz-900/": {
            ...PUBLIC,
            body: BODY,
            superseded_by: LOCKED,
        },
    });
    const user = userEvent.setup();
    renderSpecs("/ui/specs/");

    const locked = (await screen.findByText("Safe title")).closest("li")!;
    expect(within(locked).getByText(/^Restricted\./)).toBeInTheDocument();

    await user.click(
        screen.getByRole("link", {name: /Synthetic public specification/}),
    );

    expect(await screen.findByText("Synthetic body.")).toBeInTheDocument();
    expect(screen.getByText("3 Oct 2026")).toBeInTheDocument();
    expect(screen.getByRole("link", {name: "Safe title"})).toHaveAttribute(
        "href",
        "/ui/specs/kz-901/",
    );
});

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
