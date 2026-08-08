// Timing policies, centralised so cadence is decided in one place, and spread
// into each `useQuery` so the consuming component still shows which policy it
// picked.
//
// `Infinity` means the lifetime of the in-memory QueryClient — not persistence
// across a page reload. Nothing here is written to disk.

export const querySettings = {
    /**
     * Administrative boundaries. These change between elections, not between
     * page views, so they are fetched once per session and never refetched.
     */
    boundaries: {
        staleTime: Infinity,
        gcTime: Infinity,
        refetchInterval: false,
    },

    /**
     * Election results. Deliberately not polled: the migration plan gates live
     * refresh behind a measured performance run, and refetching on window focus
     * would let every open tab stampede the origin the moment people look back
     * at it. Until that gate passes, results refresh when the component asks.
     */
    results: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    },
} as const;
