import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {Camera, Check, X} from "lucide-react-native";
import {CameraView, useCameraPermissions} from "expo-camera";
import React, {useState} from "react";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";

import {StatusBar} from "expo-status-bar";
import {perk} from "@/app/_utils/colors";

export interface Form34ACandidate {
    key: string;
    name: string;
    party?: string | null;
}

export interface Form34ASubmission {
    image: string;
    votes: Record<string, number>;
    rejectedVotes: number;
    disputedVotes: number;
    total: number;
}

interface Form34ACaptureFormProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    candidates: Form34ACandidate[];
    submitLabel?: string;
    onSubmit: (submission: Form34ASubmission) => void;
    /**
     * Extra gate beyond the built-in rule (a photo plus at least one vote).
     * Return false to keep the submit button disabled.
     */
    canSubmit?: (state: {
        votes: Record<string, number>;
        rejectedVotes: number;
        disputedVotes: number;
        hasImage: boolean;
    }) => boolean;
}

/**
 * Shared Form 34A capture + vote-entry sheet. Owns the camera, the per-candidate
 * vote inputs and the running total; the parent supplies the candidate list and
 * handles what happens on submit (API upload, counter-evidence check, ...).
 */
export function Form34ACaptureForm({
    visible,
    onClose,
    title,
    candidates,
    submitLabel = "Submit",
    onSubmit,
    canSubmit,
}: Form34ACaptureFormProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const [showCamera, setShowCamera] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [votes, setVotes] = useState<Record<string, number>>({});
    const [rejectedVotes, setRejectedVotes] = useState(0);
    const [disputedVotes, setDisputedVotes] = useState(0);
    const [wasVisible, setWasVisible] = useState(false);
    const cameraRef = React.useRef<CameraView>(null);

    // Reset the form each time the sheet opens (render-phase state adjustment).
    if (visible && !wasVisible) {
        setWasVisible(true);
        setVotes({});
        setRejectedVotes(0);
        setDisputedVotes(0);
        setCapturedImage(null);
        setShowCamera(false);
    } else if (!visible && wasVisible) {
        setWasVisible(false);
    }

    const getVote = (key: string) => votes[key] ?? 0;

    const setVote = (key: string, value: number) =>
        setVotes((prev) => ({...prev, [key]: value}));

    const total =
        Object.values(votes).reduce((sum, v) => sum + (v || 0), 0) +
        rejectedVotes +
        disputedVotes;

    const hasVotes = Object.values(votes).some((v) => v > 0);
    const extraGate = canSubmit
        ? canSubmit({votes, rejectedVotes, disputedVotes, hasImage: !!capturedImage})
        : true;
    const submitEnabled = !!capturedImage && hasVotes && extraGate;

    const takePicture = async () => {
        if (!cameraRef.current) return;
        try {
            const photo = await cameraRef.current.takePictureAsync();
            if (photo) {
                setCapturedImage(photo.uri);
                setShowCamera(false);
            }
        } catch {
            // Swallow: the capture button stays available for a retry.
        }
    };

    const parseCount = (text: string) => {
        const clean = text.replace(/[^0-9]/g, "");
        return clean === "" ? 0 : Number(clean);
    };

    if (!permission) {
        return null;
    }

    if (!permission.granted) {
        return (
            <Modal
                visible={visible}
                animationType="slide"
                transparent
                statusBarTranslucent
            >
                <StatusBar style="light" />
                <SafeAreaProvider>
                    <View style={styles.permissionOverlay}>
                        <SafeAreaView style={styles.permissionSafeArea}>
                            <View style={styles.permissionContainer}>
                                <View style={styles.permissionCard}>
                                    <Text style={styles.permissionText}>
                                        We need camera permission to capture Form 34A
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.permissionButton}
                                        onPress={requestPermission}
                                    >
                                        <Text style={styles.permissionButtonText}>
                                            Grant Permission
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.permissionCancelButton}
                                        onPress={onClose}
                                    >
                                        <Text style={styles.cancelButtonText}>
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

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            statusBarTranslucent={Platform.OS === "android"}
        >
            <StatusBar style="dark" />
            <SafeAreaProvider>
                <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={16} color={perk.ink} />
                        </TouchableOpacity>
                    </View>

                    {showCamera ? (
                        <View style={styles.cameraContainer}>
                            <CameraView
                                ref={cameraRef}
                                style={styles.camera}
                                facing="back"
                            />
                            <View style={styles.cameraControls}>
                                <TouchableOpacity
                                    style={styles.captureButton}
                                    onPress={takePicture}
                                >
                                    <Camera size={32} color={perk.limeInk} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.body}>
                            <ScrollView
                                style={styles.content}
                                contentContainerStyle={styles.contentInner}
                                showsVerticalScrollIndicator={false}
                            >
                                <Text style={styles.sectionLabel}>
                                    CAPTURE FORM 34A
                                </Text>
                                {capturedImage ? (
                                    <View style={styles.capturedRow}>
                                        <Text style={styles.capturedText}>
                                            ✓ Form 34A captured
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => setShowCamera(true)}
                                        >
                                            <Text style={styles.recaptureText}>
                                                Retake
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.cameraButton}
                                        onPress={() => setShowCamera(true)}
                                    >
                                        <Camera size={16} color={perk.lime} />
                                        <Text style={styles.cameraButtonText}>
                                            Capture Form 34A
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                <Text style={[styles.sectionLabel, {marginTop: 18}]}>
                                    ENTER VOTE DATA
                                </Text>
                                {candidates.map((candidate) => {
                                    const value = getVote(candidate.key);
                                    return (
                                        <View
                                            key={candidate.key}
                                            style={styles.voteRow}
                                        >
                                            <View style={styles.voteWho}>
                                                <Text
                                                    style={styles.voteName}
                                                    numberOfLines={1}
                                                >
                                                    {candidate.name}
                                                </Text>
                                                {!!candidate.party && (
                                                    <Text
                                                        style={styles.voteParty}
                                                        numberOfLines={1}
                                                    >
                                                        {candidate.party}
                                                    </Text>
                                                )}
                                            </View>
                                            <TextInput
                                                style={[
                                                    styles.vbox,
                                                    value > 0 && styles.vboxSet,
                                                ]}
                                                value={value === 0 ? "" : String(value)}
                                                onChangeText={(t) =>
                                                    setVote(
                                                        candidate.key,
                                                        parseCount(t),
                                                    )
                                                }
                                                placeholder="0"
                                                placeholderTextColor={perk.mute2}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    );
                                })}

                                <View style={styles.voteRow}>
                                    <View style={styles.voteWho}>
                                        <Text style={styles.voteName}>
                                            Rejected votes
                                        </Text>
                                    </View>
                                    <TextInput
                                        style={[
                                            styles.vbox,
                                            rejectedVotes > 0 && styles.vboxSet,
                                        ]}
                                        value={
                                            rejectedVotes === 0
                                                ? ""
                                                : String(rejectedVotes)
                                        }
                                        onChangeText={(t) =>
                                            setRejectedVotes(parseCount(t))
                                        }
                                        placeholder="0"
                                        placeholderTextColor={perk.mute2}
                                        keyboardType="numeric"
                                    />
                                </View>

                                <View style={styles.voteRow}>
                                    <View style={styles.voteWho}>
                                        <Text style={styles.voteName}>
                                            Disputed votes
                                        </Text>
                                    </View>
                                    <TextInput
                                        style={[
                                            styles.vbox,
                                            disputedVotes > 0 && styles.vboxSet,
                                        ]}
                                        value={
                                            disputedVotes === 0
                                                ? ""
                                                : String(disputedVotes)
                                        }
                                        onChangeText={(t) =>
                                            setDisputedVotes(parseCount(t))
                                        }
                                        placeholder="0"
                                        placeholderTextColor={perk.mute2}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </ScrollView>

                            {/* Floating footer sheet */}
                            <View style={styles.footer}>
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Total votes</Text>
                                    <Text style={styles.totalValue}>
                                        {total.toLocaleString()}
                                    </Text>
                                </View>
                                <View style={styles.footerButtons}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={onClose}
                                    >
                                        <Text style={styles.cancelButtonText}>
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.submitButton,
                                            !submitEnabled && styles.disabledButton,
                                        ]}
                                        disabled={!submitEnabled}
                                        onPress={() =>
                                            onSubmit({
                                                image: capturedImage as string,
                                                votes,
                                                rejectedVotes,
                                                disputedVotes,
                                                total,
                                            })
                                        }
                                    >
                                        <Check size={18} color={perk.limeInk} />
                                        <Text style={styles.submitButtonText}>
                                            {submitLabel}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </SafeAreaView>
            </SafeAreaProvider>
        </Modal>
    );
}

