import {
    Alert,
    Dimensions,
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
import {CameraType, CameraView, useCameraPermissions} from "expo-camera";
import React, {useRef, useState} from "react";

import {SafeAreaView} from "react-native-safe-area-context";
import {StatusBar} from "expo-status-bar";

interface Candidate {
    name: string;
    party: string;
    votes: number;
}

interface ElectionData {
    pollingStation: string;
    pollingStationCode: string;
    ward: string;
    constituency: string;
    county: string;
    form34AImage: string;
    candidates: Candidate[];
    totalValidVotes: number;
    rejectedVotes: number;
    disputedVotes: number;
    totalVotesCast: number;
    registeredVoters: number;
}

interface CounterEvidenceModalProps {
    visible: boolean;
    onClose: () => void;
    originalResults: ElectionData;
}

export function CounterEvidenceModal({
    visible,
    onClose,
    originalResults,
}: CounterEvidenceModalProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const [showCamera, setShowCamera] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [candidateVotes, setCandidateVotes] = useState<{
        [key: string]: string;
    }>({});
    const [rejectedVotes, setRejectedVotes] = useState("");
    const [disputedVotes, setDisputedVotes] = useState("");
    const cameraRef = useRef<CameraView>(null);

    React.useEffect(() => {
        if (visible) {
            // Reset form when modal opens
            setCandidateVotes({});
            setRejectedVotes("");
            setDisputedVotes("");
            setCapturedImage(null);
            setShowCamera(false);
        }
    }, [visible]);

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync();
                if (photo) {
                    setCapturedImage(photo.uri);
                    setShowCamera(false);
                }
            } catch (error) {
                Alert.alert("Error", "Failed to take picture");
            }
        }
    };

    const calculateTotal = () => {
        const candidateTotal = Object.values(candidateVotes).reduce(
            (sum, votes) => sum + (parseInt(votes) || 0),
            0,
        );
        const rejected = parseInt(rejectedVotes) || 0;
        const disputed = parseInt(disputedVotes) || 0;
        return candidateTotal + rejected + disputed;
    };

    const areResultsIdentical = () => {
        // Check if all candidate votes match
        for (const candidate of originalResults.candidates) {
            const inputVotes = parseInt(candidateVotes[candidate.name]) || 0;
            if (inputVotes !== candidate.votes) {
                return false;
            }
        }

        // Check rejected and disputed votes
        const inputRejected = parseInt(rejectedVotes) || 0;
        const inputDisputed = parseInt(disputedVotes) || 0;

        if (
            inputRejected !== originalResults.rejectedVotes ||
            inputDisputed !== originalResults.disputedVotes
        ) {
            return false;
        }

        return true;
    };

    const handleSubmit = () => {
        if (!capturedImage) {
            Alert.alert("Error", "Please capture a Form 34A image first");
            return;
        }

        if (areResultsIdentical()) {
            Alert.alert(
                "Results Match",
                "Your submitted results match the original submission. No counter-evidence needed.",
            );
            return;
        }

        Alert.alert(
            "Submit Counter-Evidence",
            "Are you sure you want to submit this counter-evidence?",
            [
                {text: "Cancel", style: "cancel"},
                {
                    text: "Submit",
                    onPress: () => {
                        // Handle submission logic here
                        Alert.alert(
                            "Success",
                            "Counter-evidence submitted successfully",
                        );
                        onClose();
                    },
                },
            ],
        );
    };

    if (!permission) {
        return null;
    }

    if (!permission.granted) {
        return (
            <Modal
                visible={visible}
                animationType="slide"
                transparent={true}
                statusBarTranslucent={true}
            >
                <StatusBar style="light" />
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
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </SafeAreaView>
                </View>
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
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Submit Counter-Evidence</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} color="#000000" />
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
                                <Camera size={32} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <ScrollView style={styles.content}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Capture Form 34A</Text>
                            {capturedImage ? (
                                <View style={styles.capturedImageContainer}>
                                    <Text style={styles.capturedText}>
                                        ✓ Form 34A Captured
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.recaptureButton}
                                        onPress={() => setShowCamera(true)}
                                    >
                                        <Text style={styles.recaptureText}>
                                            Retake Photo
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.cameraButton}
                                    onPress={() => setShowCamera(true)}
                                >
                                    <Camera size={24} color="#FFFFFF" />
                                    <Text style={styles.cameraButtonText}>
                                        Capture Form 34A
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Enter Vote Counts</Text>

                            {originalResults.candidates.map((candidate, index) => (
                                <View key={index} style={styles.candidateRow}>
                                    <View style={styles.candidateInfo}>
                                        <Text style={styles.candidateName}>
                                            {candidate.name}
                                        </Text>
                                        <Text style={styles.candidateParty}>
                                            {candidate.party}
                                        </Text>
                                    </View>
                                    <TextInput
                                        style={styles.voteInput}
                                        value={candidateVotes[candidate.name] || ""}
                                        onChangeText={(text) =>
                                            setCandidateVotes((prev) => ({
                                                ...prev,
                                                [candidate.name]: text.replace(
                                                    /[^0-9]/g,
                                                    "",
                                                ),
                                            }))
                                        }
                                        placeholder="0"
                                        keyboardType="numeric"
                                    />
                                </View>
                            ))}

                            <View style={styles.candidateRow}>
                                <View style={styles.candidateInfo}>
                                    <Text style={styles.candidateName}>
                                        Rejected Votes
                                    </Text>
                                </View>
                                <TextInput
                                    style={styles.voteInput}
                                    value={rejectedVotes}
                                    onChangeText={(text) =>
                                        setRejectedVotes(text.replace(/[^0-9]/g, ""))
                                    }
                                    placeholder="0"
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.candidateRow}>
                                <View style={styles.candidateInfo}>
                                    <Text style={styles.candidateName}>
                                        Disputed Votes
                                    </Text>
                                </View>
                                <TextInput
                                    style={styles.voteInput}
                                    value={disputedVotes}
                                    onChangeText={(text) =>
                                        setDisputedVotes(text.replace(/[^0-9]/g, ""))
                                    }
                                    placeholder="0"
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Total Votes:</Text>
                                <Text style={styles.totalValue}>
                                    {calculateTotal().toLocaleString()}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={onClose}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.submitButton,
                                    (!capturedImage || areResultsIdentical()) &&
                                        styles.disabledButton,
                                ]}
                                onPress={handleSubmit}
                                disabled={!capturedImage || areResultsIdentical()}
                            >
                                <Check size={20} color="#FFFFFF" />
                                <Text style={styles.submitButtonText}>
                                    {areResultsIdentical()
                                        ? "Results Match Original"
                                        : "Submit"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                )}
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    // Permission modal styles - Fixed for Android
    permissionOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,255,0.85)",
    },
    permissionSafeArea: {
        flex: 1,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 16,
    },
    permissionCard: {
        width: "100%",
        maxWidth: 400,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    permissionText: {
        fontSize: 18,
        color: "#000000",
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 24,
    },
    permissionButton: {
        backgroundColor: "#DC143C",
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 8,
        marginBottom: 16,
        width: "100%",
        alignItems: "center",
    },
    permissionButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    permissionCancelButton: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: "#F5F5F5",
        alignItems: "center",
        width: "100%",
    },
    // Rest of the existing styles
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
        backgroundColor: "#FFFFFF",
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#000000",
    },
    closeButton: {
        padding: 8,
    },
    cameraContainer: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
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
        backgroundColor: "#DC143C",
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        flex: 1,
    },
    section: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#000000",
        marginBottom: 16,
    },
    cameraButton: {
        flexDirection: "row",
        backgroundColor: "#DC143C",
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    cameraButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    capturedImageContainer: {
        alignItems: "center",
        gap: 8,
    },
    capturedText: {
        fontSize: 16,
        color: "#006600",
        fontWeight: "600",
    },
    recaptureButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    recaptureText: {
        color: "#DC143C",
        fontSize: 14,
        textDecorationLine: "underline",
    },
    candidateRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    candidateInfo: {
        flex: 1,
    },
    candidateName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000000",
    },
    candidateParty: {
        fontSize: 14,
        color: "#666666",
        marginTop: 2,
    },
    voteInput: {
        width: 80,
        height: 40,
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 6,
        paddingHorizontal: 12,
        fontSize: 16,
        textAlign: "center",
        backgroundColor: "#FFFFFF",
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 16,
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#E0E0E0",
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#000000",
    },
    totalValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#DC143C",
    },
    buttonContainer: {
        flexDirection: "row",
        padding: 16,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 8,
        backgroundColor: "#F5F5F5",
        alignItems: "center",
    },
    cancelButtonText: {
        color: "#666666",
        fontSize: 16,
        fontWeight: "600",
    },
    submitButton: {
        flex: 2,
        flexDirection: "row",
        paddingVertical: 16,
        borderRadius: 8,
        backgroundColor: "#006600",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    submitButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    disabledButton: {
        backgroundColor: "#CCCCCC",
    },
});
