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
};
