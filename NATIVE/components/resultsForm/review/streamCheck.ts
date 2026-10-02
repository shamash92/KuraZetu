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
import {RESULTS_FORMS} from "../resultsForms.ts";

export type StreamCheck =
    | {kind: "match"; stream: number}
    | {kind: "otherStream"; stream: number; selectedStream: number}
    | {kind: "otherStation"; stationCode: string}
    | {kind: "otherForm"; captured: string | null; stream: number; expected: string}
    | {kind: "unread"};

const FORM_QR = /^(\d{15})(\d{2})$/;

const CENTRE_CODE_LENGTH = 13;

function streamOf(stationCode: string) {
    return Number(stationCode.slice(-2));
}

/** "Form 35A (MP)" for a known series, or null for one we do not recognise. */
function formName(series: string) {
    const form = Object.values(RESULTS_FORMS).find(
        (entry) => entry.series === series,
    );
    return form ? `${form.name} (${form.race})` : null;
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
    const expected = RESULTS_FORMS[level];
    if (series !== expected.series) {
        return {
            kind: "otherForm",
            captured: formName(series),
            stream: streamOf(stationCode),
            expected: `${expected.name} (${expected.race})`,
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
