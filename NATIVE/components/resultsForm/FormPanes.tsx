import {LiveCameraPane} from "./camera/LiveCameraPane";
import type {usePhotoCapture} from "./camera/usePhotoCapture";
import {VoteEntryPane} from "./entry/VoteEntryPane";
import type {useVoteEntry} from "./entry/useVoteEntry";
import {AgreementPane} from "./reading/AgreementPane";
import {ChangedFormPane} from "./reading/ChangedFormPane";
import {PhotoStepPane} from "./reading/PhotoStepPane";
import {ReadingPane} from "./reading/ReadingPane";
import {SameResultsPane} from "./reading/SameResultsPane";
import type {useReadingFlow} from "./reading/useReadingFlow";
import {PhotoReviewPane} from "./review/PhotoReviewPane";
import {CaptureTips} from "./tips/CaptureTips";
import type {ResultsFormCandidate} from "./types";
import {SubmitBlocked} from "./upload/SubmitBlocked";

/** The screen below the header: one per step of the form. */
export function FormPanes({
    visible,
    formName,
    readsPhoto,
    userToken,
    candidates,
    maxVotes,
    submitLabel,
    submitting,
    blockReason,
    capture,
    reading,
    entry,
    onRetryLocation,
    onAcceptPhoto,
    onChooseStream,
    onClose,
    onSubmit,
    onSubmitAgreement,
}: {
    visible: boolean;
    formName: string;
    readsPhoto: boolean;
    userToken: string | null;
    candidates: ResultsFormCandidate[];
    maxVotes: number;
    submitLabel: string;
    submitting: boolean;
    blockReason: "offline" | "location" | null;
    capture: ReturnType<typeof usePhotoCapture>;
    reading: ReturnType<typeof useReadingFlow>;
    entry: ReturnType<typeof useVoteEntry>;
    onRetryLocation: () => void;
    onAcceptPhoto: () => void;
    onChooseStream?: () => void;
    onClose: () => void;
    onSubmit: () => void;
    onSubmitAgreement: () => void;
}) {
    const {capturedImage} = capture;
    const step = reading.step;

    /** The person's photo and the server's copy with arrows, when there is one. */
    const markedPhoto = (marked: string | null) =>
        marked && capturedImage && userToken
            ? {marked, plain: capturedImage, token: userToken}
            : null;

    if (blockReason) {
        return <SubmitBlocked reason={blockReason} onRetry={onRetryLocation} />;
    }
    if (capture.pendingImage) {
        return (
            <PhotoReviewPane
                formName={formName}
                imageUri={capture.pendingImage}
                preview={capture.pendingPreview}
                previewAspect={capture.previewAspect}
                streamCheck={capture.streamCheck}
                canUsePhoto={capture.canUsePhoto}
                onAccept={onAcceptPhoto}
                onRetake={capture.discardPendingPhoto}
                onChooseStream={onChooseStream}
                onGoBack={onClose}
            />
        );
    }
    if (capture.showCamera) {
        return (
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
        );
    }
    if (capture.tipStep !== null) {
        return (
            <CaptureTips
                step={capture.tipStep}
                onStepChange={capture.setTipStep}
                onFinish={capture.finishTips}
            />
        );
    }
    if (readsPhoto && !capturedImage) {
        return <PhotoStepPane formName={formName} onCapture={capture.showTips} />;
    }
    if (readsPhoto && capturedImage) {
        if (reading.agreeing && step?.kind === "reading") {
            return <AgreementPane checks={reading.latestChecks ?? step.checks} checking />;
        }
        if (step?.kind === "reading" || step?.kind === "retake") {
            return (
                <ReadingPane
                    formName={formName}
                    imageUri={capturedImage}
                    sending={step.kind === "reading" && step.checkId === null}
                    retakeMessage={step.kind === "retake" ? step.message : null}
                    onRetake={capture.openCamera}
                />
            );
        }
        if (step?.kind === "agreement") {
            return (
                <AgreementPane
                    checks={step.checks}
                    photo={markedPhoto(step.markedPhoto)}
                    message={step.message}
                    agrees={step.agrees}
                    submitting={submitting}
                    onSubmit={onSubmitAgreement}
                    onRetake={capture.openCamera}
                    onDisagree={reading.disagree}
                />
            );
        }
        if (step?.kind === "read" && step.formChanged) {
            return (
                <ChangedFormPane
                    photo={markedPhoto(step.formChanged.markedPhoto)}
                    onContinue={reading.continueChanged}
                    onCancel={onClose}
                />
            );
        }
        if (step?.kind === "read" && step.sameAs) {
            return (
                <SameResultsPane
                    sending={reading.startingAgreement}
                    onAgree={reading.agreeInstead}
                    onType={reading.typeAnyway}
                />
            );
        }
    }
    const read = step?.kind === "read" ? step : null;
    return (
        <VoteEntryPane
            // A new reading starts the counts afresh.
            key={read ? read.checkId : null}
            candidates={candidates}
            captured={!!capturedImage}
            formName={formName}
            instruction={read ? read.instruction : null}
            unread={read ? read.unread : []}
            steps={readsPhoto}
            prefilled={!!read && read.prefilled}
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
            onSubmit={onSubmit}
            onVoteChange={entry.setVote}
        />
    );
}
