const assert = require("node:assert/strict");
const test = require("node:test");

const {
    advanceCaptureGate,
    startCaptureGate,
} = require("../../components/resultsForm/camera/captureGate.ts");

// A printed form that passes every quality grade.
const GOOD = {brightness: 150, sharpness: 3000, glare: 0};
// Laplacian variance below the blurry cutoff.
const BLURRY = {brightness: 150, sharpness: 100, glare: 0};
// A portrait page filling half the frame.
const PAGE = {areaFraction: 0.5, aspectRatio: 0.7};
// A portrait page too far away to keep handwritten digits.
const SMALL_PAGE = {areaFraction: 0.2, aspectRatio: 0.7};

const OPENED_MS = 1_000_000;

/** Feed readings in order; each is [quality, document, cameraSeconds, nowMs?]. */
function run(readings, state = startCaptureGate(OPENED_MS)) {
    let result;
    for (const [quality, document, cameraSeconds, nowMs] of readings) {
        result = advanceCaptureGate(state, {
            nowMs: nowMs ?? OPENED_MS,
            reading: {quality, document, cameraSeconds},
        });
        state = result.state;
    }
    return result;
}

test("the shutter is offered only after two seconds of usable frames", () => {
    const nearlyReady = run([
        [GOOD, PAGE, 10],
        [GOOD, PAGE, 11.99],
    ]);
    const ready = run([[GOOD, PAGE, 12]], nearlyReady.state);

    assert.equal(nearlyReady.view.shutter, "waiting");
    assert.equal(nearlyReady.becameReady, false);
    assert.equal(ready.view.shutter, "ready");
    assert.equal(ready.becameReady, true);
});

test("one unusable frame restarts the two seconds", () => {
    const restarted = run([
        [GOOD, PAGE, 20],
        [BLURRY, PAGE, 21.9],
        [GOOD, PAGE, 22],
        [GOOD, PAGE, 23.9],
    ]);

    assert.equal(restarted.view.shutter, "waiting");
});

test("a camera clock that jumps backwards starts a new run", () => {
    const restarted = run([
        [GOOD, PAGE, 100],
        [GOOD, PAGE, 1],
        [GOOD, PAGE, 3],
    ]);

    assert.equal(restarted.view.shutter, "ready");
});

test("a page too small for the digits asks the person to move closer", () => {
    const result = run([
        [GOOD, SMALL_PAGE, 0],
        [GOOD, SMALL_PAGE, 3],
    ]);

    assert.equal(result.view.shutter, "waiting");
    assert.deepEqual(result.view.guidance, {
        label: "Move closer",
        hint: "Fill the brackets with the form",
        ok: false,
    });
});

test("no page in view asks for the whole form", () => {
    const result = run([
        [GOOD, null, 0],
        [GOOD, null, 3],
    ]);

    assert.equal(result.view.shutter, "waiting");
    assert.deepEqual(result.view.guidance, {
        label: "Show the whole form",
        hint: "Fit all four edges inside the brackets",
        ok: false,
    });
});

test("a usable frame that is not yet ready says hold still", () => {
    const result = run([
        [GOOD, PAGE, 0],
        [GOOD, PAGE, 1],
    ]);

    assert.deepEqual(result.view.guidance, {
        label: "Hold still",
        hint: null,
        ok: true,
        settling: true,
    });
});

test("the brackets are red when unusable, yellow when usable, lime when ready", () => {
    const unusable = run([[BLURRY, PAGE, 0]]);
    const usable = run([[GOOD, PAGE, 0]]);
    const ready = run([
        [GOOD, PAGE, 0],
        [GOOD, PAGE, 2],
    ]);

    assert.equal(unusable.view.bracket, "bad");
    assert.equal(usable.view.bracket, "ok");
    assert.equal(ready.view.bracket, "steady");
});

test("capture anyway is offered 15 seconds after the camera opens without ready", () => {
    const before = run([[BLURRY, PAGE, 0, OPENED_MS + 14_999]]);
    const after = run([[BLURRY, PAGE, 1, OPENED_MS + 15_000]], before.state);

    assert.equal(before.view.shutter, "waiting");
    assert.equal(after.view.shutter, "anyway");
});

test("capture anyway is offered even when no frame was ever measured", () => {
    const result = advanceCaptureGate(startCaptureGate(OPENED_MS), {
        nowMs: OPENED_MS + 15_000,
    });

    assert.equal(result.view.shutter, "anyway");
    assert.equal(result.view.guidance, null);
    assert.equal(result.view.bracket, "bad");
});

