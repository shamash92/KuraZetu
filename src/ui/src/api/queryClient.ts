import {QueryClient} from "@tanstack/react-query";

/**
 * Errors thrown by a `queryFn` carry the response status so retry logic can
 * tell a server fault from a client one.
 */
function statusOf(error: unknown): number | undefined {
    if (typeof error === "object" && error !== null && "status" in error) {
        const {status} = error as {status: unknown};
        return typeof status === "number" ? status : undefined;
    }
    return undefined;
}

function shouldRetryRead(failureCount: number, error: unknown): boolean {
    // One retry, never more: a national audience retrying in unison is the
    // failure mode this whole design is built to avoid.
    if (failureCount >= 1) return false;

    // The query was cancelled — the caller moved on, so there is nothing to
    // retry.
    if (error instanceof Error && error.name === "AbortError") return false;

    const status = statusOf(error);

    // A 4xx will fail identically on the second attempt. That includes 429:
    // retrying a rate limit is what turns one into an outage.
    if (status !== undefined && status >= 400 && status < 500) return false;

    return true;
}

/**
 * One client for the application, created outside any render path so it is
 * never rebuilt and the cache never silently resets.
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: shouldRetryRead,
            // Randomised so clients that failed together do not retry together.
            retryDelay: () => 1000 + Math.random() * 2000,
        },
        mutations: {
            // A retried write can double-submit. Enable this per endpoint only
            // once that endpoint has a tested idempotency contract.
            retry: false,
        },
    },
});
