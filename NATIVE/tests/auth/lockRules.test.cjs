const assert = require("node:assert/strict");
const test = require("node:test");

const {isCancelledPrompt} = require("../../app/_utils/lockRules.ts");

test("recognises a dismissed prompt on both platforms", () => {
    const ios = new Error("User canceled the operation.");
    const android = new Error("Could not Authenticate the user: User canceled");
    const lockout = new Error("Could not Authenticate the user: Lockout");

    assert.equal(isCancelledPrompt(ios), true);
    assert.equal(isCancelledPrompt(android), true);
    assert.equal(isCancelledPrompt(lockout), false);
    assert.equal(isCancelledPrompt("cancel"), false);
});
