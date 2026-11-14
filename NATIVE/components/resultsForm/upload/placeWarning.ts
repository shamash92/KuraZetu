import type {ResultsFormPlace} from "../types";
import type {PlaceCheck} from "./locationCheck";

function metres(distance: number): string {
    return distance >= 1000
        ? `${(distance / 1000).toFixed(1)} km`
        : `${Math.round(distance)} m`;
}

/** What to tell the person about where they are, or null when all is well. */
export function placeWarning(
    check: PlaceCheck,
    place: ResultsFormPlace,
): {title: string; body: string} | null {
    const ward = place.wardName ? `${place.wardName} ward` : "this station's ward";
    const fix =
        "restart the app, turn on the internet and wait for a GPS lock before you submit.";
    if (check.kind === "outside") {
        // An outside-ward centre is checked only near its pin.
        return place.check.ward_boundary
            ? {
                  title: `You are outside ${ward}`,
                  body: `This upload will not count. If you are in ${ward}, ${fix}`,
              }
            : {
                  title: `You are not at ${place.centreName}`,
                  body: `This upload will not count. This centre counts only uploads made at the centre. If you are at the centre, ${fix}`,
              };
    }
    if (check.kind === "ward" && check.distanceM !== null) {
        return {
            title: `You are not at ${place.centreName}`,
            body: `You are about ${metres(check.distanceM)} from the centre. Your upload still counts because you are in ${ward}.`,
        };
    }
    return null;
}
