import {useQuery} from "@tanstack/react-query";
import {Lock} from "lucide-react";
import {Link} from "react-router-dom";

import {specKeys} from "../../api/queryKeys";
import {querySettings} from "../../api/querySettings";

import {getLibrary} from "../shared/api";
import type {LibraryEntry} from "../shared/api";
import {AuthorLinks, SpecsShell} from "../shared/SpecsShell";
import {
    RESTRICTED_NOTICE,
    StageMark,
    Status,
    formatDate,
    indexOf,
} from "../shared/standing";
import {useAuthor} from "../shared/useAuthor";

import {SetCover, shelve} from "./documentSets";

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

/**
 * An author's unpublished drafts. Nothing else lists them: the library shows
 * only what is published, and a published specification is edited from its
 * own page.
 */
function Drafts() {
    const drafts = useAuthor().library.filter((spec) => !spec.published);

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
