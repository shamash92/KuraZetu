import type {Stage} from "./api";
import type {AccessPolicy, AuthorEntry} from "./authorApi";

/** How a specification's standing is worded and marked, wherever it shows. */

export const RESTRICTED_NOTICE =
    "Restricted. This specification is available only to named accounts.";

export const POLICY_NAMES: Record<AccessPolicy, string> = {
    PUBLIC: "Public",
    RESTRICTED_LISTED: "Restricted, listed",
    RESTRICTED_CONCEALED: "Restricted, concealed",
};

export const STAGE_NAMES: Record<Stage, string> = {
    BRAINDUMP: "Braindump",
    DRAFT: "Draft",
    ACCEPTED: "Accepted",
    LIVE: "Live",
};

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

export function publicationStatus(spec: AuthorEntry): string {
    if (!spec.published) return "Not published";
    return spec.has_unpublished_changes
        ? "Published, with unpublished changes in the draft"
        : "Published";
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

/** How far the work a specification describes has come. */
export function StageMark({stage}: {stage: Stage}) {
    return (
        <span className="st" data-stage={stage.toLowerCase()}>
            <span className="glyph" aria-hidden="true" />
            {STAGE_NAMES[stage]}
        </span>
    );
}
