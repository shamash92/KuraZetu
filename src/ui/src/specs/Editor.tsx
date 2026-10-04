import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {Eye, Pencil, X} from "lucide-react";
import {useEffect, useState} from "react";
import {useBlocker, useParams} from "react-router-dom";
import {toast} from "sonner";

import {specKeys} from "../api/queryKeys";
import {querySettings} from "../api/querySettings";

import {POLICY_NAMES, publicationStatus} from "./NewSpecification";
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
import {NotFound, SpecsShell, indexOf} from "./SpecsShell";

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
                <NotFound />
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
 *  cached copy so each panel shows what the server now holds, and says
 *  `done` so the author knows it went through. */
function useSpecificationChange<Input>(
    slug: string,
    done: string,
    mutationFn: (input: Input) => Promise<AuthorSpecification>,
) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn,
        onSuccess(saved) {
            queryClient.setQueryData(specKeys.authorSpecification(slug), saved);
            toast.success(done);
        },
    });
}

function EditorForm({spec}: {spec: AuthorSpecification}) {
    const {slug} = spec;
    const [title, setTitle] = useState(spec.title);
    const [summary, setSummary] = useState(spec.summary);
    const [body, setBody] = useState(spec.body);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [viewedRevision, setViewedRevision] = useState<number | null>(null);

    const isDirty =
        title !== spec.title || summary !== spec.summary || body !== spec.body;

    const save = useSpecificationChange(slug, "Draft saved", () =>
        saveSpecification(slug, {title, summary, body}),
    );
    const publish = useSpecificationChange(slug, "Published", () =>
        publishSpecification(slug),
    );

    // The server may tidy what it stores (it trims the title and summary), so
    // the form takes the saved text back; otherwise the draft would look
    // unsaved for ever and could not be published.
    function saveDraft() {
        save.mutate(undefined, {
            onSuccess(saved) {
                setTitle(saved.title);
                setSummary(saved.summary);
                setBody(saved.body);
            },
        });
    }

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
            <PropertyBar spec={spec} />
            <div className="workspace">
                <form
                    className="draft"
                    onSubmit={(event) => {
                        event.preventDefault();
                        saveDraft();
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

                    <label htmlFor="draft-body">Markdown</label>
                    <div className="md">
                        <button
                            type="button"
                            className="icon md-toggle"
                            aria-label={isPreviewing ? "Edit" : "Preview"}
                            title={isPreviewing ? "Edit" : "Preview"}
                            onClick={() => setIsPreviewing(!isPreviewing)}
                        >
                            {isPreviewing ? (
                                <Pencil size={16} aria-hidden="true" />
                            ) : (
                                <Eye size={16} aria-hidden="true" />
                            )}
                        </button>
                        {/* Kept mounted so the place in a long document
                            survives a look at the preview. */}
                        <textarea
                            id="draft-body"
                            hidden={isPreviewing}
                            value={body}
                            onChange={(event) => setBody(event.target.value)}
                            spellCheck
                        />
                        {isPreviewing && (
                            <section className="preview" aria-label="Preview">
                                <SpecMarkdown source={body} showDiagramErrors />
                            </section>
                        )}
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

                <aside className="side" aria-label="Settings">
                    <SafeListingPanel spec={spec} />
                    <ReadersPanel spec={spec} />
                    <RevisionsPanel spec={spec} onView={setViewedRevision} />
                </aside>
            </div>

            {viewedRevision !== null && (
                <RevisionView
                    slug={slug}
                    sequence={viewedRevision}
                    onClose={() => setViewedRevision(null)}
                />
            )}
        </SpecsShell>
    );
}

/**
 * The properties an author changes without touching the draft, as one row of
 * small menus above it. Choosing an option applies it, except a change that
 * widens access: that waits for confirmation.
 */
function PropertyBar({spec}: {spec: AuthorSpecification}) {
    const {slug} = spec;
    // A wider policy the author has chosen but not yet confirmed.
    const [widening, setWidening] = useState<AccessPolicy | null>(null);

    const changeAccess = useSpecificationChange(
        slug,
        "Access changed",
        ({policy, confirmed}: {policy: AccessPolicy; confirmed: boolean}) =>
            changeAccessPolicy(slug, policy, confirmed),
    );
    const changeLifecycle = useSpecificationChange(
        slug,
        "Saved",
        (changes: {archived?: boolean; superseded_by?: string | null}) =>
            saveSpecification(slug, changes),
    );
    const others = useQuery({
        queryKey: specKeys.authorLibrary(),
        queryFn: ({signal}) => getAuthorLibrary(signal),
        ...querySettings.specs,
    });
    const current = spec.revisions[0];

    // Shown before a change to public, so the author sees the exact text
    // that is about to be disclosed.
    const disclosed = useQuery({
        queryKey: specKeys.revision(slug, current?.sequence ?? null),
        queryFn: ({signal}) => getRevision(slug, current.sequence, signal),
        enabled: widening === "PUBLIC" && current !== undefined,
        ...querySettings.specs,
    });
    // Confirmation is offered only once what it discloses is on screen.
    const isDisclosureShown =
        widening !== "PUBLIC" || current === undefined || disclosed.isSuccess;

    function chooseAccess(policy: AccessPolicy) {
        if (DISCLOSURE[policy] > DISCLOSURE[spec.access_policy]) {
            setWidening(policy);
        } else {
            setWidening(null);
            changeAccess.mutate({policy, confirmed: false});
        }
    }

    const failure = changeAccess.error ?? changeLifecycle.error;

    return (
        <>
            <div className="props" role="group" aria-label="Properties">
                <span className="meta">{indexOf(slug)}</span>
                <label className="prop">
                    <span>Access</span>
                    <select
                        value={spec.access_policy}
                        disabled={changeAccess.isPending}
                        onChange={(event) =>
                            chooseAccess(event.target.value as AccessPolicy)
                        }
                    >
                        {POLICIES.map((option) => (
                            <option key={option} value={option}>
                                {POLICY_NAMES[option]}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="prop">
                    <span>Status</span>
                    <select
                        value={spec.archived ? "archived" : "active"}
                        onChange={(event) =>
                            changeLifecycle.mutate({
                                archived: event.target.value === "archived",
                            })
                        }
                    >
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                    </select>
                </label>
                <label className="prop">
                    <span>Superseded by</span>
                    <select
                        value={spec.superseded_by ?? ""}
                        onChange={(event) =>
                            changeLifecycle.mutate({
                                superseded_by: event.target.value || null,
                            })
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
                </label>
            </div>

            {widening && (
                <div className="notice" role="group" aria-label="Confirm wider access">
                    {widening === "RESTRICTED_LISTED" ? (
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
                        disabled={!isDisclosureShown || changeAccess.isPending}
                        onClick={() =>
                            changeAccess.mutate(
                                {policy: widening, confirmed: true},
                                {onSuccess: () => setWidening(null)},
                            )
                        }
                    >
                        Confirm: {POLICY_NAMES[widening]}
                    </button>
                    <button type="button" onClick={() => setWidening(null)}>
                        Cancel
                    </button>
                </div>
            )}
            {failure && <p role="alert">{failure.message}</p>}
        </>
    );
}

function SafeListingPanel({spec}: {spec: AuthorSpecification}) {
    const {slug} = spec;
    const [safeTitle, setSafeTitle] = useState(spec.safe_listing_title);
    const [safeSummary, setSafeSummary] = useState(spec.safe_listing_summary);
    const save = useSpecificationChange(slug, "Safe listing saved", () =>
        saveSpecification(slug, {
            safe_listing_title: safeTitle,
            safe_listing_summary: safeSummary,
        }),
    );

    return (
        <section className="panel" aria-labelledby="listing-heading">
            <h2 id="listing-heading">Safe listing</h2>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    save.mutate(undefined);
                }}
            >
                <p className="hint">
                    What people who cannot read this specification see when it is
                    listed. Write it separately; do not copy the real title or
                    summary.
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
                <button type="submit" disabled={save.isPending}>
                    Save safe listing
                </button>
            </form>
            {save.isError && <p role="alert">{save.error.message}</p>}
        </section>
    );
}

function ReadersPanel({spec}: {spec: AuthorSpecification}) {
    const {slug} = spec;
    const [phoneNumber, setPhoneNumber] = useState("");
    const change = useSpecificationChange(
        slug,
        "Reader list changed",
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
                            className="icon"
                            aria-label={`Remove ${number}`}
                            title="Remove"
                            onClick={() => change.mutate({number, onList: false})}
                        >
                            <X size={14} aria-hidden="true" />
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

function RevisionsPanel({
    spec,
    onView,
}: {
    spec: AuthorSpecification;
    onView: (sequence: number) => void;
}) {
    if (spec.revisions.length === 0) return null;

    return (
        <section className="panel" aria-labelledby="revisions-heading">
            <h2 id="revisions-heading">Published revisions</h2>
            <p className="hint">Readers see only the newest. None can be changed.</p>
            <ul className="readers">
                {spec.revisions.map((entry) => (
                    <li key={entry.sequence}>
                        <span>
                            {entry.sequence} ·{" "}
                            {REVISION_DATE.format(new Date(entry.published_at))}
                        </span>
                        <button
                            type="button"
                            aria-label={`View revision ${entry.sequence}`}
                            onClick={() => onView(entry.sequence)}
                        >
                            View
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}

/** An earlier revision, read at full width below the workspace. */
function RevisionView({
    slug,
    sequence,
    onClose,
}: {
    slug: string;
    sequence: number;
    onClose: () => void;
}) {
    const revision = useQuery({
        queryKey: specKeys.revision(slug, sequence),
        queryFn: ({signal}) => getRevision(slug, sequence, signal),
        ...querySettings.specs,
    });

    if (!revision.data) return null;

    return (
        <section className="revision" aria-label={`Revision ${sequence}`}>
            <button type="button" onClick={onClose}>
                Close revision {sequence}
            </button>
            <h2>{revision.data.title}</h2>
            <p>{revision.data.summary}</p>
            <SpecMarkdown source={revision.data.body} />
        </section>
    );
}
