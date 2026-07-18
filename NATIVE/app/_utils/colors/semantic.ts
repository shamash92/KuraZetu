// Semantic color mappings derived from the numbered palettes.

import {DEMOCRATIC, NEUTRAL, REPUBLICAN, SUCCESS, WARNING} from "./palettes";

// Party colors
export const PARTY_COLORS = {
    democratic: DEMOCRATIC[500],
    republican: REPUBLICAN[500],
    independent: "#A78BFA",
    libertarian: "#FBBF24",
    green: "#34D399",
    other: NEUTRAL[400],
};

// Status colors
export const STATUS_COLORS = {
    live: SUCCESS[500],
    upcoming: WARNING[500],
    completed: NEUTRAL[500],
};

export default function SemanticColorsRoute() {
    return null;
}
