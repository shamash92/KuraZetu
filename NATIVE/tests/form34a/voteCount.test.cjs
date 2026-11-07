const assert = require("node:assert/strict");
const test = require("node:test");

const {
    toCount,
    voteBoxes,
    voteDigits,
    voteLimit,
} = require("../../components/resultsForm/entry/voteCount.ts");

test("typed digits fill the three boxes from the right", () => {
    assert.equal(voteBoxes(voteDigits("4")), "004");
    assert.equal(voteBoxes(voteDigits("40")), "040");
    assert.equal(voteBoxes(voteDigits("0")), "000");
    assert.equal(voteDigits("04"), "4");
    assert.equal(voteDigits(" 1,2345 "), "123");
});

test("an empty box counts as 0", () => {
    assert.equal(toCount(""), 0);
    assert.equal(toCount("0"), 0);
    assert.equal(toCount("40"), 40);
});

test("a station can count up to 700, or its register when higher", () => {
    assert.equal(voteLimit(370), 700);
    assert.equal(voteLimit(831), 831);
    assert.equal(voteLimit(null), 700);
});
