/**
 * Comparing the QR printed on a polling-station results form with the stream
 * and race the citizen selected.
 *
 * The QR holds the station's 15-digit code followed by the form series. The
 * first 13 digits name the polling centre (county, constituency, ward and
 * centre) and the last two the stream, so forms from neighbouring streams at
 * one centre differ only at the end.
 */

import type {TLevelTabs} from "@/app/types";

/**
 * Each race's polling-station form: 34A for President up to 39A for Woman
 * Rep. Only 34A has been confirmed to end its QR in its series; the others
 * are assumed to follow the same pattern.
 */
const FORMS: Record<TLevelTabs, {series: string; race: string}> = {
    president: {series: "34", race: "President"},
    mp: {series: "35", race: "MP"},
    mca: {series: "36", race: "MCA"},
    governor: {series: "37", race: "Governor"},
    senator: {series: "38", race: "Senator"},
    womanRep: {series: "39", race: "Woman Rep"},
};

export type StreamCheck =
    | {kind: "match"; stream: number}
    | {kind: "otherStream"; stream: number; selectedStream: number}
    | {kind: "otherStation"; stationCode: string}
    | {kind: "otherForm"; captured: string | null; expected: string}
    | {kind: "unread"};

const FORM_QR = /^(\d{15})(\d{2})$/;

const CENTRE_CODE_LENGTH = 13;

function streamOf(stationCode: string) {
    return Number(stationCode.slice(-2));
}

/** "Form 35A (MP)" for a known series, or null for one we do not recognise. */
function formName(series: string) {
    const form = Object.values(FORMS).find((entry) => entry.series === series);
    return form ? `Form ${form.series}A (${form.race})` : null;
}

/**
 * Classify a QR payload against the selected station and race. Anything that
 * is not a 17-digit form code counts as unread, never as a mismatch.
 */
export function checkStream(
    qr: string | null,
    selectedCode: string,
    level: TLevelTabs,
): StreamCheck {
    const parts = qr?.trim().match(FORM_QR);
    if (!parts) return {kind: "unread"};

    const [, stationCode, series] = parts;
    const expected = FORMS[level];
    if (series !== expected.series) {
        return {
            kind: "otherForm",
            captured: formName(series),
            expected: `Form ${expected.series}A (${expected.race})`,
        };
    }
    if (stationCode === selectedCode) {
        return {kind: "match", stream: streamOf(stationCode)};
    }
    if (
        stationCode.slice(0, CENTRE_CODE_LENGTH) ===
        selectedCode.slice(0, CENTRE_CODE_LENGTH)
    ) {
        return {
            kind: "otherStream",
            stream: streamOf(stationCode),
            selectedStream: streamOf(selectedCode),
        };
    }
    return {kind: "otherStation", stationCode};
}