export default Form34ACaptureForm;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: perk.card,
    },
    // Permission
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
    // Header
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
    // Camera
    cameraContainer: {flex: 1},
    camera: {flex: 1},
    cameraControls: {
        position: "absolute",
        bottom: 50,
        left: 0,
        right: 0,
        alignItems: "center",
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: perk.lime,
        justifyContent: "center",
        alignItems: "center",
    },
    // Body
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
    voteRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: perk.rule08,
    },
    voteWho: {
        flex: 1,
        paddingRight: 12,
    },
    voteName: {
        fontSize: 12.5,
        fontWeight: "800",
        color: perk.ink,
    },
    voteParty: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 9,
        color: perk.mute,
        letterSpacing: 0.6,
        marginTop: 1,
        textTransform: "uppercase",
    },
    vbox: {
        width: 52,
        height: 34,
        borderWidth: 1.5,
        borderColor: perk.rule16,
        borderRadius: 9,
        paddingHorizontal: 4,
        fontFamily: "SpaceMono-Regular",
        fontSize: 12,
        fontWeight: "700",
        textAlign: "center",
        color: perk.mute2,
        backgroundColor: perk.card,
    },
    vboxSet: {
        borderColor: perk.ink,
        color: perk.ink,
    },
    // Floating footer
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
    cancelButtonText: {
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
    submitButtonText: {
        color: perk.limeInk,
        fontSize: 13,
        fontWeight: "800",
    },
    disabledButton: {
        backgroundColor: perk.paperDeep,
    },
});
