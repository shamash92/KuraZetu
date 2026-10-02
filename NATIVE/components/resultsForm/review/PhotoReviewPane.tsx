import {Image, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {Check} from "lucide-react-native";
import {
    NativeNitroImage,
    type Image as NitroImageHandle,
} from "react-native-nitro-image";

import type {StreamCheck} from "./streamCheck";
import {perk} from "@/app/_utils/colors";

interface PhotoReviewPaneProps {
    /** The results form being captured, e.g. "Form 37A". */
    formName: string;
    imageUri: string;
    preview: NitroImageHandle | null;
    previewAspect: number;
    streamCheck: StreamCheck | "checking" | null;
    canUsePhoto: boolean;
    onAccept: () => void;
    onRetake: () => void;
    onChooseStream?: () => void;
    /** Leave the capture form, offered when the form is from another centre. */
    onGoBack?: () => void;
}

interface StreamNotice {
    text: string;
    /** A problem replaces the usual review prompt and blocks the photo. */
    problem: boolean;
}

/** One line about the photo's QR, if there is anything to say. */
function streamNotice(
    check: StreamCheck | "checking" | null,
    canUsePhoto: boolean,
): StreamNotice | null {
    if (check === null) return null;
    if (check === "checking") {
        return {text: "Reading the QR code…", problem: false};
    }
    switch (check.kind) {
        case "match":
            return {
                text: `Stream ${check.stream} · matches the QR code`,
                problem: false,
            };
        case "otherStream":
            return {
                text:
                    `You captured Stream ${check.stream}, ` +
                    `not Stream ${check.selectedStream}.`,
                problem: true,
            };
        case "otherStation":
            return {text: "This form is from another polling centre.", problem: true};
        case "otherForm":
            return {
                text: check.captured
                    ? `This is ${check.captured} for Stream ${check.stream}, ` +
                      `not the expected ${check.expected}.`
                    : `This isn't the expected ${check.expected}.`,
                problem: true,
            };
        case "unread":
            return canUsePhoto
                ? {
                      text: "Couldn't read the QR code. You can still use this photo.",
                      problem: false,
                  }
                : {
                      text:
                          "Couldn't read the QR code. Keep the top-right corner " +
                          "flat and out of glare.",
                      problem: true,
                  };
    }
}

export function PhotoReviewPane({
    formName,
    imageUri,
    preview,
    previewAspect,
    streamCheck,
    canUsePhoto,
    onAccept,
    onRetake,
    onChooseStream,
    onGoBack,
}: PhotoReviewPaneProps) {
    const imageStyle = [styles.reviewImage, {aspectRatio: previewAspect}];
    const notice = streamNotice(streamCheck, canUsePhoto);
    const otherStream =
        streamCheck !== null &&
        streamCheck !== "checking" &&
        streamCheck.kind === "otherStream"
            ? streamCheck
            : null;
    const chooseStream = otherStream && onChooseStream ? otherStream : null;
    // A blocking problem leaves nothing to use: only Retake, or Choose Stream.
    const retakeOnly = !!notice?.problem && !chooseStream;
    // Retaking at the wrong centre cannot help; the only way on is back.
    const goBackOnly =
        !!onGoBack &&
        streamCheck !== null &&
        streamCheck !== "checking" &&
        streamCheck.kind === "otherStation";

    return (
        <View style={styles.reviewContainer}>
            <View style={styles.reviewImageFrame}>
                {preview ? (
                    <NativeNitroImage
                        image={preview}
                        style={imageStyle}
                        resizeMode="contain"
                        accessible
                        accessibilityLabel={`Captured ${formName} preview`}
                    />
                ) : (
                    <Image
                        source={{uri: imageUri}}
                        style={imageStyle}
                        resizeMode="contain"
                        accessible
                        accessibilityLabel={`Captured ${formName} preview`}
                    />
                )}
            </View>
            <Text
                style={styles.reviewPrompt}
                accessibilityRole={notice?.problem ? "alert" : undefined}
                accessibilityLiveRegion="polite"
            >
                {notice?.problem ? notice.text : "Can you read every vote number?"}
            </Text>
            {notice && !notice.problem && (
                <Text style={styles.streamNote}>{notice.text}</Text>
            )}
            <View style={styles.reviewControls}>
                <TouchableOpacity
                    style={[
                        styles.reviewRetake,
                        retakeOnly && styles.reviewRetakeAlone,
                    ]}
                    onPress={goBackOnly ? onGoBack : onRetake}
                    accessibilityRole="button"
                >
                    <Text style={styles.secondaryButtonText}>
                        {goBackOnly ? "Go back" : "Retake"}
                    </Text>
                </TouchableOpacity>
                {chooseStream ? (
                    <TouchableOpacity
                        style={styles.reviewAccept}
                        onPress={onChooseStream}
                        accessibilityRole="button"
                        accessibilityHint="Returns to this centre's list of streams"
                    >
                        <Text style={styles.primaryButtonText}>
                            Choose Stream {chooseStream.stream}
                        </Text>
                    </TouchableOpacity>
                ) : retakeOnly ? null : (
                    <TouchableOpacity
                        style={[
                            styles.reviewAccept,
                            !canUsePhoto && styles.disabledButton,
                        ]}
                        onPress={onAccept}
                        disabled={!canUsePhoto}
                        accessibilityRole="button"
                        accessibilityState={{disabled: !canUsePhoto}}
                    >
                        <Check size={18} color={perk.limeInk} />
                        <Text style={styles.primaryButtonText}>Use this photo</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    reviewContainer: {
        flex: 1,
        paddingHorizontal: 12,
        paddingBottom: 12,
    },
    reviewImageFrame: {
        flex: 1,
        justifyContent: "center",
    },
    reviewImage: {
        width: "100%",
        borderRadius: 12,
        backgroundColor: perk.ink,
    },
    reviewPrompt: {
        fontSize: 13,
        fontWeight: "800",
        color: perk.ink,
        textAlign: "center",
        marginTop: 12,
    },
    streamNote: {
        fontSize: 12,
        fontWeight: "600",
        color: perk.mute,
        textAlign: "center",
        marginTop: 4,
    },
    reviewControls: {
        flexDirection: "row",
        gap: 8,
        marginTop: 10,
    },
    reviewRetake: {
        flex: 0.7,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: perk.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    reviewRetakeAlone: {flex: 1},
    reviewAccept: {
        flex: 1.3,
        flexDirection: "row",
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: perk.lime,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    secondaryButtonText: {
        color: perk.ink,
        fontSize: 13,
        fontWeight: "800",
    },
    primaryButtonText: {
        color: perk.limeInk,
        fontSize: 13,
        fontWeight: "800",
    },
    disabledButton: {
        backgroundColor: perk.paperDeep,
    },
});
