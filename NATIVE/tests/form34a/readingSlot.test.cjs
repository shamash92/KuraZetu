const assert = require("node:assert/strict");
const test = require("node:test");

const {
    isReadingOverdue,
} = require("../../components/resultsForm/camera/readingSlot.ts");

test("a slow reading within two seconds of camera time is waited for", () => {
    assert.equal(isReadingOverdue(10, 11.99), false);
});

test("a reading not back after two seconds is abandoned", () => {
    assert.equal(isReadingOverdue(10, 12), true);
});

test("a camera clock that jumps backwards abandons the reading", () => {
    assert.equal(isReadingOverdue(10, 2), true);
});
