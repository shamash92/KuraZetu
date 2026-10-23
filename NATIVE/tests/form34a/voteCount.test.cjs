const assert = require("node:assert/strict");
const test = require("node:test");

const {
    parseVoteCount,
} = require("../../components/resultsForm/entry/voteCount.ts");

test("keeps only decimal digits from a vote count", () => {
    assert.equal(parseVoteCount(" 1,234 votes "), 1234);
});

test("an empty box is not a count, but a typed 0 is", () => {
    assert.equal(parseVoteCount(""), null);
    assert.equal(parseVoteCount("0"), 0);
});

test("caps pasted counts at the largest safe integer", () => {
    assert.equal(
        parseVoteCount("999999999999999999999999"),
        Number.MAX_SAFE_INTEGER,
    );
});
