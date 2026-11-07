import {booleanPointInPolygon} from "@turf/boolean-point-in-polygon";
import {distance} from "@turf/distance";

import {type DeviceFix, MAX_ACCURACY_M} from "./deviceFix.ts";

/** What the station info sends so the phone can grade its own fix. */
export interface LocationCheckData {
    /** Longitude, latitude; null when the distance is not checked. */
    centre: [number, number] | null;
    radius_m: number;
    /** Agents and observers get the fix's accuracy added to the radius. */
    accuracy_allowance: boolean;
    /** GeoJSON polygon; null when the ward is not checked. */
    ward_boundary: {type: "Polygon"; coordinates: number[][][]} | null;
}

/**
 * Where the phone is, graded the way the server grades an upload. The
 * server's grade still decides.
 */
export type PlaceCheck =
    | {kind: "unknown"}
    | {kind: "centre"}
    /** In the ward; `distanceM` is from the centre's pin when it has one. */
    | {kind: "ward"; distanceM: number | null}
    | {kind: "outside"};

export function checkPlace(fix: DeviceFix | null, data: LocationCheckData): PlaceCheck {
    if (!fix || fix.accuracy > MAX_ACCURACY_M) return {kind: "unknown"};

    const here = [fix.longitude, fix.latitude];
    const ward = data.ward_boundary;
    // A point on the ward line is outside, as on the server.
    if (ward && !booleanPointInPolygon(here, ward, {ignoreBoundary: true})) {
        return {kind: "outside"};
    }

    let distanceM: number | null = null;
    if (data.centre) {
        distanceM = distance(here, data.centre, {units: "meters"});
        const allowed =
            data.radius_m +
            (data.accuracy_allowance ? Math.min(fix.accuracy, MAX_ACCURACY_M) : 0);
        if (distanceM <= allowed) return {kind: "centre"};
    }

    return ward ? {kind: "ward", distanceM} : {kind: "outside"};
}
