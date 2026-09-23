import {isPinOutsideWard} from "./wardGeometry";
import {IPollingCenterFeature} from "./types";

const WARD = {
    type: "Polygon",
    coordinates: [
        [
            [36, 0],
            [37, 0],
            [37, 1],
            [36, 1],
            [36, 0],
        ],
    ],
};

function center(
    coordinates: [number, number] | null,
    extra: Partial<IPollingCenterFeature["properties"]> = {},
): IPollingCenterFeature {
    return {
        id: 1,
        type: "Feature",
        geometry: {type: "Polygon", coordinates: []},
        properties: {
            name: "Mtwapa Primary School",
            code: "022",
            ward: "Kaloleni",
            ward_boundary: WARD,
            constituency: "Kaloleni",
            county: "Kilifi",
            pin_location_error: null,
            is_verified: false,
            location_upvotes: 0,
            pin_location: coordinates && {type: "Point", coordinates},
            ...extra,
        },
    };
}

test("a pin beyond the ward outline is outside it", () => {
    expect(isPinOutsideWard(center([37.5, 0.5]))).toBe(true);
});

test("a pin within the ward outline is not outside it", () => {
    expect(isPinOutsideWard(center([36.5, 0.5]))).toBe(false);
});

test("an unlocated center is never reported as outside its ward", () => {
    expect(isPinOutsideWard(center([0, 0], {is_unlocated: true}))).toBe(false);
    expect(isPinOutsideWard(center(null, {is_unlocated: true}))).toBe(false);
});
