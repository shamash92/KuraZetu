const assert = require("node:assert/strict");
const test = require("node:test");

const {
    parseVoteCount,
} = require("../../app/(tabs)/communityNotes/[id]/_components/voteCount.ts");

test("keeps only decimal digits from a vote count", () => {
    assert.equal(parseVoteCount(" 1,234 votes "), 1234);
    assert.equal(parseVoteCount(""), 0);
});

test("caps pasted counts at the largest safe integer", () => {
    assert.equal(
        parseVoteCount("999999999999999999999999"),
        Number.MAX_SAFE_INTEGER,
    );
});
