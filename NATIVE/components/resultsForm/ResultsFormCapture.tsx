import {
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {X} from "lucide-react-native";
import {useState} from "react";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";

import {FormPanes} from "./FormPanes";
import {CameraPermissionModal} from "./camera/PermissionModal";
import {usePermissionRecovery} from "./camera/usePermissionRecovery";
import {usePhotoCapture} from "./camera/usePhotoCapture";
import {type VoteEntryState, useVoteEntry} from "./entry/useVoteEntry";
import {STREAM_VOTER_LIMIT} from "./entry/voteCount";
import {RESULTS_FORMS} from "./resultsForms";
import {useReadingFlow} from "./reading/useReadingFlow";
import {useDeviceFix} from "./upload/useDeviceFix";
import {usePlaceCheck} from "./upload/usePlaceCheck";
import {useAuthStore} from "@/app/_utils/auth/authStore";
import {useNetworkStatus} from "@/app/_utils/device/useNetworkStatus";
import {perk} from "@/app/_utils/colors";
import type {TLevelTabs} from "@/app/types";

import type {
    ResultsFormAgreement,
    ResultsFormCandidate,
    ResultsFormPlace,
    ResultsFormSubmission,
} from "./types";

interface ResultsFormCaptureProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    candidates: ResultsFormCandidate[];
    /** The race being captured; each has its own form and QR series. */
    level: TLevelTabs;
    /**
     * Code of the polling station (stream) selected before capture. When set,
     * each photo's QR is checked against it before the photo can be used.
     */
    stationCode?: string;
    /**
     * Return to the centre's list of streams, offered when the photo's QR
     * names another stream at the same centre.
     */
    onChooseStream?: () => void;
    /** Checks where the phone is after capture and at Submit, when given. */
    place?: ResultsFormPlace;
    /** The most votes the form can add up to; Submit is blocked above it. */
    maxVotes?: number;
    /**
     * Read the photo on the server before entry and prefill the boxes. Needs
     * stationCode.
     */
    readsPhoto?: boolean;
    /**
     * The earlier upload the person agrees with. The photo is compared with
     * it and read in full; nothing is typed unless the person disagrees.
     * Needs readsPhoto.
     */
    agreeWith?: string | null;
    /** Save the agreement. Needed with agreeWith. */
    onAgree?: (agreement: ResultsFormAgreement) => void;
    submitLabel?: string;
    /** The parent is uploading: Submit shows progress and ignores taps. */
    submitting?: boolean;
    onSubmit: (submission: ResultsFormSubmission) => void;
    /**
     * Extra gate beyond the built-in rule (a photo plus all three digits
     * typed in every box).
     * Return false to keep the submit button disabled.
     */
    canSubmit?: (state: VoteEntryState) => boolean;
}

/**
 * Shared results form capture + vote-entry sheet, for any level. Owns the
 * camera, the per-candidate vote inputs and the running total; the parent
 * supplies the candidate list and handles what happens on submit (API upload,
 * counter-evidence check, ...).
 */
