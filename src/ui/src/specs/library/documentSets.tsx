import {Lock} from "lucide-react";
import {Link} from "react-router-dom";

import type {DocumentSet, LibraryEntry} from "../shared/api";

/**
 * How document sets are shown to a reader. Everything here works from the
 * entries the library sent, so a set never shows more than the library does:
 * a member a person cannot discover is not counted, numbered or named.
 */

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

/** How many members a set's cover names before it says how many are left. */
const COVER_MEMBERS = 5;

type Shelved = LibraryEntry | {set: DocumentSet; members: Array<LibraryEntry>};

/**
 * The library in the order it is shown: each document set stands where its
 * first member would. A set with one member a person can discover is shown
 * as that specification alone.
 */
export function shelve(entries: ReadonlyArray<LibraryEntry>): Array<Shelved> {
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

/** A document set as a stack of paper that names what is in it. */
export function SetCover({set, members}: {set: DocumentSet; members: Array<LibraryEntry>}) {
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
