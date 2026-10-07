import {render, screen, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {MemoryRouter, Route, Routes} from "react-router-dom";

import {DocumentSetPage} from "./DocumentSetPage";
import {Library} from "./Library";
import {SpecificationPage} from "../reader/SpecificationPage";

let mockSignedIn = false;
jest.mock("../../App", () => ({useAuth: () => mockSignedIn}));

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
                    <Route path="/ui/specs/sets/:slug/" element={<DocumentSetPage />} />
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

test("a document set is one cover in the library and opens to its specifications in order", async () => {
    const set = {
        slug: "set-900",
        title: "Synthetic set",
        summary: "Set summary.",
        ordered: true,
    };
    const lone = {slug: "set-901", title: "Lone set", summary: "", ordered: true};
    mockApi({
        "/api/specs/": [
            {...PUBLIC, stage: "LIVE", document_set: set},
            {...LOCKED, stage: null, document_set: set},
            {...PUBLIC, slug: "kz-902", title: "Only member", document_set: lone},
        ],
    });
    const user = userEvent.setup();
    renderSpecs("/ui/specs/");

    const cover = await screen.findByRole("link", {name: /Synthetic set/});
    expect(cover).toHaveTextContent("01Synthetic public specification");
    expect(cover).toHaveTextContent("02Safe title");
    expect(cover).toHaveTextContent("2 related specifications");
    expect(cover).toHaveTextContent("Reading order");
    // A set with one member a person can see is that specification alone.
    expect(screen.queryByText("Lone set")).toBeNull();
    expect(screen.getByRole("link", {name: /Only member/})).toHaveAttribute(
        "href",
        "/ui/specs/kz-902/",
    );

    await user.click(cover);

    expect(
        await screen.findByRole("heading", {level: 1, name: "Synthetic set"}),
    ).toBeInTheDocument();
    expect(screen.getByText("Set summary.")).toBeInTheDocument();
    const [first, second] = screen.getAllByRole("listitem");
    expect(first).toHaveTextContent("01");
    expect(within(first).getByText("Live")).toBeInTheDocument();
    expect(
        within(first).getByRole("link", {name: "Synthetic public specification"}),
    ).toHaveAttribute("href", "/ui/specs/kz-900/");
    expect(within(second).getByText("Locked")).toBeInTheDocument();
    expect(within(second).getByRole("link", {name: "Safe title"})).toHaveAttribute(
        "href",
        "/ui/specs/kz-901/",
    );
});

test("only an author is given the controls that rearrange a document set", async () => {
    const set = {slug: "set-900", title: "Synthetic set", summary: "", ordered: true};
    const routes = {
        "/api/specs/": [
            {...PUBLIC, stage: "LIVE", document_set: set},
            {...LOCKED, stage: null, document_set: set},
        ],
    };
    mockApi(routes);
    const visitor = renderSpecs("/ui/specs/sets/set-900/");
    await screen.findByRole("heading", {level: 1, name: "Synthetic set"});
    expect(screen.queryByRole("button", {name: /^Move/})).toBeNull();
    visitor.unmount();

    mockSignedIn = true;
    mockApi({
        ...routes,
        "/api/specs/author/": [],
        "/api/specs/author/sets/set-900/order/": null,
    });
    const user = userEvent.setup();
    renderSpecs("/ui/specs/sets/set-900/");

    const up = await screen.findByRole("button", {name: "Move Safe title up"});
    expect(
        screen.getByRole("button", {name: "Move Synthetic public specification up"}),
    ).toBeDisabled();
    await user.click(up);

    const [, sent] = (global.fetch as jest.Mock).mock.calls.find(
        ([url]) => url === "/api/specs/author/sets/set-900/order/",
    );
    expect(JSON.parse(sent.body)).toEqual({specifications: ["kz-901", "kz-900"]});
    mockSignedIn = false;
});
