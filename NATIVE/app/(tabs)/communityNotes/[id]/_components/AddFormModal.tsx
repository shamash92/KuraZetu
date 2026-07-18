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
import {fetch} from "expo/fetch";
import {File} from "expo-file-system";
import React, {useEffect, useRef, useState} from "react";

import {SafeAreaView} from "react-native-safe-area-context";
import {StatusBar} from "expo-status-bar";
import {TLevelTabs} from "@/app/types";
import {apiBaseURL} from "@/app/_utils/apiBaseURL";
import {perk} from "@/app/_utils/colors";
import useAuthStore from "@/app/_utils/authStore";
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

                        // Expo's current FormData implementation accepts Blob-compatible
                        // values. The legacy React Native {uri, type, name} object causes
                        // "Unsupported FormDataPart implementation" on the simulator.
                        formData.append("image", new File(capturedImage));

                        console.log(formData, "formData in AddFormModal");

                        fetch(
                            `${apiBaseURL}/api/results/polling-station/create/${id}/${level}/`,
                            {
                                method: "POST",
                                headers: {
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
                    <Text style={styles.title}>Submit results</Text>
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
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>
                                    CAPTURE FORM 34A
                                </Text>
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
                                        <Camera size={16} color={perk.lime} />
                                        <Text style={styles.cameraButtonText}>
                                            Capture Form 34A
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>ENTER VOTE DATA</Text>

                                {candidates.map((candidate) => {
                                    const voteValue = getVoteValue(candidate.id);
                                    return (
                                        <View key={candidate.id} style={styles.voteRow}>
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
                                                style={[
                                                    styles.vbox,
                                                    voteValue > 0 && styles.vboxSet,
                                                ]}
                                                value={
                                                    voteValue === 0
                                                        ? ""
                                                        : String(voteValue)
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
                                                placeholderTextColor={perk.mute2}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    );
                                })}

                                <View style={styles.voteRow}>
                                    <View style={styles.candidateInfo}>
                                        <Text style={styles.candidateName}>
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
                                        onChangeText={(text) => {
                                            const cleanText = text.replace(
                                                /[^0-9]/g,
                                                "",
                                            );
                                            const numValue =
                                                cleanText === ""
                                                    ? 0
                                                    : Number(cleanText);
                                            setRejectedVotes(numValue);
                                        }}
                                        placeholder="0"
                                        placeholderTextColor={perk.mute2}
                                        keyboardType="numeric"
                                    />
                                </View>

                                <View style={styles.voteRow}>
                                    <View style={styles.candidateInfo}>
                                        <Text style={styles.candidateName}>
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
                                        onChangeText={(text) => {
                                            const cleanText = text.replace(
                                                /[^0-9]/g,
                                                "",
                                            );
                                            const numValue =
                                                cleanText === ""
                                                    ? 0
                                                    : Number(cleanText);
                                            setDisputedVotes(numValue);
                                        }}
                                        placeholder="0"
                                        placeholderTextColor={perk.mute2}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.stickyFooter}>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Total votes</Text>
                                <Text style={styles.totalValue}>
                                    {calculateTotal().toLocaleString()}
                                </Text>
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
                                    <Check size={18} color={perk.limeInk} />
                                    <Text style={styles.submitButtonText}>Submit</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </SafeAreaView>
        </Modal>
    );
}

export default AddFormModal;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: perk.card,
    },
    // Permission modal styles
    permissionOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(13,13,13,0.85)",
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
        backgroundColor: perk.card,
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
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: perk.surface,
        alignItems: "center",
        width: "100%",
    },
    // Sheet
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
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
        backgroundColor: perk.lime,
        justifyContent: "center",
        alignItems: "center",
    },
    body: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 16,
        paddingVertical: 12,
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
    capturedImageContainer: {
        alignItems: "center",
        gap: 8,
    },
    capturedText: {
        fontSize: 14,
        color: perk.greenDeep,
        fontWeight: "700",
    },
    recaptureButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    recaptureText: {
        color: perk.copperDeep,
        fontSize: 13,
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
    candidateInfo: {
        flex: 1,
    },
    candidateName: {
        fontSize: 12,
        fontWeight: "800",
        color: perk.ink,
    },
    candidateParty: {
        fontFamily: "SpaceMono-Regular",
        fontSize: 9,
        color: perk.mute,
        letterSpacing: 0.6,
        marginTop: 1,
        textTransform: "uppercase",
    },
    vbox: {
        width: 50,
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
    stickyFooter: {
        backgroundColor: perk.card,
        borderTopWidth: 1.5,
        borderTopColor: perk.ink,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 14,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: -8},
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 8,
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
    buttonContainer: {
        flexDirection: "row",
        gap: 8,
        marginTop: 12,
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