export function ResultsFormCapture({
    visible,
    onClose,
    title,
    candidates,
    level,
    stationCode,
    onChooseStream,
    place,
    maxVotes = STREAM_VOTER_LIMIT,
    readsPhoto = false,
    agreeWith = null,
    onAgree,
    submitLabel = "Submit",
    submitting = false,
    onSubmit,
    canSubmit,
}: ResultsFormCaptureProps) {
    const formName = RESULTS_FORMS[level].name;
    const {userToken} = useAuthStore();
    const permission = usePermissionRecovery();
    const capture = usePhotoCapture({visible, stationCode, level});
    const capturedImage = capture.capturedImage;
    const entry = useVoteEntry({
        candidates,
        maxVotes,
        hasImage: !!capturedImage,
        canSubmit,
    });
    const reading = useReadingFlow({
        userToken,
        stationCode,
        level,
        agreeWith,
        fillBoxes: entry.fill,
        clearBoxes: entry.clear,
        isCaptured: capture.isCaptured,
    });
    const [wasVisible, setWasVisible] = useState(false);

    // Uploads need internet and the phone's location; locating starts as the
    // screen opens so an indoor phone has time to get a precise fix.
    const network = useNetworkStatus();
    const location = useDeviceFix(visible);
    const placeCheck = usePlaceCheck(place, location.fix);
    const blockReason =
        network === "offline"
            ? "offline"
            : location.permission === "denied"
              ? "location"
              : null;

    // Reset the form each time the sheet opens (render-phase state adjustment).
    if (visible && !wasVisible) {
        setWasVisible(true);
        entry.clear();
        capture.reset();
        permission.reset();
        placeCheck.reset();
        reading.clearStep();
    } else if (!visible && wasVisible) {
        setWasVisible(false);
        reading.clearStep();
    }

    const submitForm = () => {
        if (!capturedImage) return;
        const step = reading.step;

        placeCheck.sendWhereAllowed(() =>
            onSubmit({
                image: capturedImage,
                ...capture.capturedDetails(),
                votes: entry.counts,
                rejectedVotes: entry.rejected,
                disputedVotes: entry.disputed,
                total: entry.total,
                fix: location.fix,
                checkId: step?.kind === "read" ? step.checkId : null,
            }),
        );
    };

    const submitAgreement = () => {
        const step = reading.step;
        if (!capturedImage || step?.kind !== "agreement") return;
        const {checkId} = step;
        if (!checkId || !onAgree) return;

        placeCheck.sendWhereAllowed(() =>
            onAgree({
                image: capturedImage,
                ...capture.capturedDetails(),
                fix: location.fix,
                checkId,
            }),
        );
    };

    const acceptPhoto = () => {
        const uri = capture.acceptPendingPhoto();
        if (!uri) return;
        if (readsPhoto) void reading.readPhoto(uri);
        placeCheck.warnAfterCapture();
    };

    const closeForm = () => {
        reading.close();
        capture.release();
        onClose();
    };

    // The photo belongs to another stream: leave this form so the citizen can
    // pick the right stream from the centre's list.
    const chooseStream = onChooseStream
        ? () => {
              closeForm();
              onChooseStream();
          }
        : undefined;

    if (!permission.hasPermission) {
        return (
            <CameraPermissionModal
                visible={visible}
                actionLabel={permission.recovery.buttonLabel}
                error={permission.error}
                message={permission.recovery.message}
                onClose={closeForm}
                onRecover={permission.recover}
            />
        );
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            statusBarTranslucent={Platform.OS === "android"}
            onRequestClose={capture.goBack ?? closeForm}
        >
            <SafeAreaProvider>
                <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
                    <View style={styles.header}>
                        <Text style={styles.title} accessibilityRole="header">
                            {title}
                        </Text>
                        <TouchableOpacity
                            onPress={closeForm}
                            style={styles.closeButton}
                            accessibilityRole="button"
                            accessibilityLabel="Close form"
                            hitSlop={7}
                        >
                            <X size={16} color={perk.ink} />
                        </TouchableOpacity>
                    </View>

                    <FormPanes
                        visible={visible}
                        formName={formName}
                        readsPhoto={readsPhoto}
                        userToken={userToken}
                        candidates={candidates}
                        maxVotes={maxVotes}
                        submitLabel={submitLabel}
                        submitting={submitting}
                        blockReason={blockReason}
                        capture={capture}
                        reading={reading}
                        entry={entry}
                        onRetryLocation={location.retry}
                        onAcceptPhoto={acceptPhoto}
                        onChooseStream={chooseStream}
                        onClose={closeForm}
                        onSubmit={submitForm}
                        onSubmitAgreement={submitAgreement}
                    />
                </SafeAreaView>
            </SafeAreaProvider>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: perk.card,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: perk.card,
    },
    title: {
        fontSize: 19,
        fontWeight: "900",
        letterSpacing: -0.4,
        color: perk.ink,
    },
    closeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: perk.surface,
        alignItems: "center",
        justifyContent: "center",
    },
});
