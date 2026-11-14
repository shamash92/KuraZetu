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

import {LiveCameraPane} from "./camera/LiveCameraPane";
import {CameraPermissionModal} from "./camera/PermissionModal";
import {usePermissionRecovery} from "./camera/usePermissionRecovery";
import {usePhotoCapture} from "./camera/usePhotoCapture";
import {VoteEntryPane} from "./entry/VoteEntryPane";
import {type VoteEntryState, useVoteEntry} from "./entry/useVoteEntry";
import {STREAM_VOTER_LIMIT} from "./entry/voteCount";
import {RESULTS_FORMS} from "./resultsForms";
import type {AgreementCheck, Reading} from "./reading/prefill";
import {AgreementPane} from "./reading/AgreementPane";
import {PhotoStepPane} from "./reading/PhotoStepPane";
import {ReadingPane} from "./reading/ReadingPane";
import {agreeAfterReading, startReading, useReading} from "./reading/readPhoto";
import {ChangedFormPane} from "./reading/ChangedFormPane";
import {SameResultsPane} from "./reading/SameResultsPane";
import {PhotoReviewPane} from "./review/PhotoReviewPane";
import {CaptureTips} from "./tips/CaptureTips";
import {SubmitBlocked} from "./upload/SubmitBlocked";
import {useDeviceFix} from "./upload/useDeviceFix";
import {usePlaceCheck} from "./upload/usePlaceCheck";
import {apiBaseURL} from "@/app/_utils/apiBaseURL";
import {useAuthStore} from "@/app/_utils/auth/authStore";
import {useNetworkStatus} from "@/app/_utils/device/useNetworkStatus";
import {perk} from "@/app/_utils/colors";
import type {TLevelTabs} from "@/app/types";

import type {
    ReadingStep,
    ResultsFormAgreement,
    ResultsFormCandidate,
    ResultsFormPlace,
    ResultsFormSubmission,
} from "./types";

