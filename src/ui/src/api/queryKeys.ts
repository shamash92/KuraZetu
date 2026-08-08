// Query keys for the web client.
//
// Every key is an array, hierarchical so a parent can invalidate its children,
// and contains every variable that changes the response. Keys never carry
// tokens, phone numbers, form contents, or anything else private — they are
// held in memory and shown in devtools.

export const boundaryKeys = {
    all: ["boundaries"] as const,

    counties() {
        return [...boundaryKeys.all, "counties"] as const;
    },

    constituencies(countyNumber: number) {
        return [...boundaryKeys.all, "constituencies", countyNumber] as const;
    },

    /**
     * Wards in a constituency. The polling-centre step reuses this exact key to
     * read one ward's geometry, so it is served from cache rather than
     * fetched again.
     */
    wards(constituencyNumber: number) {
        return [...boundaryKeys.all, "wards", constituencyNumber] as const;
    },

    pollingCenters(wardNumber: number) {
        return [...boundaryKeys.all, "polling-centers", wardNumber] as const;
    },
};

export const resultKeys = {
    all: ["results"] as const,

    /**
     * The national presidential tally. Nothing varies it: the endpoint takes no
     * parameters and derives nothing from the session, so every client asks for
     * the same resource.
     */
    national() {
        return [...resultKeys.all, "national", "president"] as const;
    },

    /**
     * One race in the signed-in user's county. The level is part of the key, so
     * each tab caches separately and revisiting one is served from memory. The
     * county is too: the API derives it from the session, so without it a
     * second account would read the first one's totals out of the cache.
     */
    county(countyNumber: number | null, level: string) {
        return [...resultKeys.all, "county", countyNumber, level] as const;
    },

    /**
     * One race in one polling centre. Centre codes are only unique within a
     * ward, so the ward belongs in the key too — the URL carries both for the
     * same reason.
     */
    pollingCenter(
        wardNumber: number | null,
        pollingCenterCode: string | null,
        level: string,
    ) {
        return [
            ...resultKeys.all,
            "polling-center",
            wardNumber,
            pollingCenterCode,
            level,
        ] as const;
    },
};
