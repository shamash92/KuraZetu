import React, {useEffect, useRef, useState} from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {Camera as CameraIcon, Check, TriangleAlert} from "lucide-react-native";

import {DISPUTED, REJECTED} from "../reading/prefill";
import {StepBar} from "../reading/StepBar";
import {ELECTION_YEAR, REGISTER_YEAR} from "./register";
import {toCount} from "./voteCount";
import {VoteCountRow} from "./VoteCountRow";
import {perk} from "@/app/_utils/colors";

/** Taps between which Submit resets to the first tap. */
const TAP_RESET_MS = 4000;

interface VoteCandidate {
    key: string;
    name: string;
    party?: string | null;
}

interface VoteEntryPaneProps {
    candidates: VoteCandidate[];
    captured: boolean;
    /** The results form being captured, e.g. "Form 37A". */
    formName: string;
    /** What the photo's reading asks of the person, above the counts. */
    instruction?: string | null;
    /** Show the three steps: the photo was read before entry. */
    steps?: boolean;
    /**
     * The counts came from the reading: each shows as a figure with an edit
     * button, and only the boxes in `unread` open for typing.
     */
    prefilled?: boolean;
    /** Boxes the reading left empty: candidate keys, "rejected", "disputed". */
    unread?: string[];
    /** Taps that send the upload; more than one stops a stray tap. */
    tapsToSubmit?: number;
    /** The most votes the form can add up to. */
    maxVotes: number;
    /** Digits typed per box, at most three. */
    disputedVotes: string;
    rejectedVotes: string;
    submitEnabled: boolean;
    submitLabel: string;
    /** The upload is in flight: the button shows progress and ignores taps. */
    submitting: boolean;
    /** Every box added up, for the station's limit. */
    total: number;
    votes: Record<string, string>;
    onCapture: () => void;
    onDisputedVotesChange: (digits: string) => void;
    onRejectedVotesChange: (digits: string) => void;
    onSubmit: () => void;
    onVoteChange: (key: string, digits: string) => void;
}

function tapLabel(left: number, taps: number, submitLabel: string): string {
    if (taps === 1) return submitLabel;
    if (left === taps) return `Tap ${taps} times to submit`;
    if (left === 1) return "Tap once more to submit";
    return `Tap ${left} more times`;
}

