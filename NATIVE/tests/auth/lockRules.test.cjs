const assert = require("node:assert/strict");
const test = require("node:test");

const {
    BIOMETRIC_LOCK_AFTER_MS,
    PASSWORD_LOCK_AFTER_MS,
    isCancelledPrompt,
    sessionCheck,
    shouldLock,
    unlockOutcome,
} = require("../../app/_utils/auth/lockRules.ts");

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

// Runs the unlock with fake steps and records what it did to the session.
async function unlock({token = "knox-token", promptError, status = 200}) {
    const done = [];
    const outcome = await unlockOutcome({
        async readToken() {
            if (promptError) throw promptError;
            return token;
        },
        checkSession: async () => status,
        logIn: (loggedInWith) => done.push(`logIn ${loggedInWith}`),
        signOut: async (biometricCopy) => done.push(`signOut ${biometricCopy}`),
    });
    return {outcome, done};
}

test("a valid session signs in with the token Face ID released", async () => {
    assert.deepEqual(await unlock({status: 200}), {
        outcome: "unlocked",
        done: ["logIn knox-token"],
    });
});

test("an ended session drops the copy and signs out", async () => {
    assert.deepEqual(await unlock({status: 401}), {
        outcome: "session_ended",
        done: ["signOut expire"],
    });
});

test("changed biometrics turn unlock off and sign out", async () => {
    assert.deepEqual(await unlock({token: null}), {
        outcome: "biometrics_changed",
        done: ["signOut turn_off"],
    });
});

test("an unreachable server or a failed prompt leaves the session alone", async () => {
    assert.deepEqual(await unlock({status: null}), {outcome: "unreachable", done: []});
    assert.deepEqual(await unlock({status: 500}), {outcome: "unreachable", done: []});
    assert.deepEqual(await unlock({promptError: new Error("User canceled")}), {
        outcome: "cancelled",
        done: [],
    });
    assert.deepEqual(await unlock({promptError: new Error("Lockout")}), {
        outcome: "prompt_failed",
        done: [],
    });
});
