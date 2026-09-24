const assert = require("node:assert/strict");
const test = require("node:test");

const {networkStatus} = require("../../app/_utils/networkStatus.ts");

test("reports offline only when there is no connection", () => {
    assert.equal(networkStatus({isConnected: false}), "offline");
});

test("treats unknown connectivity as checking, not offline", () => {
    assert.equal(networkStatus({isConnected: null}), "checking");
});

test("ignores internet reachability, which iOS reports as false without a probe", () => {
    assert.equal(
        networkStatus({isConnected: true, isInternetReachable: false}),
        "online",
    );
});
