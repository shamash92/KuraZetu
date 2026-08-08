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
} as const;