export function VoteEntryPane({
    candidates,
    captured,
    formName,
    instruction = null,
    steps = false,
    prefilled = false,
    unread = [],
    tapsToSubmit = 1,
    maxVotes,
    disputedVotes,
    rejectedVotes,
    submitEnabled,
    submitLabel,
    submitting,
    total,
    votes,
    onCapture,
    onDisputedVotesChange,
    onRejectedVotesChange,
    onSubmit,
    onVoteChange,
}: VoteEntryPaneProps) {
    const tooMany = (digits: string) => toCount(digits) > maxVotes;
    const overLimit = total > maxVotes;
    // As on the form: the candidates' votes only.
    const validVotes = candidates.reduce(
        (sum, {key}) => sum + toCount(votes[key] ?? ""),
        0,
    );

    // Prefilled counts open one at a time; without a reading, every box is open.
    const [opened, setOpened] = useState<Set<string>>(() => new Set(unread));
    const isEditing = (key: string) => !prefilled || opened.has(key);
    const edit = (key: string) => setOpened((keys) => new Set(keys).add(key));
    const editedByTap = (key: string) => prefilled && !unread.includes(key);

    const [tapsLeft, setTapsLeft] = useState(tapsToSubmit);
    const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => clearTimeout(resetTimer.current ?? undefined), []);
    const tapSubmit = () => {
        clearTimeout(resetTimer.current ?? undefined);
        if (tapsLeft > 1) {
            setTapsLeft(tapsLeft - 1);
            resetTimer.current = setTimeout(() => setTapsLeft(tapsToSubmit), TAP_RESET_MS);
            return;
        }
        setTapsLeft(tapsToSubmit);
        onSubmit();
    };

    const countRow = (
        key: string,
        label: string,
        value: string,
        onChange: (digits: string) => void,
        party?: string | null,
    ) => (
        <VoteCountRow
            key={key}
            label={label}
            party={party}
            value={value}
            tooMany={tooMany(value)}
            unread={unread.includes(key)}
            editing={isEditing(key)}
            autoFocus={editedByTap(key)}
            onEdit={() => edit(key)}
            accessibilityLabel={party === undefined ? label : `Votes for ${label}`}
            onChange={onChange}
        />
    );

    return (
        <View style={styles.body}>
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentInner}
                showsVerticalScrollIndicator={false}
                // Tens of candidates: keep the box being typed in above the keyboard.
                automaticallyAdjustKeyboardInsets
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
            >
                {steps && (
                    <View style={styles.steps}>
                        <StepBar step={3} />
                    </View>
                )}
                {captured ? (
                    <View style={styles.capturedRow}>
                        <Text style={styles.capturedText}>✓ {formName} captured</Text>
                        <TouchableOpacity
                            onPress={onCapture}
                            accessibilityRole="button"
                            accessibilityLabel={`Retake ${formName} photo`}
                            hitSlop={8}
                        >
                            <Text style={styles.recaptureText}>Retake</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.cameraButton}
                        onPress={onCapture}
                        accessibilityRole="button"
                    >
                        <CameraIcon size={16} color={perk.lime} />
                        <Text style={styles.cameraButtonText}>Capture {formName}</Text>
                    </TouchableOpacity>
                )}

                {!!instruction && (
                    <View style={styles.warning} accessibilityRole="alert">
                        <TriangleAlert size={22} color={perk.coralDeep} />
                        <Text style={styles.warningText}>{instruction}</Text>
                    </View>
                )}
                {REGISTER_YEAR !== ELECTION_YEAR && (
                    <Text style={styles.registerNotice}>
                        {ELECTION_YEAR} voter numbers not loaded yet
                    </Text>
                )}

                {candidates.map((candidate) =>
                    countRow(
                        candidate.key,
                        candidate.name,
                        votes[candidate.key] ?? "",
                        (value) => onVoteChange(candidate.key, value),
                        candidate.party ?? null,
                    ),
                )}

                <View style={styles.otherCounts}>
                    {countRow(REJECTED, "Rejected votes", rejectedVotes, onRejectedVotesChange)}
                    {countRow(DISPUTED, "Disputed votes", disputedVotes, onDisputedVotesChange)}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total valid votes cast</Text>
                    <Text style={[styles.totalValue, overLimit && styles.overLimit]}>
                        {validVotes.toLocaleString()}
                    </Text>
                </View>
                {overLimit && (
                    <Text style={styles.limitText} accessibilityRole="alert">
                        The counts add up to {total.toLocaleString()}, above{" "}
                        {maxVotes.toLocaleString()}, the most voters this station can
                        have. Check the counts against the form.
                    </Text>
                )}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        !submitEnabled && styles.submitDisabled,
                        submitEnabled && tapsLeft < tapsToSubmit && styles.submitArmed,
                    ]}
                    disabled={!submitEnabled || submitting}
                    accessibilityRole="button"
                    accessibilityState={{disabled: !submitEnabled, busy: submitting}}
                    onPress={tapSubmit}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color={perk.limeInk} />
                    ) : (
                        <Check size={18} color={submitEnabled ? perk.limeInk : perk.mute} />
                    )}
                    <Text
                        style={[
                            styles.submitText,
                            !submitEnabled && styles.submitTextDisabled,
                        ]}
                    >
                        {submitting
                            ? "Uploading…"
                            : tapLabel(tapsLeft, tapsToSubmit, submitLabel)}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    body: {flex: 1},
    content: {flex: 1},
    contentInner: {
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 16,
    },
    steps: {
        marginBottom: 16,
    },
    warning: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        backgroundColor: perk.coral,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginTop: 12,
        marginBottom: 4,
    },
    warningText: {
        flex: 1,
        fontSize: 16,
        lineHeight: 22,
        fontWeight: "800",
        color: perk.ink,
    },
    registerNotice: {
        fontSize: 13,
        color: perk.mute,
        backgroundColor: perk.surface,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginTop: 8,
        marginBottom: 12,
    },
    // Rejected and disputed are counts about the ballots, not a candidate's.
    otherCounts: {
        marginTop: 20,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: perk.paper,
    },
    cameraButton: {
        flexDirection: "row",
        backgroundColor: perk.ink,
        paddingVertical: 13,
        paddingHorizontal: 24,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    cameraButtonText: {
        color: perk.lime,
        fontSize: 13,
        fontWeight: "800",
    },
    capturedRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: perk.ink,
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    capturedText: {
        fontSize: 13,
        color: perk.paper,
        fontWeight: "800",
    },
    // Retake is the action on this strip, so it carries the lime.
    recaptureText: {
        color: perk.lime,
        fontSize: 13,
        fontWeight: "800",
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: perk.rule08,
        backgroundColor: perk.paper,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
        gap: 12,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: perk.ink,
    },
    totalValue: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 24,
        color: perk.ink,
        fontVariant: ["tabular-nums"],
    },
    overLimit: {
        color: perk.coralDeep,
    },
    limitText: {
        marginTop: -4,
        fontSize: 13,
        lineHeight: 18,
        color: perk.coralDeep,
    },
    submitButton: {
        flexDirection: "row",
        paddingVertical: 16,
        borderRadius: 999,
        backgroundColor: perk.lime,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    // Counting down: the next tap is closer to sending.
    submitArmed: {
        backgroundColor: perk.limeDeep,
    },
    submitDisabled: {
        backgroundColor: perk.surface,
    },
    submitText: {
        color: perk.limeInk,
        fontSize: 15,
        fontWeight: "700",
    },
    submitTextDisabled: {
        color: perk.mute,
    },
});
