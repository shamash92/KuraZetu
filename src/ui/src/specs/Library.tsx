import {useQuery} from "@tanstack/react-query";
import {Lock} from "lucide-react";
import {Link} from "react-router-dom";

import {specKeys} from "../api/queryKeys";
import {querySettings} from "../api/querySettings";

import {useAuth} from "../App";

import {getLibrary} from "./api";
import {getAuthorLibrary} from "./authorApi";
import type {DocumentSet, LibraryEntry} from "./api";
import {
    AuthorLinks,
    RESTRICTED_NOTICE,
    SpecsShell,
    StageMark,
    Status,
    documentSetPath,
    formatDate,
    indexOf,
    ordinal,
} from "./SpecsShell";

/** How many members a set's cover names before it says how many are left. */
const COVER_MEMBERS = 5;

type Shelved = LibraryEntry | {set: DocumentSet; members: Array<LibraryEntry>};

/**
 * The library in the order it is shown: each document set stands where its
 * first member would. A set with one member a person can discover is shown
 * as that specification alone.
 */
function shelve(entries: ReadonlyArray<LibraryEntry>): Array<Shelved> {
    const sets = new Map<string, Array<LibraryEntry>>();
    for (const entry of entries) {
        if (!entry.document_set) continue;
        const members = sets.get(entry.document_set.slug) ?? [];
        sets.set(entry.document_set.slug, [...members, entry]);
    }

    const shelf: Array<Shelved> = [];
    for (const entry of entries) {
        const members = entry.document_set && sets.get(entry.document_set.slug);
        if (!entry.document_set || !members || members.length < 2) {
            shelf.push(entry);
        } else if (members[0] === entry) {
            shelf.push({set: entry.document_set, members});
        }
    }
    return shelf;
}

/** One specification as a sheet of paper, with its standing underneath. */
function Cover({entry}: {entry: LibraryEntry}) {
    const isLocked = entry.access === "locked";

    return (
        <li>
            <Link className="doc" to={`/ui/specs/${entry.slug}/`}>
                <div className={isLocked ? "sheet sheet--locked" : "sheet"}>
                    <div className="sheet-top">
                        <span>{indexOf(entry.slug)}</span>
                    </div>
                    {isLocked && (
                        <Lock
                            className="lockmark"
                            size={40}
                            strokeWidth={1.4}
                            aria-hidden="true"
                        />
                    )}
                    <h2>{entry.title}</h2>
                    {entry.summary && <p>{entry.summary}</p>}
                    {entry.published_at && (
                        <div className="sheet-foot">
                            <span>Published</span>
                            <span className="d">{formatDate(entry.published_at)}</span>
                        </div>
                    )}
                </div>
                <div className="doc-meta">
                    {entry.stage && <StageMark stage={entry.stage} />}
                    <Status archived={entry.archived} />
                    {isLocked && (
                        <>
                            <span className="acc">
                                <Lock size={14} aria-hidden="true" />
                                Locked
                            </span>
                            <span className="req">{RESTRICTED_NOTICE}</span>
                        </>
                    )}
                </div>
            </Link>
        </li>
    );
}

/** A document set as a stack of paper that names what is in it. */
function SetCover({set, members}: {set: DocumentSet; members: Array<LibraryEntry>}) {
    const named = members.slice(0, COVER_MEMBERS);
    const left = members.length - named.length;

    return (
        <li>
            <Link className="doc" to={documentSetPath(set.slug)}>
                <div className="sheet sheet--set">
                    <div className="sheet-top">
                        <span>Document set</span>
                        <span>{members.length}</span>
                    </div>
                    <h2>{set.title}</h2>
                    <ol className="members">
                        {named.map((member, index) => (
                            <li key={member.slug}>
                                {set.ordered && (
                                    <span className="n">{ordinal(index)}</span>
                                )}
                                <span>
                                    {member.access === "locked" && (
                                        <Lock size={12} aria-label="Locked" />
                                    )}
                                    {member.title}
                                </span>
                            </li>
                        ))}
                    </ol>
                    {left > 0 && <p className="more">and {left} more</p>}
                </div>
                <div className="doc-meta">
                    <strong>{members.length} related specifications</strong>
                    <span>{set.ordered ? "Reading order" : "Read in any order"}</span>
                </div>
            </Link>
        </li>
    );
}

/**
 * An author's unpublished drafts. Nothing else lists them: the library shows
 * only what is published, and a published specification is edited from its
 * own page.
 */
function Drafts() {
    const isSignedIn = useAuth();
    const authoring = useQuery({
        queryKey: specKeys.authorLibrary(),
        queryFn: ({signal}) => getAuthorLibrary(signal),
        enabled: isSignedIn,
        retry: false,
        ...querySettings.specs,
    });
    const drafts = authoring.data?.filter((spec) => !spec.published) ?? [];

    if (drafts.length === 0) return null;

    return (
        <section className="drafts" aria-labelledby="drafts-heading">
            <h2 id="drafts-heading">Unpublished drafts</h2>
            <ul className="rows">
                {drafts.map((draft) => (
                    <li key={draft.slug}>
                        <Link to={`/ui/specs/author/${draft.slug}/`}>{draft.title}</Link>
                        <span className="meta">{indexOf(draft.slug)}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}

export function Library() {
    const library = useQuery({
        queryKey: specKeys.library(),
        queryFn: ({signal}) => getLibrary(signal),
        ...querySettings.specs,
    });

    return (
        <SpecsShell wide>
            <header className="lib-head">
                <div className="lib-title">
                    <h1>Specifications</h1>
                    <AuthorLinks />
                </div>
                <p className="lede">How Kura Zetu is designed to work, and why.</p>
            </header>

            {library.isPending && <p className="status">Loading specifications…</p>}
            {library.isError && (
                <p className="status" role="alert">
                    The specifications could not be loaded. Reload the page to try
                    again.
                </p>
            )}
            {library.data?.length === 0 && (
                <p className="status">No specifications are published yet.</p>
            )}

            <ul className="grid">
                {shelve(library.data ?? []).map((item) =>
                    "set" in item ? (
                        <SetCover key={item.set.slug} {...item} />
                    ) : (
                        <Cover key={item.slug} entry={item} />
                    ),
                )}
            </ul>

            <Drafts />

            <p className="never">
                Credentials, production data, contributor identities, contact
                details, recovery codes and unpatched vulnerabilities are never
                stored here.
            </p>
        </SpecsShell>
    );
}
