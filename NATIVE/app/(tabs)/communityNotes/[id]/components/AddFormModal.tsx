import {
    Alert,
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
import React, {useEffect, useRef, useState} from "react";

import {SafeAreaView} from "react-native-safe-area-context";
import {StatusBar} from "expo-status-bar";
import {TLevelTabs} from "@/app/types";
import {apiBaseURL} from "@/app/(utils)/apiBaseURL";
import useAuthStore from "@/app/(utils)/authStore";
import {useLocalSearchParams} from "expo-router";

export interface IAspirant {
    constituency: null | string;
    county: null | string;
    first_name: string;
    id: number;
    is_verified: boolean;
    last_name: string;
    level: string;
    party: string;
    party_color: string;
    passport_photo: null | string;
    surname: null | string;
    verified_by_party: boolean;
    ward: null | string;
}

interface AddFormModalProps {
    visible: boolean;
    onClose: () => void;
    level: TLevelTabs;
}

interface IAspirantVotes {
    id: number;
    votes: number;
}

export function AddFormModal({visible, onClose, level}: AddFormModalProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const [showCamera, setShowCamera] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [candidates, setCandidates] = useState<IAspirant[]>([]);
    const [candidateVotes, setCandidateVotes] = useState<IAspirantVotes[]>([]);
    const [rejectedVotes, setRejectedVotes] = useState<number>(0);
    const [disputedVotes, setDisputedVotes] = useState<number>(0);
    const cameraRef = useRef<CameraView>(null);

    const {userToken} = useAuthStore();

    const {id} = useLocalSearchParams();
    // console.log(id, "id in AddFormModal");

    React.useEffect(() => {
        if (visible) {
            // Reset form when modal opens
            setCandidateVotes([]);
            setRejectedVotes(0);
            setDisputedVotes(0);
            setCapturedImage(null);
            setShowCamera(false);
        }
    }, [visible]);

    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                const response = await fetch(
                    `${apiBaseURL}/api/results/polling-station/aspirants/${id}/${level}/`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Token ${userToken}`,
                        },
                        method: "GET",
                    },
                );
                const data = await response.json();
                // console.log(data, "aspirants data in AddFormModal");
                if (data && data.data) {
                    const candidates = data.data;
                    setCandidates(candidates);
                    const initialVotes: IAspirantVotes[] = [];
                    candidates.map((candidate: IAspirant) => {
                        initialVotes.push({id: candidate.id, votes: 0});
                    });
                    setCandidateVotes(initialVotes);
                }
            } catch (error) {
                console.error("Error fetching candidates:", error);
            }
        };
        fetchCandidates();
    }, [visible, id, level, userToken]); // Added dependencies

    // function to return boolean if none of the candidates have votes
    const hasVotesValidate = () => {
        return candidateVotes.some((candidate) => candidate.votes > 0);
    };

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
        const candidateTotal = candidateVotes.reduce(
            (total, candidate) => total + (candidate.votes || 0),
            0,
        );
        const rejected = rejectedVotes || 0;
        const disputed = disputedVotes || 0;
        return candidateTotal + rejected + disputed;
    };

    const handleSubmit = () => {
        if (!capturedImage) {
            Alert.alert("Error", "Please capture a Form 34A image first");
            return;
        }

        let data = {
            polling_station: id,
            level: level,
            image: capturedImage,
            votes: candidateVotes,
            rejected_votes: rejectedVotes,
            disputed_votes: disputedVotes,
        };

        Alert.alert(
            "Submit Results",
            "Are you sure you want to submit these results?",
            [
                {text: "Cancel", style: "cancel"},
                {
                    text: "Submit",
                    onPress: () => {
                        console.log("Submitting results:", data);

                        let formData = new FormData();
                        formData.append(
                            "data",
                            JSON.stringify({
                                polling_station: id,
                                level: level,
                                image: capturedImage,
                                votes: candidateVotes,
                                rejected_votes: rejectedVotes,
                                disputed_votes: disputedVotes,
                            }),
                        );

                        formData.append("image", {
                            uri: capturedImage,
                            type: "image/jpeg",
                            name: "form34a.jpg",
                        });

                        console.log(formData, "formData in AddFormModal");

                        fetch(
                            `${apiBaseURL}/api/results/polling-station/create/${id}/${level}/`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "multipart/form-data",
                                    Authorization: `Token ${userToken}`,

                                    Accept: "application/json",
                                },
                                body: formData,
                            },
                        )
                            .then((response) => {
                                if (!response.ok) {
                                    throw new Error("Failed to submit results");
                                }
                                return response.json();
                            })
                            .then((data) => {
                                console.log("server data in AddFormModal :", data);
                                Alert.alert(
                                    "Success",
                                    "Results submitted successfully",
                                );
                                onClose();
                            })
                            .catch((error) => {
                                console.error("Error submitting results:", error);
                                Alert.alert("Error", "Failed to submit results");
                            });
                    },
                },
            ],
        );
    };

    const updateCandidateVotes = (id: number, votes: number) => {
        console.log("\n");
        console.log("updateCandidateVotes called with id:", id, "votes:", votes);
        setCandidateVotes((prevVotes) => {
            const updatedVotes = prevVotes.map((candidate) => {
                if (candidate.id === id) {
                    return {...candidate, votes: votes};
                }
                return candidate;
            });
            console.log(updatedVotes, "updatedCandidateVotes");
            return updatedVotes;
        });
    };

    const getVoteValue = (id: number) => {
        const found = candidateVotes.find((c) => c.id === id);
        return found ? found.votes : 0;
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
                    <Text style={styles.title}>Submit Results</Text>
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
                            <Text style={styles.sectionTitle}>Enter Vote data</Text>

                            {candidates.map((candidate) => {
                                const voteValue = getVoteValue(candidate.id);
                                return (
                                    <View
                                        key={candidate.id}
                                        style={styles.candidateRow}
                                    >
                                        <View style={styles.candidateInfo}>
                                            <Text style={styles.candidateName}>
                                                {candidate.first_name}{" "}
                                                {candidate.last_name}
                                            </Text>
                                            <Text style={styles.candidateParty}>
                                                {candidate.party}
                                            </Text>
                                        </View>
                                        <TextInput
                                            style={styles.voteInput}
                                            value={
                                                voteValue === 0 ? "" : String(voteValue)
                                            }
                                            onChangeText={(text) => {
                                                const cleanText = text.replace(
                                                    /[^0-9]/g,
                                                    "",
                                                );
                                                const numValue =
                                                    cleanText === ""
                                                        ? 0
                                                        : Number(cleanText);
                                                updateCandidateVotes(
                                                    candidate.id,
                                                    numValue,
                                                );
                                            }}
                                            placeholder="0"
                                            keyboardType="numeric"
                                        />
                                    </View>
                                );
                            })}

                            <View style={styles.candidateRow}>
                                <View style={styles.candidateInfo}>
                                    <Text style={styles.candidateName}>
                                        Rejected Votes
                                    </Text>
                                </View>
                                <TextInput
                                    style={styles.voteInput}
                                    value={
                                        rejectedVotes === 0 ? "" : String(rejectedVotes)
                                    }
                                    onChangeText={(text) => {
                                        const cleanText = text.replace(/[^0-9]/g, "");
                                        const numValue =
                                            cleanText === "" ? 0 : Number(cleanText);
                                        setRejectedVotes(numValue);
                                    }}
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
                                    value={
                                        disputedVotes === 0 ? "" : String(disputedVotes)
                                    }
                                    onChangeText={(text) => {
                                        const cleanText = text.replace(/[^0-9]/g, "");
                                        const numValue =
                                            cleanText === "" ? 0 : Number(cleanText);
                                        setDisputedVotes(numValue);
                                    }}
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
                                    (!capturedImage || !hasVotesValidate()) &&
                                        styles.disabledButton,
                                ]}
                                onPress={handleSubmit}
                                disabled={!capturedImage || !hasVotesValidate()}
                            >
                                <Check size={20} color="#FFFFFF" />
                                <Text style={styles.submitButtonText}>
                                    Submit{" "}
                                    {hasVotesValidate() && capturedImage ? "✓" : "✗"}
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
