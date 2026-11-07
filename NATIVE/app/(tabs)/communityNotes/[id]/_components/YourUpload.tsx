import {ActivityIndicator, Dimensions, StyleSheet, Text, View} from "react-native";
import {TriangleAlert} from "lucide-react-native";
import React, {useState} from "react";

import {IPollingStationResult} from "@/app/types";
import {ResultsTable} from "./ResultsTable";
import {ZoomableImage} from "./ZoomableImage";
import {perk} from "@/app/_utils/colors";

const windowHeight = Dimensions.get("window").height;

export type OwnUpload = {
    id: string;
    votes: IPollingStationResult[];
    rejected_votes: number;
    disputed_votes: number;
    location_grade: string;
    countable: boolean;
    created_at: string;
    // Both open only with the uploader's sign-in token. A small photo has
    // the same link for both.
    photo_preview: string;
    photo_full: string;
};

// Why an upload cannot count, by its location grade.
const WARNINGS: Record<string, string> = {
    location_unknown: "No precise location, so this upload cannot count.",
    location_mismatch: "Not made at the polling centre, so this upload cannot count.",
};

/**
 * What this person uploaded for this stream and race, exactly as sent. It is
 * read-only: an upload cannot be changed or taken again once submitted.
 */
export function YourUpload({
    upload,
    levelLabel,
    token,
}: {
    upload: OwnUpload;
    /** The race as it reads in a sentence, e.g. "MCA". */
    levelLabel: string;
    token: string;
}) {
    const [photoState, setPhotoState] = useState<"loading" | "loaded" | "failed">(
        "loading",
    );
    // The full photo loads behind the preview; a failure keeps the preview.
    const [fullPending, setFullPending] = useState(
        upload.photo_full !== upload.photo_preview,
    );

    return (
        <View style={styles.wrapper}>
            {upload.countable ? null : (
                <View style={styles.warning} accessibilityRole="alert">
                    <TriangleAlert size={15} color={perk.ink} strokeWidth={2.4} />
                    <Text style={styles.warningText}>
                        {WARNINGS[upload.location_grade] ?? "This upload cannot count."}
                    </Text>
                </View>
            )}

            <View style={styles.photo}>
                {photoState === "loading" ? (
                    <ActivityIndicator
                        style={StyleSheet.absoluteFill}
                        size="large"
                        color={perk.mute}
                        accessibilityLabel="Loading your photo"
                    />
                ) : null}
                {photoState === "failed" ? (
                    <Text style={styles.photoFailed}>Could not load your photo.</Text>
                ) : null}
                <ZoomableImage
                    uri={upload.photo_preview}
                    headers={{Authorization: `Bearer ${token}`}}
                    onLoad={() => setPhotoState("loaded")}
                    onError={() => setPhotoState("failed")}
                    fullUri={upload.photo_full}
                    onFullLoad={() => setFullPending(false)}
                    onFullError={() => setFullPending(false)}
                />
                <View style={styles.badge} pointerEvents="none">
                    <Text style={styles.badgeText}>Your upload</Text>
                </View>
                {photoState === "loaded" && fullPending ? (
                    <View style={styles.fullLoading} pointerEvents="none">
                        <ActivityIndicator size="small" color={perk.paper} />
                        <Text style={styles.badgeText}>Loading full photo</Text>
                    </View>
                ) : null}
            </View>

            <View>
                <ResultsTable results={upload.votes} title={`Your ${levelLabel} tally`} />
                <View style={styles.extraRow}>
                    <Text style={styles.extraLabel}>Rejected votes</Text>
                    <Text style={styles.extraValue}>{upload.rejected_votes}</Text>
                </View>
                <View style={styles.extraRow}>
                    <Text style={styles.extraLabel}>Disputed votes</Text>
                    <Text style={styles.extraValue}>{upload.disputed_votes}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: 8,
        paddingTop: 8,
        gap: 8,
    },
    warning: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: perk.yellow,
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 17,
        fontWeight: "600",
        color: perk.ink,
    },
    photo: {
        height: 0.45 * windowHeight,
        borderRadius: 14,
        overflow: "hidden",
    },
    photoFailed: {
        position: "absolute",
        top: "45%",
        left: 0,
        right: 0,
        textAlign: "center",
        fontSize: 15,
        color: perk.mute,
    },
    badge: {
        position: "absolute",
        top: 10,
        left: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: perk.ink,
    },
    fullLoading: {
        position: "absolute",
        bottom: 10,
        right: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: perk.ink,
        opacity: 0.85,
    },
    badgeText: {
        fontSize: 13,
        fontWeight: "700",
        color: perk.paper,
    },
    extraRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: perk.rule16,
    },
    extraLabel: {
        fontSize: 15,
        color: perk.ink,
    },
    extraValue: {
        fontSize: 15,
        fontWeight: "700",
        color: perk.ink,
        fontVariant: ["tabular-nums"],
    },
});
