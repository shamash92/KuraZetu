import {File} from "expo-file-system";

import {apiBaseURL} from "@/app/_utils/apiBaseURL";
import {handleUnauthorized} from "@/app/_utils/auth/handleUnauthorized";

import type {DeviceFix} from "./deviceFix";
import {fitPhoto} from "./fitPhoto";

export interface ResultsFormUpload {
    token: string;
    stationCode: string;
    race: string;
    image: string;
    qualityChecked: boolean;
    /** Aspirant id to votes, for every candidate shown. */
    votes: Record<string, number>;
    rejectedVotes: number;
    disputedVotes: number;
    /** Made once per photo, so sending it again stores one upload. */
    key: string;
    fix: DeviceFix | null;
    capturedAt: string | null;
}

export type UploadOutcome =
    /** `message` says why the upload cannot support a result, when it cannot. */
    | {kind: "stored"; countable: boolean; message: string | null}
    | {kind: "refused"; message: string}
    | {kind: "signed_out"}
    | {kind: "failed"};

/** Send one results form photo and its tally to the server. */
export async function uploadResultsForm(upload: ResultsFormUpload): Promise<UploadOutcome> {
    const photo = await fitPhoto(upload.image);

    const body = new FormData();
    body.append("station", upload.stationCode);
    body.append("race", upload.race);
    body.append("votes", JSON.stringify(upload.votes));
    body.append("rejected_votes", String(upload.rejectedVotes));
    body.append("disputed_votes", String(upload.disputedVotes));
    body.append("quality_checked", upload.qualityChecked ? "true" : "false");
    body.append("key", upload.key);
    if (upload.fix) {
        body.append("latitude", String(upload.fix.latitude));
        body.append("longitude", String(upload.fix.longitude));
        body.append("accuracy", String(upload.fix.accuracy));
    }
    if (upload.capturedAt) body.append("captured_at", upload.capturedAt);
    // Expo's FormData takes Blob-compatible values, not {uri, type, name}.
    body.append("photo", new File(photo));

    try {
        const response = await fetch(`${apiBaseURL}/api/results/uploads/`, {
            method: "POST",
            headers: {Accept: "application/json", Authorization: `Bearer ${upload.token}`},
            body,
        });
        if (await handleUnauthorized(response)) return {kind: "signed_out"};
        const data = await response.json().catch(() => null);
        if (response.ok) {
            return {
                kind: "stored",
                countable: data?.countable === true,
                message: data?.location_message ?? null,
            };
        }
        return {kind: "refused", message: data?.error ?? "The upload was refused."};
    } catch {
        return {kind: "failed"};
    } finally {
        if (photo !== upload.image) new File(photo).delete();
    }
}

/** A random identifier for one photo. Not a secret; it only has to be unique. */
export function newUploadKey(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
}
