import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useEffect, useState} from "react";
import {Link, useBlocker, useParams} from "react-router-dom";

import {specKeys} from "../api/queryKeys";
import {querySettings} from "../api/querySettings";

import {POLICY_NAMES, publicationStatus} from "./AuthorLibrary";
import {
    changeAccessPolicy,
    changeReader,
    getAuthorLibrary,
    getAuthorSpecification,
    getRevision,
    publishSpecification,
    saveSpecification,
} from "./authorApi";
import type {AccessPolicy, AuthorSpecification} from "./authorApi";
import {SpecMarkdown} from "./SpecMarkdown";
import {SpecsShell} from "./SpecsShell";

const DISCLOSURE: Record<AccessPolicy, number> = {
    RESTRICTED_CONCEALED: 0,
    RESTRICTED_LISTED: 1,
    PUBLIC: 2,
};
const POLICIES = Object.keys(DISCLOSURE) as Array<AccessPolicy>;
const REVISION_DATE = new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
});

export function Editor() {
    const {slug = ""} = useParams();
    const specification = useQuery({
        queryKey: specKeys.authorSpecification(slug),
        queryFn: ({signal}) => getAuthorSpecification(slug, signal),
        retry: false,
        ...querySettings.specs,
    });

    if (specification.isError) {
        return (
            <SpecsShell>
                <h1>Page not found</h1>
                <p className="lede">
                    <Link to="/ui/specs/">See all specifications</Link>.
                </p>
            </SpecsShell>
        );
    }
    if (!specification.data) {
        return (
            <SpecsShell>
                <p className="status">Loading…</p>
            </SpecsShell>
        );
    }
    return <EditorForm key={slug} spec={specification.data} />;
}

/** Every write answers with the whole specification, which replaces the
 *  cached copy so each panel shows what the server now holds. */
function useSpecificationChange<Input>(
    slug: string,
    mutationFn: (input: Input) => Promise<AuthorSpecification>,
) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn,
        onSuccess: (saved) =>
            queryClient.setQueryData(specKeys.authorSpecification(slug), saved),
    });
}

