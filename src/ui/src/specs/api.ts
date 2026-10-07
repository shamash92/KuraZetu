import {SPECS_LIBRARY_URL, specificationPageUrl} from "../api/apiUrls";

export type Stage = "BRAINDUMP" | "DRAFT" | "ACCEPTED" | "LIVE";

/** Specifications that describe related work. */
export type DocumentSet = {
    slug: string;
    title: string;
    summary: string;
    /** False when the members can be read in any order. */
    ordered: boolean;
};

/** A specification as the library lists it. `locked` entries carry only the
 *  safe listing metadata; the server never sends more. */
export type LibraryEntry = {
    slug: string;
    title: string;
    summary: string;
    access: "full" | "locked";
    archived: boolean;
    /** Null for a locked entry: the date is part of what it conceals. */
    published_at: string | null;
    /** Null for a locked entry. */
    stage: Stage | null;
    document_set: DocumentSet | null;
};

export type SpecificationPage = LibraryEntry & {
    body?: string;
    superseded_by?: LibraryEntry | null;
};

export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(url, {
        method: "GET",
        credentials: "same-origin",
        headers: {Accept: "application/json"},
        signal,
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw Object.assign(new Error("Could not load specifications"), {
            status: response.status,
        });
    }

    return data;
}

export function getLibrary(signal?: AbortSignal) {
    return getJson<Array<LibraryEntry>>(SPECS_LIBRARY_URL, signal);
}

export function getSpecificationPage(slug: string, signal?: AbortSignal) {
    return getJson<SpecificationPage>(specificationPageUrl(slug), signal);
}
