const assert = require("node:assert/strict");
const test = require("node:test");

const {checkStream} = require("../../app/(tabs)/communityNotes/[id]/_components/streamCheck.ts");

// Kagera Primary School, Gatundu South: two streams at one centre.
const KAGERA_STREAM_1 = "022111055100301";
const KAGERA_STREAM_2 = "022111055100302";

test("a form from the selected stream matches it", () => {
    assert.deepEqual(checkStream(`${KAGERA_STREAM_1}34`, KAGERA_STREAM_1, "president"), {
        kind: "match",
        stream: 1,
    });
});

test("a neighbouring stream's form at the same centre names that stream", () => {
    assert.deepEqual(checkStream(`${KAGERA_STREAM_2}34`, KAGERA_STREAM_1, "president"), {
        kind: "otherStream",
        stream: 2,
        selectedStream: 1,
    });
});

test("a form from another centre is a different station", () => {
    // Kaptimbor Primary School, Baringo.
    assert.deepEqual(checkStream("03015907930070134", KAGERA_STREAM_1, "president"), {
        kind: "otherStation",
        stationCode: "030159079300701",
    });
});

test("each race expects its own form series", () => {
    assert.deepEqual(checkStream(`${KAGERA_STREAM_1}37`, KAGERA_STREAM_1, "governor"), {
        kind: "match",
        stream: 1,
    });
    assert.deepEqual(checkStream(`${KAGERA_STREAM_1}35`, KAGERA_STREAM_1, "president"), {
        kind: "otherForm",
        captured: "Form 35A (MP)",
        expected: "Form 34A (President)",
    });
    assert.deepEqual(checkStream(`${KAGERA_STREAM_1}34`, KAGERA_STREAM_1, "mca"), {
        kind: "otherForm",
        captured: "Form 34A (President)",
        expected: "Form 36A (MCA)",
    });
    assert.deepEqual(checkStream(`${KAGERA_STREAM_1}99`, KAGERA_STREAM_1, "president"), {
        kind: "otherForm",
        captured: null,
        expected: "Form 34A (President)",
    });
});

test("no QR or an unrecognised one counts as unread, never a mismatch", () => {
    for (const qr of [null, "", "https://example.org", "0221110551003"]) {
        assert.deepEqual(checkStream(qr, KAGERA_STREAM_1, "president"), {
            kind: "unread",
        });
    }
});
