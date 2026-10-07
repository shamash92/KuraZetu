import cookie from "react-cookies";

import {
    SPECS_AUTHOR_SETS_URL,
    SPECS_AUTHOR_URL,
    authorSpecificationUrl,
    documentSetOrderUrl,
    specificationAccessPolicyUrl,
    specificationPublishUrl,
    specificationReadersUrl,
    specificationRevisionUrl,
} from "../api/apiUrls";

import {getJson} from "./api";
import type {DocumentSet, Stage} from "./api";

export type AccessPolicy = "PUBLIC" | "RESTRICTED_LISTED" | "RESTRICTED_CONCEALED";

export type AuthorEntry = {
    slug: string;
    title: string;
    access_policy: AccessPolicy;
    published: boolean;
    has_unpublished_changes: boolean;
    archived: boolean;
};

export type RevisionSummary = {
    sequence: number;
    title: string;
    published_at: string;
};

export type Revision = RevisionSummary & {summary: string; body: string};

export type AuthorSpecification = AuthorEntry & {
    summary: string;
    body: string;
    safe_listing_title: string;
    safe_listing_summary: string;
    superseded_by: string | null;
    /** The slug of its document set. */
    document_set: string | null;
    stage: Stage;
    readers: Array<string>;
    revisions: Array<RevisionSummary>;
};

/** What the author may change with a save. The access policy and the reader
 *  list are not here: each has its own action. */
export type SpecificationChanges = Partial<
    Pick<
        AuthorSpecification,
        | "title"
        | "summary"
        | "body"
        | "safe_listing_title"
        | "safe_listing_summary"
        | "archived"
        | "superseded_by"
        | "document_set"
        | "stage"
    >
>;

/** DRF answers a refused write with `{field: [message]}`, `{error}` or
 *  `{detail}`. The first message is the one the author can act on. */
function messageFrom(data: unknown): string {
    if (typeof data === "object" && data !== null) {
        for (const value of Object.values(data)) {
            if (typeof value === "string") return value;
            if (Array.isArray(value) && typeof value[0] === "string") return value[0];
        }
    }
    return "The change could not be saved. Try again.";
}

async function send<T>(
    method: "POST" | "PATCH" | "DELETE",
    url: string,
    body: Record<string, unknown> = {},
): Promise<T> {
    const response = await fetch(url, {
        method,
        credentials: "same-origin",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-CSRFToken": cookie.load("csrftoken"),
        },
        body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw Object.assign(new Error(messageFrom(data)), {status: response.status});
    }

    return data;
}

export function getAuthorLibrary(signal?: AbortSignal) {
    return getJson<Array<AuthorEntry>>(SPECS_AUTHOR_URL, signal);
}

export function getAuthorSpecification(slug: string, signal?: AbortSignal) {
    return getJson<AuthorSpecification>(authorSpecificationUrl(slug), signal);
}

export function getRevision(slug: string, sequence: number, signal?: AbortSignal) {
    return getJson<Revision>(specificationRevisionUrl(slug, sequence), signal);
}

export function getDocumentSets(signal?: AbortSignal) {
    return getJson<Array<DocumentSet>>(SPECS_AUTHOR_SETS_URL, signal);
}

export function createDocumentSet(documentSet: Omit<DocumentSet, "slug">) {
    return send<DocumentSet>("POST", SPECS_AUTHOR_SETS_URL, documentSet);
}

/** Puts the named members of a set in the order given. */
export function rearrangeDocumentSet(slug: string, specifications: Array<string>) {
    return send<null>("POST", documentSetOrderUrl(slug), {specifications});
}

export function createSpecification(title: string) {
    return send<AuthorEntry>("POST", SPECS_AUTHOR_URL, {title});
}

export function saveSpecification(slug: string, changes: SpecificationChanges) {
    return send<AuthorSpecification>("PATCH", authorSpecificationUrl(slug), changes);
}

export function publishSpecification(slug: string) {
    return send<AuthorSpecification>("POST", specificationPublishUrl(slug));
}

export function changeAccessPolicy(
    slug: string,
    accessPolicy: AccessPolicy,
    confirmWidening: boolean,
) {
    return send<AuthorSpecification>("POST", specificationAccessPolicyUrl(slug), {
        access_policy: accessPolicy,
        confirm_widening: confirmWidening,
    });
}

export function changeReader(slug: string, phoneNumber: string, onList: boolean) {
    return send<AuthorSpecification>(
        onList ? "POST" : "DELETE",
        specificationReadersUrl(slug),
        {phone_number: phoneNumber},
    );
}
