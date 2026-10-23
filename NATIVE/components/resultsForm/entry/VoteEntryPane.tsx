import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {Camera as CameraIcon, Check} from "lucide-react-native";

import {ELECTION_YEAR, REGISTER_YEAR} from "./register";
import {VoteCountRow} from "./VoteCountRow";
import {perk} from "@/app/_utils/colors";

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
    /** Digits typed per box, at most three. */
    disputedVotes: string;
    rejectedVotes: string;
    submitEnabled: boolean;
    submitLabel: string;
    total: number;
    votes: Record<string, string>;
    onCapture: () => void;
    onDisputedVotesChange: (digits: string) => void;
    onRejectedVotesChange: (digits: string) => void;
    onSubmit: () => void;
    onVoteChange: (key: string, digits: string) => void;
}

export function VoteEntryPane({
    candidates,
    captured,
    formName,
    disputedVotes,
    rejectedVotes,
    submitEnabled,
    submitLabel,
    total,
    votes,
    onCapture,
    onDisputedVotesChange,
    onRejectedVotesChange,
    onSubmit,
    onVoteChange,
}: VoteEntryPaneProps) {
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

                {REGISTER_YEAR !== ELECTION_YEAR && (
                    <Text style={styles.registerNotice}>
                        {ELECTION_YEAR} voter numbers not loaded yet
                    </Text>
                )}
                {candidates.map((candidate) => (
                    <VoteCountRow
                        key={candidate.key}
                        label={candidate.name}
                        party={candidate.party}
                        value={votes[candidate.key] ?? ""}
                        accessibilityLabel={`Votes for ${candidate.name}`}
                        onChange={(value) => onVoteChange(candidate.key, value)}
                    />
                ))}

                <VoteCountRow
                    label="Rejected votes"
                    value={rejectedVotes}
                    accessibilityLabel="Rejected votes"
                    onChange={onRejectedVotesChange}
                />
                <VoteCountRow
                    label="Disputed votes"
                    value={disputedVotes}
                    accessibilityLabel="Disputed votes"
                    onChange={onDisputedVotesChange}
                />
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total votes</Text>
                    <Text style={styles.totalValue}>{total.toLocaleString()}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.submitButton, !submitEnabled && styles.submitDisabled]}
                    disabled={!submitEnabled}
                    accessibilityRole="button"
                    accessibilityState={{disabled: !submitEnabled}}
                    onPress={onSubmit}
                >
                    <Check size={18} color={submitEnabled ? perk.limeInk : perk.mute} />
                    <Text
                        style={[
                            styles.submitText,
                            !submitEnabled && styles.submitTextDisabled,
                        ]}
                    >
                        {submitLabel}
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
        paddingTop: 12,
        paddingBottom: 16,
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
    submitButton: {
        flexDirection: "row",
        paddingVertical: 16,
        borderRadius: 999,
        backgroundColor: perk.lime,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
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
