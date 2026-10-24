const assert = require("node:assert/strict");
const test = require("node:test");

const {
    isPrecise,
    moreAccurate,
} = require("../../components/resultsForm/upload/deviceFix.ts");

const fix = (accuracy) => ({latitude: 0.5, longitude: 36.5, accuracy});

test("the more accurate of two fixes is kept", () => {
    assert.deepEqual(moreAccurate(fix(40), fix(15)), fix(15));
    assert.deepEqual(moreAccurate(fix(15), fix(40)), fix(15));
    assert.deepEqual(moreAccurate(null, fix(80)), fix(80));
});

test("a fix counts as precise only within 100 m", () => {
    assert.equal(isPrecise(fix(100)), true);
    assert.equal(isPrecise(fix(101)), false);
    assert.equal(isPrecise(null), false);
});
