import {act, render, screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {
    Route,
    RouterProvider,
    Routes,
    createMemoryRouter,
} from "react-router-dom";

import {NewSpecification} from "./NewSpecification";
import {Editor} from "./Editor";

jest.mock("../../App", () => ({useAuth: () => true}));

type Call = {method: string; url: string; body: Record<string, unknown>};

/**
 * A stand-in for the author API that keeps specifications in memory, so a
 * test can follow one through several writes. `refuse` makes the next write
 * to a path fail the way the server reports a refused change.
 */
function fakeAuthorApi(initial: Array<Record<string, any>> = []) {
    const specs = new Map<string, Record<string, any>>(
        initial.map((spec) => [spec.slug, {...blank(), ...spec}]),
    );
    const calls: Array<Call> = [];
    const refusals = new Map<string, string>();
    const sets: Array<Record<string, unknown>> = [];

    function blank() {
        return {
            access_policy: "RESTRICTED_CONCEALED",
            published: false,
            has_unpublished_changes: true,
            archived: false,
            summary: "",
            body: "",
            safe_listing_title: "",
            safe_listing_summary: "",
            superseded_by: null,
            document_set: null,
            stage: "DRAFT",
            readers: [] as Array<string>,
            revisions: [] as Array<Record<string, unknown>>,
        };
    }

    function answer(url: string, method: string, body: Record<string, any>) {
        if (url === "/api/specs/author/sets/") {
            if (method === "POST") sets.push({...body, slug: "set-900"});
            return method === "POST" ? sets[sets.length - 1] : [...sets];
        }
        const [, slug, action, sequence] =
            url.match(/^\/api\/specs\/author\/(?:([^/]+)\/(?:([^/]+)\/)?(?:(\d+)\/)?)?$/) ??
            [];
        if (slug === undefined) {
            if (method === "GET") return Array.from(specs.values());
            specs.set("kz-900", {...blank(), ...body, slug: "kz-900"});
            return specs.get("kz-900");
        }
        const spec = specs.get(slug);
        if (!spec) return undefined;
        if (action === "revisions") {
            return spec.revisions.find((r: {sequence: number}) => r.sequence === Number(sequence));
        }
        if (action === "publish") {
            spec.revisions.unshift({
                sequence: spec.revisions.length + 1,
                title: spec.title,
                summary: spec.summary,
                body: spec.body,
                published_at: "2026-10-03T12:00:00Z",
            });
            Object.assign(spec, {published: true, has_unpublished_changes: false});
        } else if (action === "access-policy") {
            spec.access_policy = body.access_policy;
        } else if (action === "readers") {
            spec.readers =
                method === "POST"
                    ? [...spec.readers, body.phone_number]
                    : spec.readers.filter((number: string) => number !== body.phone_number);
        } else if (method === "PATCH") {
            Object.assign(spec, body, {has_unpublished_changes: true});
            spec.title = spec.title.trim();
        }
        return {...spec, revisions: [...spec.revisions]};
    }

    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";
        const body = init?.body ? JSON.parse(String(init.body)) : {};
        if (method !== "GET") calls.push({method, url, body});

        const refusal = method === "GET" ? undefined : refusals.get(url);
        refusals.delete(url);
        const data = refusal ? {error: refusal} : answer(url, method, body);
        return Promise.resolve({
            ok: !refusal && data !== undefined,
            status: refusal ? 400 : data === undefined ? 404 : 200,
            json: () => Promise.resolve(data ?? {detail: "Not found."}),
        });
    }) as unknown as typeof fetch;

    return {
        calls,
        /** Lists a revision in the specification without making it fetchable. */
        listRevision(slug: string, sequence: number) {
            const {revisions} = specs.get(slug)!;
            Object.defineProperty(revisions, "find", {value: () => undefined});
            revisions.push({sequence, title: "", published_at: "2026-10-03T12:00:00Z"});
        },
        refuse: (url: string, message: string) => refusals.set(url, message),
    };
}

/** Mounted the way the application mounts: a data router around the route
 *  table, so the editor can hold a navigation. Returns the router so a test
 *  can press Back. */
