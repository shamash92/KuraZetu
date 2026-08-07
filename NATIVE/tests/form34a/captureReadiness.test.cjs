const assert = require("node:assert/strict");
const test = require("node:test");

const {
    INITIAL_CAPTURE_READINESS,
    advanceCaptureReadiness,
} = require("../../app/(tabs)/communityNotes/[id]/_components/captureReadiness.ts");

test("becomes ready only after two seconds of acceptable frames", () => {
    const started = advanceCaptureReadiness(
        INITIAL_CAPTURE_READINESS,
        true,
        10,
    );
    const nearlyReady = advanceCaptureReadiness(started.state, true, 11.99);
    const ready = advanceCaptureReadiness(nearlyReady.state, true, 12);

    assert.equal(started.state.ready, false);
    assert.equal(nearlyReady.state.ready, false);
    assert.equal(ready.state.ready, true);
    assert.equal(ready.becameReady, true);
});

test("an unacceptable frame restarts the readiness window", () => {
    const started = advanceCaptureReadiness(
        INITIAL_CAPTURE_READINESS,
        true,
        20,
    );
    const reset = advanceCaptureReadiness(started.state, false, 21.9);
    const restarted = advanceCaptureReadiness(reset.state, true, 22);
    const tooSoon = advanceCaptureReadiness(restarted.state, true, 23.9);

    assert.deepEqual(reset.state, INITIAL_CAPTURE_READINESS);
    assert.equal(tooSoon.state.ready, false);
});

test("a camera timestamp reset begins a new readiness window", () => {
    const started = advanceCaptureReadiness(
        INITIAL_CAPTURE_READINESS,
        true,
        100,
    );
    const restarted = advanceCaptureReadiness(started.state, true, 1);

    assert.equal(restarted.state.goodSinceSeconds, 1);
    assert.equal(restarted.state.goodForSeconds, 0);
    assert.equal(restarted.state.ready, false);
});
