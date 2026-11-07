const assert = require("node:assert/strict");
const test = require("node:test");

const {checkPlace} = require("../../components/resultsForm/upload/locationCheck.ts");

const M_PER_DEG_LAT = 111_320;
const CENTRE = [36.5, 0.5];
const SQUARE = {
    type: "Polygon",
    coordinates: [[[36, 0], [37, 0], [37, 1], [36, 1], [36, 0]]],
};

const data = (overrides = {}) => ({
    centre: CENTRE,
    radius_m: 100,
    accuracy_allowance: false,
    ward_boundary: SQUARE,
    ...overrides,
});

const north = (metres, accuracy = 10) => ({
    longitude: CENTRE[0],
    latitude: CENTRE[1] + metres / M_PER_DEG_LAT,
    accuracy,
});

test("near the pin and in the ward is at the centre", () => {
    assert.deepEqual(checkPlace(north(80), data()), {kind: "centre"});
});

test("in the ward but away from the pin says how far", () => {
    const check = checkPlace(north(500), data());
    assert.equal(check.kind, "ward");
    assert.ok(Math.abs(check.distanceM - 500) < 5);
});

test("outside the ward is outside, even near the pin", () => {
    const edge = CENTRE[1] + 50 / M_PER_DEG_LAT;
    const ward = {
        type: "Polygon",
        coordinates: [[[36, 0], [37, 0], [37, edge], [36, edge], [36, 0]]],
    };
    assert.deepEqual(checkPlace(north(80), data({ward_boundary: ward})), {
        kind: "outside",
    });
    assert.deepEqual(
        checkPlace({longitude: 38, latitude: 0.5, accuracy: 10}, data()),
        {kind: "outside"},
    );
});

test("a hole in the ward is outside it", () => {
    const ward = {
        type: "Polygon",
        coordinates: [
            SQUARE.coordinates[0],
            [[36.4, 0.4], [36.6, 0.4], [36.6, 0.6], [36.4, 0.6], [36.4, 0.4]],
        ],
    };
    assert.deepEqual(checkPlace(north(0), data({ward_boundary: ward, centre: null})), {
        kind: "outside",
    });
});

test("no fix, or one less precise than 100 m, is unknown", () => {
    assert.deepEqual(checkPlace(null, data()), {kind: "unknown"});
    assert.deepEqual(checkPlace(north(0, 150), data()), {kind: "unknown"});
});

test("agents get the fix accuracy on top of the radius", () => {
    const fix = north(140, 60);
    assert.equal(checkPlace(fix, data()).kind, "ward");
    assert.equal(checkPlace(fix, data({accuracy_allowance: true})).kind, "centre");
});

test("without a pin the ward alone decides", () => {
    assert.deepEqual(checkPlace(north(10), data({centre: null})), {
        kind: "ward",
        distanceM: null,
    });
});

test("an outside-ward centre counts only near its pin", () => {
    const outsideWard = data({ward_boundary: null});
    assert.deepEqual(checkPlace(north(90), outsideWard), {kind: "centre"});
    assert.deepEqual(checkPlace(north(140), outsideWard), {kind: "outside"});
});