function EditorForm({spec}: {spec: AuthorSpecification}) {
    const {slug} = spec;
    const [title, setTitle] = useState(spec.title);
    const [summary, setSummary] = useState(spec.summary);
    const [body, setBody] = useState(spec.body);
    const [pane, setPane] = useState<"source" | "preview">("source");

    const isDirty =
        title !== spec.title || summary !== spec.summary || body !== spec.body;

    const save = useSpecificationChange(slug, () =>
        saveSpecification(slug, {title, summary, body}),
    );
    const publish = useSpecificationChange(slug, () => publishSpecification(slug));

    useEffect(() => {
        if (!isDirty) return;
        const warn = (event: BeforeUnloadEvent) => event.preventDefault();
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [isDirty]);

    // Links, Back and Forward all stay inside the page, where `beforeunload`
    // never fires, so the router holds them until the author decides.
    const leaving = useBlocker(isDirty);

    const failure = save.error ?? publish.error;

    return (
        <SpecsShell wide>
            {leaving.state === "blocked" && (
                <div className="notice" role="alertdialog" aria-label="Unsaved changes">
                    <p>The draft has unsaved changes. Leaving discards them.</p>
                    <button type="button" onClick={() => leaving.reset()}>
                        Stay
                    </button>
                    <button type="button" onClick={() => leaving.proceed()}>
                        Leave without saving
                    </button>
                </div>
            )}
            <p className="meta">
                <Link to="/ui/specs/author/">All specifications</Link> · {slug}
            </p>
            <form
                className="draft"
                onSubmit={(event) => {
                    event.preventDefault();
                    save.mutate(undefined);
                }}
            >
                <label htmlFor="draft-title">Title</label>
                <input
                    id="draft-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    maxLength={200}
                />
                <label htmlFor="draft-summary">Summary</label>
                <textarea
                    id="draft-summary"
                    rows={2}
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                />

                <div className="panes-switch" role="group" aria-label="Show">
                    <button
                        type="button"
                        aria-pressed={pane === "source"}
                        onClick={() => setPane("source")}
                    >
                        Source
                    </button>
                    <button
                        type="button"
                        aria-pressed={pane === "preview"}
                        onClick={() => setPane("preview")}
                    >
                        Preview
                    </button>
                </div>
                <div className="panes" data-pane={pane}>
                    <div className="source">
                        <label htmlFor="draft-body">Markdown</label>
                        <textarea
                            id="draft-body"
                            value={body}
                            onChange={(event) => setBody(event.target.value)}
                            spellCheck
                        />
                    </div>
                    <section className="preview" aria-label="Preview">
                        <SpecMarkdown source={body} showDiagramErrors />
                    </section>
                </div>

                <div className="actions">
                    <p role="status">
                        {isDirty ? "Unsaved changes" : "Draft saved"} ·{" "}
                        {publicationStatus(spec)}
                    </p>
                    <button type="submit" disabled={!isDirty || save.isPending}>
                        Save draft
                    </button>
                    <button
                        type="button"
                        className="primary"
                        disabled={
                            isDirty ||
                            !spec.has_unpublished_changes ||
                            publish.isPending
                        }
                        onClick={() => publish.mutate(undefined)}
                    >
                        Publish
                    </button>
                </div>
                {failure && <p role="alert">{failure.message}</p>}
            </form>

            <AccessPanel spec={spec} />
            <ReadersPanel spec={spec} />
            <LifecyclePanel spec={spec} />
            <RevisionsPanel spec={spec} />
        </SpecsShell>
    );
}

function AccessPanel({spec}: {spec: AuthorSpecification}) {
    const {slug} = spec;
    const [policy, setPolicy] = useState(spec.access_policy);
    const [isConfirming, setIsConfirming] = useState(false);
    const [safeTitle, setSafeTitle] = useState(spec.safe_listing_title);
    const [safeSummary, setSafeSummary] = useState(spec.safe_listing_summary);

    const change = useSpecificationChange(slug, (confirmed: boolean) =>
        changeAccessPolicy(slug, policy, confirmed),
    );
    const saveListing = useSpecificationChange(slug, () =>
        saveSpecification(slug, {
            safe_listing_title: safeTitle,
            safe_listing_summary: safeSummary,
        }),
    );
    const widens = DISCLOSURE[policy] > DISCLOSURE[spec.access_policy];
    const current = spec.revisions[0];

    // Shown before a change to public, so the author sees the exact text
    // that is about to be disclosed.
    const disclosed = useQuery({
        queryKey: specKeys.revision(slug, current?.sequence ?? null),
        queryFn: ({signal}) => getRevision(slug, current.sequence, signal),
        enabled: isConfirming && policy === "PUBLIC" && current !== undefined,
        ...querySettings.specs,
    });

    // Confirmation is offered only once what it discloses is on screen.
    const isDisclosureShown =
        policy !== "PUBLIC" || current === undefined || disclosed.isSuccess;

    const failure = change.error ?? saveListing.error;

    return (
        <section className="panel" aria-labelledby="access-heading">
            <h2 id="access-heading">Access</h2>
            <p>
                Current policy: <strong>{POLICY_NAMES[spec.access_policy]}</strong>
            </p>

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    saveListing.mutate(undefined);
                }}
            >
                <p className="hint">
                    The safe listing is what people who cannot read this
                    specification see when it is listed. Write it separately; do
                    not copy the real title or summary.
                </p>
                <label htmlFor="safe-title">Safe listing title</label>
                <input
                    id="safe-title"
                    value={safeTitle}
                    onChange={(event) => setSafeTitle(event.target.value)}
                    maxLength={200}
                />
                <label htmlFor="safe-summary">Safe listing summary</label>
                <textarea
                    id="safe-summary"
                    rows={2}
                    value={safeSummary}
                    onChange={(event) => setSafeSummary(event.target.value)}
                />
                <button type="submit" disabled={saveListing.isPending}>
                    Save safe listing
                </button>
            </form>

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    if (widens) setIsConfirming(true);
                    else change.mutate(false);
                }}
            >
                <label htmlFor="access-policy">Change policy to</label>
                <select
                    id="access-policy"
                    value={policy}
                    onChange={(event) => {
                        setPolicy(event.target.value as AccessPolicy);
                        setIsConfirming(false);
                    }}
                >
                    {POLICIES.map((option) => (
                        <option key={option} value={option}>
                            {POLICY_NAMES[option]}
                        </option>
                    ))}
                </select>
                <button
                    type="submit"
                    disabled={policy === spec.access_policy || change.isPending}
                >
                    Change access
                </button>
            </form>

            {isConfirming && widens && (
                <div className="notice" role="group" aria-label="Confirm wider access">
                    {policy === "RESTRICTED_LISTED" ? (
                        <>
                            <p>
                                Everyone, with or without an account, will see this
                                entry in the library. Only the reader list can open
                                it.
                            </p>
                            <p>
                                <strong>{spec.safe_listing_title}</strong>
                            </p>
                            <p>{spec.safe_listing_summary}</p>
                        </>
                    ) : current === undefined ? (
                        <p>
                            Nothing is published yet. Everyone, with or without an
                            account, will be able to read each revision from the
                            moment you publish it.
                        </p>
                    ) : (
                        <>
                            <p>
                                Everyone, with or without an account, will be able to
                                read the current revision in full:
                            </p>
                            {disclosed.isPending && (
                                <p className="status">Loading the revision…</p>
                            )}
                            {disclosed.isError && (
                                <p role="alert">
                                    The revision could not be loaded, so access
                                    cannot be widened. Try again.
                                </p>
                            )}
                            {disclosed.data && (
                                <>
                                    <p>
                                        <strong>{disclosed.data.title}</strong>
                                    </p>
                                    <p>{disclosed.data.summary}</p>
                                    <SpecMarkdown source={disclosed.data.body} />
                                </>
                            )}
                        </>
                    )}
                    <p>This cannot be undone once someone has seen or copied it.</p>
                    <button
                        type="button"
                        className="primary"
                        disabled={!isDisclosureShown || change.isPending}
                        onClick={() =>
                            change.mutate(true, {
                                onSuccess: () => setIsConfirming(false),
                            })
                        }
                    >
                        Confirm: {POLICY_NAMES[policy]}
                    </button>
                    <button type="button" onClick={() => setIsConfirming(false)}>
                        Cancel
                    </button>
                </div>
            )}
            {failure && <p role="alert">{failure.message}</p>}
        </section>
    );
}

