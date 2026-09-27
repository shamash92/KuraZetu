/**
 * Comparing the QR printed on Form 34A with the stream the citizen selected.
 *
 * The QR holds the station's 15-digit code followed by the form series, `34`
 * for presidential Form 34A. The first 13 digits name the polling centre
 * (county, constituency, ward and centre) and the last two the stream, so
 * forms from neighbouring streams at one centre differ only at the end.
 */

export type StreamCheck =
    | {kind: "match"; stream: number}
    | {kind: "otherStream"; stream: number; selectedStream: number}
    | {kind: "otherStation"; stationCode: string}
    | {kind: "unread"};

const FORM_QR = /^(\d{15})(\d{2})$/;

const CENTRE_CODE_LENGTH = 13;

function streamOf(stationCode: string) {
    return Number(stationCode.slice(-2));
}

/**
 * Classify a QR payload against the selected station code. Anything that is
 * not a 17-digit form code counts as unread, never as a mismatch.
 */
export function checkStream(qr: string | null, selectedCode: string): StreamCheck {
    const parts = qr?.trim().match(FORM_QR);
    if (!parts) return {kind: "unread"};

    const [, stationCode] = parts;
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
