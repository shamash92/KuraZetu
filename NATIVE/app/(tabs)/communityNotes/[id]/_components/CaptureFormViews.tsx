import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {Camera as CameraIcon, Check} from "lucide-react-native";
import {
    NativeNitroImage,
    type Image as NitroImageHandle,
} from "react-native-nitro-image";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";

import {VoteCountRow} from "./VoteCountRow";
import {perk} from "@/app/_utils/colors";

interface CameraPermissionModalProps {
    actionLabel: string;
    error: string | null;
    message: string;
    visible: boolean;
    onClose: () => void;
    onRecover: () => void;
}

export function CameraPermissionModal({
    actionLabel,
    error,
    message,
    visible,
    onClose,
    onRecover,
}: CameraPermissionModalProps) {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            statusBarTranslucent
        >
            <SafeAreaProvider>
                <View style={styles.permissionOverlay}>
                    <SafeAreaView style={styles.permissionSafeArea}>
                        <View style={styles.permissionContainer}>
                            <View style={styles.permissionCard}>
                                <Text style={styles.permissionText}>{message}</Text>
                                {!!error && (
                                    <Text
                                        style={styles.permissionError}
                                        accessibilityRole="alert"
                                    >
                                        {error}
                                    </Text>
                                )}
                                <TouchableOpacity
                                    style={styles.permissionButton}
                                    onPress={onRecover}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.permissionButtonText}>
                                        {actionLabel}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.permissionCancelButton}
                                    onPress={onClose}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.secondaryButtonText}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </SafeAreaView>
                </View>
            </SafeAreaProvider>
        </Modal>
    );
}

interface PhotoReviewPaneProps {
    imageUri: string;
    preview: NitroImageHandle | null;
    previewAspect: number;
    onAccept: () => void;
    onRetake: () => void;
}

export function PhotoReviewPane({
    imageUri,
    preview,
    previewAspect,
    onAccept,
    onRetake,
}: PhotoReviewPaneProps) {
    const imageStyle = [styles.reviewImage, {aspectRatio: previewAspect}];

    return (
        <View style={styles.reviewContainer}>
            <View style={styles.reviewImageFrame}>
                {preview ? (
                    <NativeNitroImage
                        image={preview}
                        style={imageStyle}
                        resizeMode="contain"
                        accessible
                        accessibilityLabel="Captured Form 34A preview"
                    />
                ) : (
                    <Image
                        source={{uri: imageUri}}
                        style={imageStyle}
                        resizeMode="contain"
                        accessible
                        accessibilityLabel="Captured Form 34A preview"
                    />
                )}
            </View>
            <Text style={styles.reviewPrompt}>Can you read every vote number?</Text>
            <View style={styles.reviewControls}>
                <TouchableOpacity
                    style={styles.reviewRetake}
                    onPress={onRetake}
                    accessibilityRole="button"
                >
                    <Text style={styles.secondaryButtonText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.reviewAccept}
                    onPress={onAccept}
                    accessibilityRole="button"
                >
                    <Check size={18} color={perk.limeInk} />
                    <Text style={styles.primaryButtonText}>Use this photo</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

interface VoteCandidate {
    key: string;
    name: string;
    party?: string | null;
}

interface VoteEntryPaneProps {
    candidates: VoteCandidate[];
    captured: boolean;
    disputedVotes: number;
    rejectedVotes: number;
    submitEnabled: boolean;
    submitLabel: string;
    total: number;
    votes: Record<string, number>;
    onCapture: () => void;
    onClose: () => void;
    onDisputedVotesChange: (value: number) => void;
    onRejectedVotesChange: (value: number) => void;
    onSubmit: () => void;
    onVoteChange: (key: string, value: number) => void;
}

export function VoteEntryPane({
    candidates,
    captured,
    disputedVotes,
    rejectedVotes,
    submitEnabled,
    submitLabel,
    total,
    votes,
    onCapture,
    onClose,
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
            >
                <Text style={styles.sectionLabel}>CAPTURE FORM 34A</Text>
                {captured ? (
                    <View style={styles.capturedRow}>
                        <Text style={styles.capturedText}>✓ Form 34A captured</Text>
                        <TouchableOpacity
                            onPress={onCapture}
                            accessibilityRole="button"
                            accessibilityLabel="Retake Form 34A photo"
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
                        <Text style={styles.cameraButtonText}>Capture Form 34A</Text>
                    </TouchableOpacity>
                )}

                <Text style={[styles.sectionLabel, styles.voteSectionLabel]}>
                    ENTER VOTE DATA
                </Text>
                {candidates.map((candidate) => (
                    <VoteCountRow
                        key={candidate.key}
                        label={candidate.name}
                        party={candidate.party}
                        value={votes[candidate.key] ?? 0}
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
                <View style={styles.footerButtons}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onClose}
                        accessibilityRole="button"
                    >
                        <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            !submitEnabled && styles.disabledButton,
                        ]}
                        disabled={!submitEnabled}
                        accessibilityRole="button"
                        accessibilityState={{disabled: !submitEnabled}}
                        onPress={onSubmit}
                    >
                        <Check size={18} color={perk.limeInk} />
                        <Text style={styles.primaryButtonText}>{submitLabel}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    permissionOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(13,13,13,0.85)",
    },
    permissionSafeArea: {flex: 1},
    permissionContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 16,
    },
    permissionCard: {
        width: "100%",
        maxWidth: 400,
        backgroundColor: perk.card,
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
    },
    permissionText: {
        fontSize: 18,
        color: perk.ink,
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 24,
    },
    permissionError: {
        color: perk.coralDeep,
        fontSize: 13,
        fontWeight: "700",
        lineHeight: 18,
        marginTop: -12,
        marginBottom: 16,
        textAlign: "center",
    },
    permissionButton: {
        backgroundColor: perk.lime,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        marginBottom: 16,
        width: "100%",
        alignItems: "center",
    },
    permissionButtonText: {
        color: perk.limeInk,
        fontSize: 16,
        fontWeight: "800",
    },
    permissionCancelButton: {
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: perk.surface,
        alignItems: "center",
        width: "100%",
    },
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
    body: {flex: 1},
    content: {flex: 1},
    contentInner: {
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 16,
    },
    sectionLabel: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1.8,
        color: perk.mute,
        marginBottom: 10,
    },
    voteSectionLabel: {marginTop: 18},
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
        backgroundColor: perk.mint,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    capturedText: {
        fontSize: 13,
        color: perk.greenDeep,
        fontWeight: "800",
    },
    recaptureText: {
        color: perk.copperDeep,
        fontSize: 13,
        fontWeight: "800",
        textDecorationLine: "underline",
    },
    footer: {
        backgroundColor: perk.card,
        borderWidth: 1.5,
        borderColor: perk.ink,
        borderRadius: 16,
        marginHorizontal: 12,
        marginBottom: 12,
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 12,
        shadowColor: perk.ink,
        shadowOffset: {width: 0, height: 10},
        shadowOpacity: 0.12,
        shadowRadius: 18,
        elevation: 10,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: "800",
        color: perk.ink,
    },
    totalValue: {
        fontSize: 20,
        fontWeight: "900",
        color: perk.coralDeep,
    },
    footerButtons: {
        flexDirection: "row",
        gap: 8,
        marginTop: 10,
    },
    cancelButton: {
        flex: 0.7,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: perk.surface,
        alignItems: "center",
    },
    secondaryButtonText: {
        color: perk.ink,
        fontSize: 13,
        fontWeight: "800",
    },
    submitButton: {
        flex: 1.3,
        flexDirection: "row",
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: perk.lime,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
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