test("the ready shutter replaces capture anyway", () => {
    const result = run([
        [GOOD, PAGE, 0, OPENED_MS + 20_000],
        [GOOD, PAGE, 2, OPENED_MS + 22_000],
    ]);

    assert.equal(result.view.shutter, "ready");
});

test("reopening the camera restarts the 15 seconds", () => {
    const reopenedMs = OPENED_MS + 20_000;
    const result = advanceCaptureGate(startCaptureGate(reopenedMs), {
        nowMs: reopenedMs + 5_000,
    });

    assert.equal(result.view.shutter, "waiting");
});

test("the guidance keeps naming the problem while capture anyway is offered", () => {
    const result = run([[BLURRY, PAGE, 0, OPENED_MS + 15_000]]);

    assert.equal(result.view.shutter, "anyway");
    assert.deepEqual(result.view.guidance, {
        label: "Blurry",
        hint: "Hold steady and let it focus",
        ok: false,
    });
});

test("a usable frame without a camera time keeps yellow brackets but no ready run", () => {
    const result = run([[GOOD, PAGE, Number.NaN]]);

    assert.equal(result.view.bracket, "ok");
    assert.equal(result.view.shutter, "waiting");
});

test("the view says when capture anyway becomes available", () => {
    const opened = advanceCaptureGate(startCaptureGate(OPENED_MS), {
        nowMs: OPENED_MS + 4_000,
    });
    const reopened = advanceCaptureGate(startCaptureGate(OPENED_MS + 30_000), {
        nowMs: OPENED_MS + 31_000,
    });

    assert.equal(opened.view.anywayAtMs, OPENED_MS + 15_000);
    assert.equal(reopened.view.anywayAtMs, OPENED_MS + 45_000);
});

// Below the "Too dark" brightness cutoff.
const DARK = {brightness: 40, sharpness: 3000, glare: 0};

/** Feed readings with one light setting; each is [quality, cameraSeconds]. */
function runLit(light, readings, state = startCaptureGate(OPENED_MS)) {
    let result;
    for (const [quality, cameraSeconds] of readings) {
        result = advanceCaptureGate(state, {
            nowMs: OPENED_MS,
            light,
            reading: {quality, document: PAGE, cameraSeconds},
        });
        state = result.state;
    }
    return result;
}

test("with the light off, a page dark for a second says to tap the light", () => {
    const early = runLit("off", [
        [DARK, 0],
        [DARK, 0.9],
    ]);
    const late = runLit("off", [[DARK, 1]], early.state);

    assert.equal(early.view.guidance.hint, "Move to better light");
    assert.deepEqual(late.view.guidance, {
        label: "Too dark",
        hint: "Tap the light",
        ok: false,
    });
    assert.equal(late.view.torchOn, false);
});

test("a phone without a light never says to tap it", () => {
    const result = runLit(null, [
        [DARK, 0],
        [DARK, 2],
    ]);

    assert.equal(result.view.guidance.hint, "Move to better light");
    assert.equal(result.view.torchOn, false);
});

test("one brighter reading restarts the dark second", () => {
    const result = runLit("auto", [
        [DARK, 0],
        [GOOD, 0.5],
        [DARK, 0.6],
        [DARK, 1.5],
    ]);

    assert.equal(result.view.torchOn, false);
});

test("auto turns the light on after a dark second and leaves it on", () => {
    const lit = runLit("auto", [
        [DARK, 0],
        [DARK, 1],
    ]);
    const brightAgain = runLit("auto", [[GOOD, 2]], lit.state);

    assert.equal(lit.view.torchOn, true);
    assert.equal(brightAgain.view.torchOn, true);
});

test("reopening the camera on auto starts with the light off", () => {
    const result = advanceCaptureGate(startCaptureGate(OPENED_MS), {
        nowMs: OPENED_MS,
        light: "auto",
    });

    assert.equal(result.view.torchOn, false);
});

test("on lights at once and off keeps it dark", () => {
    const on = advanceCaptureGate(startCaptureGate(OPENED_MS), {
        nowMs: OPENED_MS,
        light: "on",
    });
    const off = runLit("off", [
        [DARK, 0],
        [DARK, 3],
    ]);

    assert.equal(on.view.torchOn, true);
    assert.equal(off.view.torchOn, false);
});

test("the light hint comes before page guidance, since a dark page cannot be found", () => {
    let state = startCaptureGate(OPENED_MS);
    let result;
    for (const cameraSeconds of [0, 1]) {
        result = advanceCaptureGate(state, {
            nowMs: OPENED_MS,
            light: "off",
            reading: {quality: DARK, document: null, cameraSeconds},
        });
        state = result.state;
    }

    assert.equal(result.view.guidance.hint, "Tap the light");
});
