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

    /**
     * The national presidential tally. This is the default destination for
     * every visitor at once, so it is the one resource where a client-side
     * refresh rule is a capacity decision rather than a UX one: a quarter of a
     * million clients on a fixed interval is thousands of origin requests per
     * second before anyone has polled deliberately.
     *
     * Until the load-test gate in the migration plan passes, the read is
     * one-shot. `retry: false` overrides the client's global single retry for
     * the same reason — a national outage must not be met with every client
     * asking again.
     */
    national: {
        staleTime: Infinity,
        refetchInterval: false,
        refetchOnWindowFocus: false,
        retry: false,
    },

    /**
     * A random draw, which is the one kind of response caching cannot help
     * with: its whole value is being different each time, so a cache hit would
     * hand the volunteer a centre they have just dealt with. Nothing is kept
     * between rounds, and the next round is an explicit refetch.
     *
     * `retry: false` overrides the client's global single retry. The endpoint
     * behind this sorts the whole polling-centre table randomly on every call
     * (#122), so a failed request is the worst possible one to repeat.
     */
    gameRound: {
        staleTime: 0,
        gcTime: 0,
        refetchInterval: false,
        refetchOnWindowFocus: false,
        retry: false,
    },
} as const;
