import {useQuery} from "@tanstack/react-query";
import {Lock} from "lucide-react";
import {Link} from "react-router-dom";

import {specKeys} from "../api/queryKeys";
import {querySettings} from "../api/querySettings";

import {useAuth} from "../App";

import {getLibrary} from "./api";
import {getAuthorLibrary} from "./authorApi";
import type {LibraryEntry} from "./api";
import {
    AuthorLinks,
    RESTRICTED_NOTICE,
    SpecsShell,
    Status,
    formatDate,
    indexOf,
} from "./SpecsShell";

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
                {library.data?.map((entry) => (
                    <Cover key={entry.slug} entry={entry} />
                ))}
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
