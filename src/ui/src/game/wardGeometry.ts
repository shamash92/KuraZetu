import {IPollingCenterFeature} from "./types";

// Ray-casting point-in-polygon for the ward-guard hint (backend is the gate).
function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        const intersect =
            yi > lat !== yj > lat &&
            lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}

export function pointInWard(lng: number, lat: number, boundary: any): boolean {
    if (!boundary) return true; // no polygon → don't block client-side
    const polys =
        boundary.type === "MultiPolygon" ? boundary.coordinates : [boundary.coordinates];
    return polys.some((poly: number[][][]) => pointInRing(lng, lat, poly[0]));
}

/** A located center whose own pin sits outside its ward outline. */
export function isPinOutsideWard(location: IPollingCenterFeature): boolean {
    const {is_unlocated, pin_location, ward_boundary} = location.properties;
    if (is_unlocated || !pin_location || !ward_boundary) return false;
    const [lng, lat] = pin_location.coordinates;
    return !pointInWard(lng, lat, ward_boundary);
}
