import {Modal, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";

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
            onRequestClose={onClose}
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
    secondaryButtonText: {
        color: perk.ink,
        fontSize: 13,
        fontWeight: "800",
    },
});
