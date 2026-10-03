import {SPECS_LIBRARY_URL, specificationPageUrl} from "../api/apiUrls";

/** A specification as the library lists it. `locked` entries carry only the
 *  safe listing metadata; the server never sends more. */
export type LibraryEntry = {
    slug: string;
    title: string;
    summary: string;
    access: "full" | "locked";
    archived: boolean;
};

export type SpecificationPage = LibraryEntry & {
    body?: string;
    published_at?: string;
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
