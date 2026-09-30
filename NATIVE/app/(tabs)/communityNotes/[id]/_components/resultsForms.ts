/**
 * The polling-station results form for each level: 34A for President up to
 * 39A for Woman Rep. Only 34A has been confirmed to end its QR in its series;
 * the others are assumed to follow the same pattern.
 */

import type {TLevelTabs} from "@/app/types";

export interface ResultsForm {
    /** The two digits the form's QR ends in, e.g. "37". */
    series: string;
    /** What the form is called on paper, e.g. "Form 37A". */
    name: string;
    race: string;
}

function form(series: string, race: string): ResultsForm {
    return {series, name: `Form ${series}A`, race};
}

export const RESULTS_FORMS: Record<TLevelTabs, ResultsForm> = {
    president: form("34", "President"),
    mp: form("35", "MP"),
    mca: form("36", "MCA"),
    governor: form("37", "Governor"),
    senator: form("38", "Senator"),
    womanRep: form("39", "Woman Rep"),
};