function renderAuthoring(path: string) {
    const router = createMemoryRouter(
        [
            {
                path: "*",
                element: (
                    <Routes>
                        <Route path="/ui/specs/author/" element={<NewSpecification />} />
                        <Route path="/ui/specs/author/:slug/" element={<Editor />} />
                    </Routes>
                ),
            },
        ],
        {initialEntries: [path]},
    );
    render(
        <QueryClientProvider
            client={new QueryClient({defaultOptions: {queries: {retry: false}}})}
        >
            <RouterProvider router={router} />
        </QueryClientProvider>,
    );
    return router;
}

test("an author creates a specification, drafts it with a live preview and publishes", async () => {
    const api = fakeAuthorApi();
    const user = userEvent.setup();
    const router = renderAuthoring("/ui/specs/author/");

    await user.type(await screen.findByLabelText("Title"), "Synthetic title");
    await user.click(screen.getByRole("button", {name: "Create draft"}));

    const source = await screen.findByLabelText("Markdown");
    expect(screen.getByRole("status")).toHaveTextContent(
        "Draft saved · Not published",
    );
    expect(screen.getByRole("button", {name: "Save draft"})).toBeDisabled();

    await user.click(source);
    await user.paste("## Pasted heading\n\nPasted paragraph.");
    // The server trims the title; that must not leave the draft looking
    // unsaved once it is saved.
    await user.type(screen.getByLabelText("Title"), " ");
    // The corner button swaps the Markdown for its preview and back.
    await user.click(screen.getByRole("button", {name: "Preview"}));
    const preview = screen.getByRole("region", {name: "Preview"});
    expect(within(preview).getByText(/Pasted heading/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", {name: "Edit"}));
    expect(screen.getByRole("status")).toHaveTextContent("Unsaved changes");
    // Neither a link nor the Back button leaves an unsaved draft behind.
    for (const leave of [
        () => user.click(screen.getByRole("link", {name: "Write"})),
        () => act(() => router.navigate(-1)),
    ]) {
        await leave();
        const warning = await screen.findByRole("alertdialog", {
            name: "Unsaved changes",
        });
        await user.click(within(warning).getByRole("button", {name: "Stay"}));
        expect(screen.getByLabelText("Markdown")).toHaveValue(
            "## Pasted heading\n\nPasted paragraph.",
        );
    }

    // Publishing takes the saved draft, so it waits for the save.
    expect(screen.getByRole("button", {name: "Publish"})).toBeDisabled();

    await user.click(screen.getByRole("button", {name: "Save draft"}));
    await user.click(await screen.findByRole("button", {name: "Publish"}));

    expect(await screen.findByText(/Draft saved · Published$/)).toBeInTheDocument();
    expect(api.calls.map((call) => `${call.method} ${call.url}`)).toEqual([
        "POST /api/specs/author/",
        "PATCH /api/specs/author/kz-900/",
        "POST /api/specs/author/kz-900/publish/",
    ]);

    await user.click(screen.getByRole("button", {name: "View revision 1"}));
    const revision = await screen.findByRole("region", {name: "Revision 1"});
    expect(within(revision).getByText(/Pasted paragraph\./)).toBeInTheDocument();
});

test("widening access shows what becomes visible and waits for confirmation", async () => {
    const api = fakeAuthorApi([
        {
            slug: "kz-900",
            title: "Real title",
            body: "Draft body.",
            published: true,
            has_unpublished_changes: false,
            safe_listing_title: "Safe title",
            safe_listing_summary: "Safe summary.",
            revisions: [
                {
                    sequence: 1,
                    title: "Real title",
                    summary: "Real summary.",
                    body: "Published body.",
                    published_at: "2026-10-03T12:00:00Z",
                },
            ],
        },
    ]);
    const user = userEvent.setup();
    renderAuthoring("/ui/specs/author/kz-900/");
    const policy = await screen.findByLabelText("Access");

    await user.selectOptions(policy, "RESTRICTED_LISTED");
    let confirmation = screen.getByRole("group", {name: "Confirm wider access"});
    expect(within(confirmation).getByText("Safe title")).toBeInTheDocument();
    expect(within(confirmation).getByText("Safe summary.")).toBeInTheDocument();
    await user.click(within(confirmation).getByRole("button", {name: "Cancel"}));
    expect(api.calls).toEqual([]);

    await user.selectOptions(policy, "PUBLIC");
    confirmation = screen.getByRole("group", {name: "Confirm wider access"});
    expect(
        await within(confirmation).findByText("Published body."),
    ).toBeInTheDocument();
    await user.click(
        within(confirmation).getByRole("button", {name: "Confirm: Public"}),
    );
    await waitFor(() => expect(policy).toHaveValue("PUBLIC"));

    // Narrowing needs no confirmation.
    await user.selectOptions(policy, "RESTRICTED_CONCEALED");
    await waitFor(() => expect(policy).toHaveValue("RESTRICTED_CONCEALED"));

    expect(api.calls.map((call) => call.body)).toEqual([
        {access_policy: "PUBLIC", confirm_widening: true},
        {access_policy: "RESTRICTED_CONCEALED", confirm_widening: false},
    ]);
});

test("access cannot be widened to public until the revision is on screen", async () => {
    // The listed revision cannot be fetched, so there is nothing to show.
    fakeAuthorApi([
        {
            slug: "kz-900",
            title: "Real title",
            published: true,
            revisions: [],
        },
    ]).listRevision("kz-900", 1);
    const user = userEvent.setup();
    renderAuthoring("/ui/specs/author/kz-900/");

    await user.selectOptions(await screen.findByLabelText("Access"), "PUBLIC");

    const confirmation = screen.getByRole("group", {name: "Confirm wider access"});
    expect(await within(confirmation).findByRole("alert")).toHaveTextContent(
        "The revision could not be loaded",
    );
    expect(
        within(confirmation).getByRole("button", {name: "Confirm: Public"}),
    ).toBeDisabled();
});

test("an author adds and removes readers and sees why a change was refused", async () => {
    const api = fakeAuthorApi([{slug: "kz-900", title: "Real title"}]);
    const user = userEvent.setup();
    renderAuthoring("/ui/specs/author/kz-900/");
    // The row says what the list holds; opening it gives the form.
    await user.click(await screen.findByText("No readers"));
    const number = screen.getByLabelText("Phone number of the account");

    api.refuse("/api/specs/author/kz-900/readers/", "No account has this phone number.");
    await user.type(number, "+254700000404");
    await user.click(screen.getByRole("button", {name: "Add reader"}));
    expect(await screen.findByRole("alert")).toHaveTextContent(
        "No account has this phone number.",
    );

    await user.clear(number);
    await user.type(number, "+254700000009");
    await user.click(screen.getByRole("button", {name: "Add reader"}));
    await user.click(
        await screen.findByRole("button", {name: "Remove +254700000009"}),
    );
    expect(await screen.findByText("No readers")).toBeInTheDocument();

    const archived = screen.getByLabelText("Archived");
    await user.selectOptions(archived, "Yes");
    await waitFor(() => expect(archived).toHaveDisplayValue("Yes"));
});

test("an author makes a document set, places a specification in it and sets its stage", async () => {
    const api = fakeAuthorApi([{slug: "kz-900", title: "Synthetic title"}]);
    const user = userEvent.setup();
    renderAuthoring("/ui/specs/author/kz-900/");

    // A set that does not exist yet is made from the menu that chooses one.
    await user.click(await screen.findByText("Document set"));
    await user.selectOptions(screen.getByLabelText("Belongs to"), "new");
    await user.type(screen.getByLabelText("Title of the new set"), "Synthetic set");
    await user.click(screen.getByRole("button", {name: "Save document set"}));

    // Saved, the row itself names the set.
    await waitFor(() =>
        expect(screen.getByText("Document set").closest("summary")).toHaveTextContent(
            "Synthetic set",
        ),
    );
    await user.selectOptions(screen.getByLabelText("Stage"), "Accepted");

    await waitFor(() =>
        expect(api.calls.map((call) => call.body)).toEqual([
            {title: "Synthetic set", summary: "", ordered: true},
            {document_set: "set-900"},
            {stage: "ACCEPTED"},
        ]),
    );
});

test("the author routes look missing to anyone else", async () => {
    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok: false,
            status: 404,
            json: () => Promise.resolve({detail: "Not found."}),
        }),
    ) as unknown as typeof fetch;

    renderAuthoring("/ui/specs/author/kz-900/");
    expect(
        await screen.findByRole("heading", {name: "This page doesn’t exist."}),
    ).toBeInTheDocument();
});