function ReadersPanel({spec}: {spec: AuthorSpecification}) {
    const {slug} = spec;
    const [phoneNumber, setPhoneNumber] = useState("");
    const change = useSpecificationChange(
        slug,
        ({number, onList}: {number: string; onList: boolean}) =>
            changeReader(slug, number, onList),
    );

    return (
        <section className="panel" aria-labelledby="readers-heading">
            <h2 id="readers-heading">Reader list</h2>
            <p className="hint">
                Only these accounts can read a restricted specification. Removal
                takes effect on the person's next request.
            </p>
            {spec.readers.length === 0 && <p>No readers.</p>}
            <ul className="readers">
                {spec.readers.map((number) => (
                    <li key={number}>
                        {number}
                        <button
                            type="button"
                            aria-label={`Remove ${number}`}
                            onClick={() => change.mutate({number, onList: false})}
                        >
                            Remove
                        </button>
                    </li>
                ))}
            </ul>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    change.mutate(
                        {number: phoneNumber, onList: true},
                        {onSuccess: () => setPhoneNumber("")},
                    );
                }}
            >
                <label htmlFor="reader-number">Phone number of the account</label>
                <input
                    id="reader-number"
                    type="tel"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    placeholder="+254…"
                    required
                />
                <button type="submit" disabled={change.isPending}>
                    Add reader
                </button>
            </form>
            {change.isError && <p role="alert">{change.error.message}</p>}
        </section>
    );
}

function LifecyclePanel({spec}: {spec: AuthorSpecification}) {
    const {slug} = spec;
    const others = useQuery({
        queryKey: specKeys.authorLibrary(),
        queryFn: ({signal}) => getAuthorLibrary(signal),
        ...querySettings.specs,
    });
    const change = useSpecificationChange(
        slug,
        (changes: {archived?: boolean; superseded_by?: string | null}) =>
            saveSpecification(slug, changes),
    );

    return (
        <section className="panel" aria-labelledby="lifecycle-heading">
            <h2 id="lifecycle-heading">Lifecycle</h2>
            <label className="check">
                <input
                    type="checkbox"
                    checked={spec.archived}
                    onChange={(event) => change.mutate({archived: event.target.checked})}
                />
                Archived (shown as no longer maintained)
            </label>
            <label htmlFor="superseded-by">Superseded by</label>
            <select
                id="superseded-by"
                value={spec.superseded_by ?? ""}
                onChange={(event) =>
                    change.mutate({superseded_by: event.target.value || null})
                }
            >
                <option value="">Nothing</option>
                {others.data
                    ?.filter((other) => other.slug !== slug)
                    .map((other) => (
                        <option key={other.slug} value={other.slug}>
                            {other.title}
                        </option>
                    ))}
            </select>
            {change.isError && <p role="alert">{change.error.message}</p>}
        </section>
    );
}

function RevisionsPanel({spec}: {spec: AuthorSpecification}) {
    const {slug} = spec;
    const [sequence, setSequence] = useState<number | null>(null);
    const revision = useQuery({
        queryKey: specKeys.revision(slug, sequence),
        queryFn: ({signal}) => getRevision(slug, sequence as number, signal),
        enabled: sequence !== null,
        ...querySettings.specs,
    });

    if (spec.revisions.length === 0) return null;

    return (
        <section className="panel" aria-labelledby="revisions-heading">
            <h2 id="revisions-heading">Published revisions</h2>
            <p className="hint">Readers see only the newest. None can be changed.</p>
            <ul className="readers">
                {spec.revisions.map((entry) => (
                    <li key={entry.sequence}>
                        {entry.sequence}. {entry.title} ·{" "}
                        {REVISION_DATE.format(new Date(entry.published_at))}
                        <button
                            type="button"
                            aria-label={`View revision ${entry.sequence}`}
                            onClick={() => setSequence(entry.sequence)}
                        >
                            View
                        </button>
                    </li>
                ))}
            </ul>
            {revision.data && (
                <section aria-label={`Revision ${revision.data.sequence}`}>
                    <h3>{revision.data.title}</h3>
                    <p>{revision.data.summary}</p>
                    <SpecMarkdown source={revision.data.body} />
                </section>
            )}
        </section>
    );
}
