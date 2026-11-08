const assert = require("node:assert/strict");
const test = require("node:test");

const {fillBoxes} = require("../../components/resultsForm/reading/prefill.ts");

test("figures read one way fill their boxes", () => {
    const filled = fillBoxes(
        {votes: {14706: 1, 14708: 35, 14709: 129}, rejected_votes: 6, disputed_votes: 0},
        ["14706", "14708", "14709"],
    );
    assert.deepEqual(filled.votes, {14706: "1", 14708: "35", 14709: "129"});
    assert.equal(filled.rejectedVotes, "6");
    assert.equal(filled.disputedVotes, "0");
    assert.deepEqual(filled.unread, []);
});

test("a figure the reading left out stays empty and is marked", () => {
    const filled = fillBoxes(
        {votes: {14706: null, 14708: 35}, rejected_votes: null, disputed_votes: 0},
        ["14706", "14708", "14713"],
    );
    assert.deepEqual(filled.votes, {14708: "35"});
    assert.equal(filled.rejectedVotes, "");
    assert.deepEqual(filled.unread, ["14706", "14713", "rejected"]);
});

test("no reading leaves every box empty", () => {
    const filled = fillBoxes(null, ["14706"]);
    assert.deepEqual(filled.votes, {});
    assert.deepEqual(filled.unread, ["14706", "rejected", "disputed"]);
});
