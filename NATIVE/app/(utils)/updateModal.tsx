import * as Updates from "expo-updates";

import {Modal, Platform, Pressable, StyleSheet, Text, View} from "react-native";
import React, {useEffect, useState} from "react";

import {MaterialIcons} from "@expo/vector-icons";

// Optional: Maasai-inspired accent colors
const colors = {
    primary: "#B22222", // Maasai red
    background: "#FFF8F0", // Soft warm tone
    text: "#2F2F2F",
    button: "#DC143C",
};

export default function UpdateCheckerModal() {
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        async function checkForUpdate() {
            // Only check for updates in production
            if (__DEV__) {
                return;
            }
            try {
                const update = await Updates.checkForUpdateAsync();
                if (update.isAvailable) {
                    setShowModal(true);
                }
            } catch (e) {
                console.log("Error checking for updates:", e);
            }
        }

        checkForUpdate();
    }, []);

    const handleReload = async () => {
        setShowModal(false);
        try {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
        } catch (e) {
            console.log("Error reloading app:", e);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent
            visible={showModal}
            onRequestClose={() => setShowModal(false)}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <MaterialIcons name="update" size={40} color={colors.primary} />
                    <Text style={styles.title}>Update Available</Text>
                    <Text style={styles.message}>
                        A new version of the app is available. Tap below to update now.
                    </Text>
                    <Pressable style={styles.button} onPress={handleReload}>
                        <Text style={styles.buttonText}>Update Now</Text>
                    </Pressable>
                    <Pressable
                        style={{marginTop: 10}}
                        onPress={() => setShowModal(false)}
                    >
                        <Text style={styles.dismiss}>Not now</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        width: "85%",
        backgroundColor: colors.background,
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
        elevation: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginTop: 12,
        color: colors.text,
    },
    message: {
        fontSize: 16,
        marginTop: 10,
        textAlign: "center",
        color: colors.text,
    },
    button: {
        marginTop: 20,
        backgroundColor: colors.button,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    dismiss: {
        fontSize: 14,
        color: colors.primary,
        textDecorationLine: "underline",
    },
});
