import {Alert} from "react-native";
import {useState} from "react";

import type {ResultsFormPlace} from "../types";
import {type DeviceFix, isPrecise} from "./deviceFix";
import {type PlaceCheck, checkPlace} from "./locationCheck";
import {placeWarning} from "./placeWarning";

/**
 * Warnings about where the phone is: once after a photo is accepted, and
 * before sending when the phone is outside or its fix is not precise.
 */
export function usePlaceCheck(place: ResultsFormPlace | undefined, fix: DeviceFix | null) {
    /** The last place warning shown, so the same one is not shown twice. */
    const [placeWarned, setPlaceWarned] = useState<PlaceCheck["kind"] | null>(null);

    /** Send, after warning about a phone away from the centre or imprecise. */
    const sendWhereAllowed = (send: () => void) => {
        const check = place ? checkPlace(fix, place.check) : null;
        const warning = place && check ? placeWarning(check, place) : null;
        if (check?.kind === "outside" && warning && placeWarned !== "outside") {
            setPlaceWarned("outside");
            Alert.alert(warning.title, warning.body, [
                {text: "Cancel", style: "cancel"},
                {text: "Upload anyway", style: "destructive", onPress: send},
            ]);
            return;
        }
        if (isPrecise(fix)) {
            send();
            return;
        }
        // The server would grade it unknown: say so, and let them wait.
        const accuracy = fix ? ` (±${Math.round(fix.accuracy)} m)` : "";
        Alert.alert(
            "Location not precise yet",
            `Your location is not precise enough yet${accuracy}. Step outside or wait. An upload without a precise location cannot support a result.`,
            [
                {text: "Wait", style: "cancel"},
                {text: "Upload anyway", style: "destructive", onPress: send},
            ],
        );
    };

    /**
     * The phone has been locating since the form opened; say now if it is
     * away from the centre, before the counts are typed.
     */
    const warnAfterCapture = () => {
        if (!place) return;
        const check = checkPlace(fix, place.check);
        const warning = placeWarning(check, place);
        if (warning && placeWarned !== check.kind) {
            setPlaceWarned(check.kind);
            Alert.alert(warning.title, warning.body);
        }
    };

    const reset = () => setPlaceWarned(null);

    return {sendWhereAllowed, warnAfterCapture, reset};
}
