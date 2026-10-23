const assert = require("node:assert/strict");
const test = require("node:test");

const {
    isFilled,
    toCount,
    voteBoxes,
    voteDigits,
} = require("../../components/resultsForm/entry/voteCount.ts");

test("typed digits fill the three boxes from the right", () => {
    assert.equal(voteBoxes(voteDigits("4")), "004");
    assert.equal(voteBoxes(voteDigits("40")), "040");
    assert.equal(voteBoxes(voteDigits("0")), "000");
    assert.equal(voteDigits("04"), "4");
    assert.equal(voteDigits(" 1,2345 "), "123");
});

test("an untouched box is not a count, a typed 0 is", () => {
    assert.equal(isFilled(""), false);
    assert.equal(isFilled("0"), true);
    assert.equal(toCount("0"), 0);
    assert.equal(toCount("40"), 40);
});
