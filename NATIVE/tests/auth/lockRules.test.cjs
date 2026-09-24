const assert = require("node:assert/strict");
const test = require("node:test");

const {
    BIOMETRIC_LOCK_AFTER_MS,
    PASSWORD_LOCK_AFTER_MS,
    isCancelledPrompt,
    sessionCheck,
    shouldLock,
} = require("../../app/_utils/lockRules.ts");

test("password-only users lock after five minutes in the background", () => {
    assert.equal(shouldLock(0, PASSWORD_LOCK_AFTER_MS - 1, false), false);
    assert.equal(shouldLock(0, PASSWORD_LOCK_AFTER_MS, false), true);
});

test("biometric users lock whenever they leave, past a short grace", () => {
    assert.equal(shouldLock(0, BIOMETRIC_LOCK_AFTER_MS - 1, true), false);
    assert.equal(shouldLock(0, BIOMETRIC_LOCK_AFTER_MS, true), true);
});

test("never locks without a recorded background time", () => {
    assert.equal(shouldLock(null, PASSWORD_LOCK_AFTER_MS * 10, false), false);
});

test("only a 401 ends the session; failures keep the token for a retry", () => {
    assert.equal(sessionCheck(200), "valid");
    assert.equal(sessionCheck(401), "expired");
    assert.equal(sessionCheck(500), "unreachable");
    assert.equal(sessionCheck(null), "unreachable");
});

test("recognises a dismissed prompt on both platforms", () => {
    const ios = new Error("User canceled the operation.");
    const android = new Error("Could not Authenticate the user: User canceled");
    const lockout = new Error("Could not Authenticate the user: Lockout");

    assert.equal(isCancelledPrompt(ios), true);
    assert.equal(isCancelledPrompt(android), true);
    assert.equal(isCancelledPrompt(lockout), false);
    assert.equal(isCancelledPrompt("cancel"), false);
});
