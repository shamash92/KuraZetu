import {
    TriangleAlert as AlertTriangle,
    File as FileEdit,
    Map,
    MapPin,
} from "lucide-react-native";
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from "react-native";

import {StatusBar} from "expo-status-bar";
import {useRouter} from "expo-router";

export default function PollingCentersLanding() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.header}>
                <Text style={styles.title}>Verify Polling Centers </Text>
                <Text style={styles.subtitle}>Help improve election data accuracy</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                    style={[styles.card, {backgroundColor: "#EFF6FF"}]}
                    onPress={() =>
                        router.navigate("/pollingCentersEdit/PollingCentersNearMe")
                    }
                >
                    <View style={[styles.iconContainer, {backgroundColor: "#DBEAFE"}]}>
                        <MapPin size={24} color="#3B82F6" />
                    </View>
                    <Text style={styles.cardTitle}>Update Centers Near Me</Text>
                    <Text style={styles.cardDescription}>
                        Verify and update polling center locations around your current
                        position
                    </Text>
                    <View style={[styles.badge, {backgroundColor: "#BFDBFE"}]}>
                        <Text style={[styles.badgeText, {color: "#1D4ED8"}]}>
                            High Priority
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.card, {backgroundColor: "#F0FDF4"}]}
                    onPress={() => router.push("/locations")}
                >
                    <View style={[styles.iconContainer, {backgroundColor: "#DCFCE7"}]}>
                        <Map size={24} color="#22C55E" />
                    </View>
                    <Text style={styles.cardTitle}>Map Missing Centers</Text>
                    <Text style={styles.cardDescription}>
                        Add locations for polling centers without pins in your ward
                    </Text>
                    <View style={[styles.badge, {backgroundColor: "#BBF7D0"}]}>
                        <Text style={[styles.badgeText, {color: "#15803D"}]}>
                            Ward Focus
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.card, {backgroundColor: "#FEF3C7"}]}
                    onPress={() => router.push("/locations")}
                >
                    <View style={[styles.iconContainer, {backgroundColor: "#FDE68A"}]}>
                        <FileEdit size={24} color="#D97706" />
                    </View>
                    <Text style={styles.cardTitle}>Update Center Info</Text>
                    <Text style={styles.cardDescription}>
                        Edit details like number of streams and registered voters
                    </Text>
                    <View style={[styles.badge, {backgroundColor: "#FCD34D"}]}>
                        <Text style={[styles.badgeText, {color: "#92400E"}]}>
                            Data Update
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.card, {backgroundColor: "#FEE2E2"}]}
                    onPress={() => router.push("/locations")}
                >
                    <View style={[styles.iconContainer, {backgroundColor: "#FECACA"}]}>
                        <AlertTriangle size={24} color="#DC2626" />
                    </View>
                    <Text style={styles.cardTitle}>Report Missing Station</Text>
                    <Text style={styles.cardDescription}>
                        Report polling stations that are missing from the system
                    </Text>
                    <View style={[styles.badge, {backgroundColor: "#FCA5A5"}]}>
                        <Text style={[styles.badgeText, {color: "#991B1B"}]}>
                            Report Issue
                        </Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 24,
        backgroundColor: "#FFFFFF",
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#1E293B",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#64748B",
        fontWeight: "500",
    },
    content: {
        flex: 1,
        padding: 16,
    },
    card: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1E293B",
        marginBottom: 8,
    },
    cardDescription: {
        fontSize: 14,
        color: "#64748B",
        lineHeight: 20,
        marginBottom: 16,
    },
    badge: {
        alignSelf: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "600",
    },
});