/** Shown when there is no reading: the server could not be reached or failed. */
const NOT_READ = "The form could not be read. Type the results from the form.";
/** Shown when an agreeing photo has no outcome from the server. */
const NOT_CHECKED = "Your photo could not be checked.";

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
    const permission = usePermissionRecovery();
    const capture = usePhotoCapture({visible, stationCode, level});
    const capturedImage = capture.capturedImage;
    const entry = useVoteEntry({
        candidates,
        maxVotes,
        hasImage: !!capturedImage,
        canSubmit,
    });
    const [wasVisible, setWasVisible] = useState(false);
    const [readingStep, setReadingStep] = useState<ReadingStep | null>(null);
    /** Tapped Disagree: later photos are read for typing, not compared. */
    const [disagreed, setDisagreed] = useState(false);
    /** Chose to agree once the reading showed an earlier upload's results. */
    const [agreedAfter, setAgreedAfter] = useState<string | null>(null);
    const [startingAgreement, setStartingAgreement] = useState(false);
    const agreeTarget = agreeWith ?? agreedAfter;
    const agreeing = !!agreeTarget && !disagreed;
    const {userToken} = useAuthStore();

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
        setReadingStep(null);
    } else if (!visible && wasVisible) {
        setWasVisible(false);
        setReadingStep(null);
    }

    const submitForm = () => {
        if (!capturedImage) return;

        placeCheck.sendWhereAllowed(() =>
            onSubmit({
                image: capturedImage,
                ...capture.capturedDetails(),
                votes: entry.counts,
                rejectedVotes: entry.rejected,
                disputedVotes: entry.disputed,
                total: entry.total,
                fix: location.fix,
                checkId: readingStep?.kind === "read" ? readingStep.checkId : null,
            }),
        );
    };

    const submitAgreement = () => {
        if (!capturedImage || readingStep?.kind !== "agreement") return;
        const {checkId} = readingStep;
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

    /** Keep the photo and type the results from it. */
    const disagree = () => {
        if (readingStep?.kind !== "agreement") return;
        setDisagreed(true);
        fillFromReading(readingStep.reading, readingStep.checkId);
    };

    /** Agree with the earlier upload the reading matched, using this photo. */
    const agreeInstead = async () => {
        if (readingStep?.kind !== "read" || !readingStep.sameAs || !readingStep.checkId) return;
        if (!userToken) return;
        const {checkId, sameAs} = readingStep;
        setStartingAgreement(true);
        const outcome = await agreeAfterReading({token: userToken, checkId, reference: sameAs});
        setStartingAgreement(false);
        if (outcome.kind === "signed_out") return;
        setAgreedAfter(sameAs);
        if (outcome.kind !== "started") {
            setReadingStep({
                kind: "agreement",
                checkId: null,
                agrees: false,
                message: (outcome.kind === "failed" && outcome.message) || NOT_CHECKED,
                reading: null,
                checks: null,
                markedPhoto: null,
            });
            return;
        }
        setReadingStep({kind: "reading", checkId, checks: outcome.reading.checks ?? null});
    };

    /** Go on to the results after seeing where the form looks changed. */
    const continueChanged = () => {
        if (readingStep?.kind !== "read") return;
        setReadingStep({...readingStep, formChanged: null});
    };

    /** Type the results even though they match an earlier upload. */
    const typeAnyway = () => {
        if (readingStep?.kind !== "read") return;
        setReadingStep({...readingStep, sameAs: null});
    };

    /** Show the reading's outcome: retake, the agreement, or the boxes. */
    const finishReading = (
        reading: Reading | null,
        checkId: string | null,
        checks: AgreementCheck[] | null = reading?.checks ?? null,
    ) => {
        if (reading?.retake) {
            setReadingStep({kind: "retake", message: reading.message ?? "Retake the photo."});
            return;
        }
        if (agreeing) {
            // An agreement is never saved unchecked.
            const checked = reading?.agreement === true && reading.status === "done";
            setReadingStep({
                kind: "agreement",
                checkId,
                agrees: checked && reading.outcome === "agrees",
                message: (checked && reading.message) || NOT_CHECKED,
                reading: reading?.status === "done" ? reading : null,
                checks,
                markedPhoto: reading?.marked_photo
                    ? `${apiBaseURL}${reading.marked_photo}`
                    : null,
            });
            return;
        }
        fillFromReading(reading, checkId);
    };

    /** The boxes, prefilled from the reading or empty. */
    const fillFromReading = (reading: Reading | null, checkId: string | null) => {
        const read = reading?.status === "done";
        const unread = entry.fill(read ? reading.prefill : null);
        setReadingStep({
            kind: "read",
            checkId,
            instruction: (read && reading.message) || NOT_READ,
            prefilled: read,
            // Without a reading every box is empty: no border marks them.
            unread: read ? unread : [],
            sameAs: read ? (reading.same_as ?? null) : null,
            formChanged:
                read && reading.form_changed
                    ? {
                          markedPhoto: reading.marked_photo
                              ? `${apiBaseURL}${reading.marked_photo}`
                              : null,
                      }
                    : null,
        });
    };

    /** Send the accepted photo to be read; the boxes wait for the reading. */
    const readPhoto = async (uri: string) => {
        entry.clear();
        setReadingStep({kind: "reading", checkId: null, checks: null});
        if (!userToken || !stationCode) {
            finishReading(null, null);
            return;
        }
        const outcome = await startReading({
            token: userToken,
            stationCode,
            race: level,
            image: uri,
            reference: agreeing ? agreeTarget : null,
        });
        // Retaken or closed while the photo was being sent.
        if (!capture.isCaptured(uri)) return;
        if (outcome.kind === "signed_out") return;
        if (outcome.kind === "not_allowed") {
            setReadingStep({
                kind: "read",
                checkId: null,
                instruction: null,
                prefilled: false,
                unread: [],
                sameAs: null,
                formChanged: null,
            });
            return;
        }
        if (outcome.kind === "failed") {
            if (agreeing && outcome.message) {
                // Refused before any check, e.g. the same photo again.
                setReadingStep({
                    kind: "agreement",
                    checkId: null,
                    agrees: false,
                    message: outcome.message,
                    reading: null,
                    checks: null,
                    markedPhoto: null,
                });
                return;
            }
            finishReading(null, null);
            return;
        }
        const {reading} = outcome;
        if (reading.status === "running") {
            setReadingStep({
                kind: "reading",
                checkId: reading.check_id,
                checks: reading.checks ?? null,
            });
        } else {
            finishReading(reading, reading.check_id);
        }
    };

    // Ask for the reading every 2 s. Once it has ended, show it (render-phase
    // state adjustment: the step leaves "reading", so this runs once).
    const pollingId = readingStep?.kind === "reading" ? readingStep.checkId : null;
    const {ended, latest} = useReading(userToken, pollingId);
    if (ended && pollingId) {
        // Given up: keep the lines as far as they got.
        const lastChecks =
            ended === "gave_up"
                ? (latest?.checks ??
                  (readingStep?.kind === "reading" ? readingStep.checks : null))
                : (ended.checks ?? null);
        finishReading(ended === "gave_up" ? null : ended, pollingId, lastChecks);
    }

    const acceptPendingPhoto = () => {
        const uri = capture.acceptPendingPhoto();
        if (!uri) return;
        if (readsPhoto) void readPhoto(uri);
        placeCheck.warnAfterCapture();
    };

    const closeForm = () => {
        setReadingStep(null);
        setDisagreed(false);
        setAgreedAfter(null);
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

                    {blockReason ? (
                        <SubmitBlocked reason={blockReason} onRetry={location.retry} />
                    ) : capture.pendingImage ? (
                        <PhotoReviewPane
                            formName={formName}
                            imageUri={capture.pendingImage}
                            preview={capture.pendingPreview}
                            previewAspect={capture.previewAspect}
                            streamCheck={capture.streamCheck}
                            canUsePhoto={capture.canUsePhoto}
                            onAccept={acceptPendingPhoto}
                            onRetake={capture.discardPendingPhoto}
                            onChooseStream={chooseStream}
                            onGoBack={closeForm}
                        />
                    ) : capture.showCamera ? (
                        <LiveCameraPane
                            active={visible && capture.showCamera}
                            aspect={capture.aspect}
                            cameraError={capture.cameraError}
                            light={capture.light}
                            onLightChange={capture.setLight}
                            captureError={capture.captureError}
                            device={capture.device}
                            frameOutput={capture.frameOutput}
                            photoOutput={capture.photoOutput}
                            previewAspect={capture.previewAspect}
                            view={capture.view}
                            onCameraError={capture.handleCameraError}
                            onCapture={capture.takePicture}
                            onClose={capture.closeCamera}
                            onRetry={capture.openCamera}
                            onToggleAspect={capture.toggleAspect}
                        />
                    ) : capture.tipStep !== null ? (
                        <CaptureTips
                            step={capture.tipStep}
                            onStepChange={capture.setTipStep}
                            onFinish={capture.finishTips}
                        />
                    ) : readsPhoto && !capturedImage ? (
                        <PhotoStepPane formName={formName} onCapture={capture.showTips} />
                    ) : readsPhoto &&
                      capturedImage &&
                      agreeing &&
                      readingStep?.kind === "reading" ? (
                        <AgreementPane
                            checks={latest?.checks ?? readingStep.checks}
                            checking
                        />
                    ) : readsPhoto &&
                      capturedImage &&
                      (readingStep?.kind === "reading" || readingStep?.kind === "retake") ? (
                        <ReadingPane
                            formName={formName}
                            imageUri={capturedImage}
                            sending={
                                readingStep.kind === "reading" && readingStep.checkId === null
                            }
                            retakeMessage={
                                readingStep.kind === "retake" ? readingStep.message : null
                            }
                            onRetake={capture.openCamera}
                        />
                    ) : readsPhoto && capturedImage && readingStep?.kind === "agreement" ? (
                        <AgreementPane
                            checks={readingStep.checks}
                            photo={
                                readingStep.markedPhoto && userToken
                                    ? {
                                          marked: readingStep.markedPhoto,
                                          plain: capturedImage,
                                          token: userToken,
                                      }
                                    : null
                            }
                            message={readingStep.message}
                            agrees={readingStep.agrees}
                            submitting={submitting}
                            onSubmit={submitAgreement}
                            onRetake={capture.openCamera}
                            onDisagree={disagree}
                        />
                    ) : readsPhoto &&
                      capturedImage &&
                      readingStep?.kind === "read" &&
                      readingStep.formChanged ? (
                        <ChangedFormPane
                            photo={
                                readingStep.formChanged.markedPhoto && userToken
                                    ? {
                                          marked: readingStep.formChanged.markedPhoto,
                                          plain: capturedImage,
                                          token: userToken,
                                      }
                                    : null
                            }
                            onContinue={continueChanged}
                            onCancel={closeForm}
                        />
                    ) : readsPhoto &&
                      capturedImage &&
                      readingStep?.kind === "read" &&
                      readingStep.sameAs ? (
                        <SameResultsPane
                            sending={startingAgreement}
                            onAgree={agreeInstead}
                            onType={typeAnyway}
                        />
                    ) : (
                        <VoteEntryPane
                            // A new reading starts the counts afresh.
                            key={readingStep?.kind === "read" ? readingStep.checkId : null}
                            candidates={candidates}
                            captured={!!capturedImage}
                            formName={formName}
                            instruction={readingStep?.kind === "read" ? readingStep.instruction : null}
                            unread={readingStep?.kind === "read" ? readingStep.unread : []}
                            steps={readsPhoto}
                            prefilled={readingStep?.kind === "read" && readingStep.prefilled}
                            tapsToSubmit={readsPhoto ? 3 : 1}
                            maxVotes={maxVotes}
                            disputedVotes={entry.disputedVotes}
                            rejectedVotes={entry.rejectedVotes}
                            submitEnabled={entry.submitEnabled}
                            submitLabel={submitLabel}
                            submitting={submitting}
                            total={entry.total}
                            votes={entry.votes}
                            onCapture={capture.showTips}
                            onDisputedVotesChange={entry.setDisputedVotes}
                            onRejectedVotesChange={entry.setRejectedVotes}
                            onSubmit={submitForm}
                            onVoteChange={entry.setVote}
                        />
                    )}
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
