const assert = require("node:assert/strict");
const test = require("node:test");

const {
    getCameraPermissionRecovery,
} = require("../../app/(tabs)/communityNotes/[id]/_components/cameraPermission.ts");

test("offers the system permission prompt when it remains available", () => {
    assert.deepEqual(getCameraPermissionRecovery(true), {
        action: "request",
        message: "We need camera permission to capture Form 34A",
        buttonLabel: "Grant Permission",
    });
});

test("directs a permanently denied permission to device settings", () => {
    assert.deepEqual(getCameraPermissionRecovery(false), {
        action: "settings",
        message:
            "Camera access is turned off. Enable it in Settings to capture Form 34A.",
        buttonLabel: "Open Settings",
    });
});
