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
