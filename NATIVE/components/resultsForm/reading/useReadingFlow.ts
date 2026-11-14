import {useState} from "react";

import {apiBaseURL} from "@/app/_utils/apiBaseURL";
import type {TLevelTabs} from "@/app/types";

import type {ReadingStep} from "../types";
import type {AgreementCheck, Reading} from "./prefill";
import {agreeAfterReading, startReading, useReading} from "./readPhoto";

/** Shown when there is no reading: the server could not be reached or failed. */
const NOT_READ = "The form could not be read. Type the results from the form.";
/** Shown when an agreeing photo has no outcome from the server. */
const NOT_CHECKED = "Your photo could not be checked.";

/**
 * The accepted photo's reading on the server, and what the person chose
 * after it: agree, disagree, continue past a changed form, or type anyway.
 */
export function useReadingFlow({
    userToken,
    stationCode,
    level,
    agreeWith,
    fillBoxes,
    clearBoxes,
    isCaptured,
}: {
    userToken: string | null;
    stationCode?: string;
    level: TLevelTabs;
    /** The earlier upload the person agrees with, from the parent. */
    agreeWith: string | null;
    /** Put a reading's figures in the boxes; returns the boxes left empty. */
    fillBoxes: (prefill: Reading["prefill"] | null) => string[];
    clearBoxes: () => void;
    /** Whether this is still the accepted photo, not retaken or closed. */
    isCaptured: (uri: string) => boolean;
}) {
    const [step, setStep] = useState<ReadingStep | null>(null);
    /** Tapped Disagree: later photos are read for typing, not compared. */
    const [disagreed, setDisagreed] = useState(false);
    /** Chose to agree once the reading showed an earlier upload's results. */
    const [agreedAfter, setAgreedAfter] = useState<string | null>(null);
    const [startingAgreement, setStartingAgreement] = useState(false);
    const agreeTarget = agreeWith ?? agreedAfter;
    const agreeing = !!agreeTarget && !disagreed;

    /** The boxes, prefilled from the reading or empty. */
    const fillFromReading = (reading: Reading | null, checkId: string | null) => {
        const read = reading?.status === "done";
        const unread = fillBoxes(read ? reading.prefill : null);
        setStep({
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

    /** Show the reading's outcome: retake, the agreement, or the boxes. */
    const finishReading = (
        reading: Reading | null,
        checkId: string | null,
        checks: AgreementCheck[] | null = reading?.checks ?? null,
    ) => {
        if (reading?.retake) {
            setStep({kind: "retake", message: reading.message ?? "Retake the photo."});
            return;
        }
        if (agreeing) {
            // An agreement is never saved unchecked.
            const checked = reading?.agreement === true && reading.status === "done";
            setStep({
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

    /** Send the accepted photo to be read; the boxes wait for the reading. */
    const readPhoto = async (uri: string) => {
        clearBoxes();
        setStep({kind: "reading", checkId: null, checks: null});
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
        if (!isCaptured(uri)) return;
        if (outcome.kind === "signed_out") return;
        if (outcome.kind === "not_allowed") {
            setStep({
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
                setStep({
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
            setStep({
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
    const pollingId = step?.kind === "reading" ? step.checkId : null;
    const {ended, latest} = useReading(userToken, pollingId);
    if (ended && pollingId) {
        // Given up: keep the lines as far as they got.
        const lastChecks =
            ended === "gave_up"
                ? (latest?.checks ?? (step?.kind === "reading" ? step.checks : null))
                : (ended.checks ?? null);
        finishReading(ended === "gave_up" ? null : ended, pollingId, lastChecks);
    }

    /** Keep the photo and type the results from it. */
    const disagree = () => {
        if (step?.kind !== "agreement") return;
        setDisagreed(true);
        fillFromReading(step.reading, step.checkId);
    };

    /** Agree with the earlier upload the reading matched, using this photo. */
    const agreeInstead = async () => {
        if (step?.kind !== "read" || !step.sameAs || !step.checkId) return;
        if (!userToken) return;
        const {checkId, sameAs} = step;
        setStartingAgreement(true);
        const outcome = await agreeAfterReading({token: userToken, checkId, reference: sameAs});
        setStartingAgreement(false);
        if (outcome.kind === "signed_out") return;
        setAgreedAfter(sameAs);
        if (outcome.kind !== "started") {
            setStep({
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
        setStep({kind: "reading", checkId, checks: outcome.reading.checks ?? null});
    };

    /** Go on to the results after seeing where the form looks changed. */
    const continueChanged = () => {
        if (step?.kind !== "read") return;
        setStep({...step, formChanged: null});
    };

    /** Type the results even though they match an earlier upload. */
    const typeAnyway = () => {
        if (step?.kind !== "read") return;
        setStep({...step, sameAs: null});
    };

    /** Forget the reading; the choices to agree or disagree are kept. */
    const clearStep = () => setStep(null);

    /** Forget the reading and the choices, for a form that is closing. */
    const close = () => {
        setStep(null);
        setDisagreed(false);
        setAgreedAfter(null);
    };

    return {
        step,
        agreeing,
        /** The checks as the server last answered while polling. */
        latestChecks: latest?.checks ?? null,
        startingAgreement,
        readPhoto,
        disagree,
        agreeInstead,
        continueChanged,
        typeAnyway,
        clearStep,
        close,
    };
}
