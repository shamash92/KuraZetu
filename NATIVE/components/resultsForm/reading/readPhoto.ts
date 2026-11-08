import {File} from "expo-file-system";
import {useQuery} from "@tanstack/react-query";
import {useEffect, useState} from "react";

import {apiBaseURL} from "@/app/_utils/apiBaseURL";
import {handleUnauthorized} from "@/app/_utils/auth/handleUnauthorized";

import {fitPhoto} from "../upload/fitPhoto";
import type {Reading} from "./prefill";

const READING_URL = `${apiBaseURL}/api/results/read/`;

/** How often the phone asks for the reading. */
const ASK_EVERY_MS = 2000;
/**
 * When the phone stops asking. The server marks a reading still running
 * after 90 s as timed out; this covers a phone that cannot reach it.
 */
const GIVE_UP_MS = 95_000;

export type StartOutcome =
    | {kind: "started"; reading: Reading}
    | {kind: "signed_out"}
    /** Reading is not open to this account: the person types the results. */
    | {kind: "not_allowed"}
    /**
     * Refused or not sent: the person types the results instead. `message`
     * is the server's reason, when it refused.
     */
    | {kind: "failed"; message: string | null};

/** Send the photo to be read. The server answers at once. */
export async function startReading(upload: {
    token: string;
    stationCode: string;
    race: string;
    image: string;
    /** The earlier upload the person agrees with. */
    reference?: string | null;
}): Promise<StartOutcome> {
    const photo = await fitPhoto(upload.image);
    const body = new FormData();
    body.append("station", upload.stationCode);
    body.append("race", upload.race);
    // Expo's FormData takes Blob-compatible values, not {uri, type, name}.
    body.append("photo", new File(photo));
    if (upload.reference) body.append("reference", upload.reference);
    try {
        const response = await fetch(READING_URL, {
            method: "POST",
            headers: {Accept: "application/json", Authorization: `Bearer ${upload.token}`},
            body,
        });
        if (await handleUnauthorized(response)) return {kind: "signed_out"};
        if (!response.ok) {
            const data = await response.json().catch(() => null);
            if (data?.code === "reading_not_allowed") return {kind: "not_allowed"};
            console.warn(`[form34a] reading refused ${response.status} ${data?.code ?? ""}`);
            return {kind: "failed", message: data?.error ?? null};
        }
        return {kind: "started", reading: await response.json()};
    } catch (error) {
        console.warn("[form34a] reading not sent", error);
        return {kind: "failed", message: null};
    } finally {
        if (photo !== upload.image) new File(photo).delete();
    }
}

async function fetchReading(token: string, checkId: string): Promise<Reading> {
    const response = await fetch(`${READING_URL}${checkId}/`, {
        headers: {Accept: "application/json", Authorization: `Bearer ${token}`},
    });
    if (await handleUnauthorized(response)) throw new Error("signed out");
    if (!response.ok) throw new Error(`reading ${response.status}`);
    return response.json();
}

/**
 * Ask for the reading every 2 s until it is done or failed. `ended` is the
 * reading once it has ended, or "gave_up" when the server could not be
 * reached in time; null while it runs. `latest` is the last answer, which
 * shows how far the checks have got.
 */
export function useReading(
    token: string | null,
    checkId: string | null,
): {ended: Reading | "gave_up" | null; latest: Reading | null} {
    /** The reading the phone stopped asking for. */
    const [gaveUpOn, setGaveUpOn] = useState<string | null>(null);
    useEffect(() => {
        if (!checkId) return;
        const timer = setTimeout(() => setGaveUpOn(checkId), GIVE_UP_MS);
        return () => clearTimeout(timer);
    }, [checkId]);
    const gaveUp = !!checkId && gaveUpOn === checkId;

    const {data} = useQuery({
        queryKey: ["reading", checkId],
        queryFn: () => fetchReading(token!, checkId!),
        enabled: !!token && !!checkId && !gaveUp,
        refetchInterval: (query) =>
            query.state.data?.status === "done" || query.state.data?.status === "failed"
                ? false
                : ASK_EVERY_MS,
        gcTime: 0,
    });

    const latest = data ?? null;
    if (data && data.status !== "running") return {ended: data, latest};
    return {ended: gaveUp ? "gave_up" : null, latest};
}
