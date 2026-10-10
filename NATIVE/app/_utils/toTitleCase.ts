// Sponsors and bodies that prefix school and hall names in the register. They
// stay in capitals when the rest of a name is set in title case.
const NAME_ACRONYMS = new Set([
    "ABC", "ACC", "ACK", "AGC", "AIC", "AIPCA", "AP", "CCM", "CDF", "DEB", "ECD",
    "ECDE", "ELCK", "FPFK", "GK", "KAG", "KMTC", "KWS", "MCK", "NYS", "PAG",
    "PCEA", "PEFA", "RC", "SA", "SDA", "TTC",
]);

// Names arrive in capitals from the register. Set as running text they read as
// a place, not a label.
export const toTitleCase = (text: string) =>
    text
        .split(/(\s+|[-/()])/)
        .map((word) =>
            NAME_ACRONYMS.has(word.replace(/\./g, "").toUpperCase())
                ? word.toUpperCase()
                : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join("");
