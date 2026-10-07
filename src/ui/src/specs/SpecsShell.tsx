import {useQuery} from "@tanstack/react-query";
import {ArrowLeft} from "lucide-react";
import type {ReactNode} from "react";
import {Link, useLocation} from "react-router-dom";

import {specKeys} from "../api/queryKeys";
import {querySettings} from "../api/querySettings";
import {useAuth} from "../App";
import {LandingNav} from "../landing-pages";
import "../landing-pages/landing.css";

import type {LibraryEntry, Stage} from "./api";
import {getAuthorLibrary} from "./authorApi";
import "./specs.css";

export const RESTRICTED_NOTICE =
    "Restricted. This specification is available only to named accounts.";

const DATE = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
});

export function formatDate(value: string): string {
    return DATE.format(new Date(value));
}

/** The address as the index printed on a specification: `KZ-7F3K9Q`. */
export function indexOf(slug: string): string {
    return slug.toUpperCase();
}

/**
 * Says a specification is no longer the one to follow. There is nothing to
 * say otherwise: being published does not mean what it describes is built.
 */
export function Status({archived, superseded = false}: {
    archived: boolean;
    superseded?: boolean;
}) {
    if (!archived && !superseded) return null;

    const status = superseded ? "Superseded" : "Archived";
    return (
        <span className="st" data-status={status.toLowerCase()}>
            <span className="glyph" aria-hidden="true" />
            {status}
        </span>
    );
}

export const STAGE_NAMES: Record<Stage, string> = {
    BRAINDUMP: "Braindump",
    DRAFT: "Draft",
    ACCEPTED: "Accepted",
    LIVE: "Live",
};

/** How far the work a specification describes has come. */
export function StageMark({stage}: {stage: Stage}) {
    return (
        <span className="st" data-stage={stage.toLowerCase()}>
            <span className="glyph" aria-hidden="true" />
            {STAGE_NAMES[stage]}
        </span>
    );
}

export function documentSetPath(slug: string): string {
    return `/ui/specs/sets/${slug}/`;
}

/** Two digits, as a reading order is printed: `01`. */
export function ordinal(index: number): string {
    return String(index + 1).padStart(2, "0");
}

export function membersOf(
    entries: ReadonlyArray<LibraryEntry>,
    setSlug: string,
): Array<LibraryEntry> {
    return entries.filter((entry) => entry.document_set?.slug === setSlug);
}

/**
 * The author's way in: shown only to an account that can write.
 *
 * The author routes answer "not found" to everyone but an author, so a
 * successful read is what shows the way in. Visitors are never asked.
 */
export function AuthorLinks({editSlug}: {editSlug?: string}) {
    const isSignedIn = useAuth();
    const authoring = useQuery({
        queryKey: specKeys.authorLibrary(),
        queryFn: ({signal}) => getAuthorLibrary(signal),
        enabled: isSignedIn,
        retry: false,
        ...querySettings.specs,
    });

    // The page for writing a new one does not need a button that leads to it.
    const isWriting = useLocation().pathname === "/ui/specs/author/";

    if (!authoring.isSuccess) return null;

    return (
        <span className="author-links">
            {editSlug && (
                <Link className="kz-button" to={`/ui/specs/author/${editSlug}/`}>
                    Edit this specification
                </Link>
            )}
            {!isWriting && (
                <Link className="kz-button kz-button-ink" to="/ui/specs/author/">
                    Write
                </Link>
            )}
        </span>
    );
}

export function SpecsShell({
    children,
    wide = false,
    editSlug,
}: {
    children: ReactNode;
    /** The editor needs room for source and preview side by side. */
    wide?: boolean;
    /** The specification on screen, which an author can go and edit. */
    editSlug?: string;
}) {
    // The library puts the author's links beside its own heading.
    const isLibrary = useLocation().pathname === "/ui/specs/";

    return (
        <>
            <LandingNav current="specs" />
            <div className="kz-specs">
                <main className={wide ? "wide" : undefined}>
                    {!isLibrary && (
                        <div className="crumbs">
                            <Link className="kz-button" to="/ui/specs/">
                                <ArrowLeft size={14} aria-hidden="true" />
                                Back to specs
                            </Link>
                            <AuthorLinks editSlug={editSlug} />
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </>
    );
}

export function NotFound() {
    return (
        <div className="empty">
            <p className="eyebrow">404</p>
            <h1>This page doesn’t exist.</h1>
            <p>Check the address, or browse the library.</p>
            <Link className="kz-button" to="/ui/specs/">
                All specifications
            </Link>
        </div>
    );
}
