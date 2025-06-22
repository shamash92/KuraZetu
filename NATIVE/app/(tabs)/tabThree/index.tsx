import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    AlertCircle,
    Bell,
    DatabaseIcon,
    LogOut,
    Moon,
    User2,
} from "lucide-react-native";
import {NEUTRAL, PRIMARY} from "../../(utils)/colors";
import React, {useState} from "react";

import {deleteFromSecureStore} from "@/app/(utils)/secureStore";
import {router} from "expo-router";
import useAuthStore from "@/app/(utils)/authStore";

interface SettingItemProps {
    icon: React.ReactNode;
    title: string;
    description?: string;
    titleColor?: string | null;
    bgColor?: string | null;
    toggle?: boolean;
    toggleValue?: boolean;
    onToggle?: (value: boolean) => void;
    onPress?: () => void;
}

const SettingItem = ({
    icon,
    title,

    description,
    titleColor,
    toggle,
    toggleValue,
    onToggle,
    onPress,
    bgColor,
}: SettingItemProps) => (
    <TouchableOpacity
        style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            backgroundColor: bgColor || "white",
        }}
        onPress={onPress}
        activeOpacity={onPress ? 0.5 : 1}
    >
        <View style={styles.settingIcon}>{icon}</View>
        <View style={styles.settingContent}>
            <Text
                style={{
                    fontFamily: "Inter-Medium",
                    fontSize: 16,
                    color: titleColor || NEUTRAL[500],
                    marginBottom: 2,
                }}
            >
                {title}
            </Text>
            {description && (
                <Text
                    style={{
                        fontFamily: "Inter-Regular",
                        fontSize: 13,
                    }}
                >
                    {description}
                </Text>
            )}
        </View>
        {toggle && (
            <Switch
                value={toggleValue}
                onValueChange={onToggle}
                trackColor={{false: NEUTRAL[300], true: PRIMARY[400]}}
                thumbColor="white"
            />
        )}
    </TouchableOpacity>
);

export default function ProfileScreen() {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);
    const [locationEnabled, setLocationEnabled] = useState(true);

    const {logOut} = useAuthStore();

    const handleLogout = async () => {
        try {
            logOut();

            await deleteFromSecureStore("userToken");

            router.replace("/auth/login");
        } catch (error) {
            console.error("Logout failed:", error);
            Alert.alert("Error", "Failed to log out. Please try again.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Profile</Text>
                <Text style={styles.subtitle}>Customize your experience</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>

                    <View style={styles.card}>
                        <SettingItem
                            icon={<Bell size={22} color={PRIMARY[600]} />}
                            title="Push Notifications"
                            description="Receive alerts about important election updates"
                            toggle
                            toggleValue={notificationsEnabled}
                            onToggle={setNotificationsEnabled}
                        />

                        <View style={styles.divider} />

                        <SettingItem
                            icon={<Moon size={22} color={PRIMARY[600]} />}
                            title="Dark Mode"
                            description="Switch to dark theme"
                            toggle
                            toggleValue={darkModeEnabled}
                            onToggle={setDarkModeEnabled}
                        />

                        <View style={styles.divider} />

                        <SettingItem
                            icon={<AlertCircle size={22} color={PRIMARY[600]} />}
                            title="Location-Based Results"
                            description="See results for your local elections"
                            toggle
                            toggleValue={locationEnabled}
                            onToggle={setLocationEnabled}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>

                    <View style={styles.card}>
                        <SettingItem
                            icon={<User2 size={22} color={PRIMARY[600]} />}
                            title="Account Settings"
                            description="Manage your account information"
                            onPress={() => console.log("Navigate to account settings")}
                        />

                        <View style={styles.divider} />

                        <SettingItem
                            icon={<DatabaseIcon size={22} color={PRIMARY[600]} />}
                            title="Saved Election Data"
                            description="View your data storage settings"
                            onPress={() =>
                                console.log("Navigate to data storage settings")
                            }
                        />
                        <View style={styles.divider} />

                        <SettingItem
                            icon={<LogOut size={22} color={PRIMARY[600]} />}
                            title="Sign out of your account"
                            // description="Sign out of your account"
                            titleColor="white"
                            bgColor="#E55050"
                            onPress={() => handleLogout()}
                        />
                    </View>
                </View>

                <View style={styles.appInfo}>
                    <Text style={styles.version}>Kura Zetu v0.1.0</Text>
                    <Text style={styles.copyright}>
                        © 2025 Kura Zetu. All rights reserved.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    header: {
        padding: 16,
        marginBottom: 8,
    },
    title: {
        fontFamily: "Inter-SemiBold",
        fontSize: 30,
        color: PRIMARY[700],
        marginBottom: 4,
    },
    subtitle: {
        fontFamily: "Inter-Regular",
        fontSize: 16,
        color: NEUTRAL[600],
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontFamily: "Inter-SemiBold",
        fontSize: 18,
        color: NEUTRAL[800],
        marginBottom: 12,
        marginLeft: 4,
    },
    card: {
        backgroundColor: "white",
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    settingItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: PRIMARY[50],
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontFamily: "Inter-Medium",
        fontSize: 16,
        color: NEUTRAL[800],
        marginBottom: 2,
    },
    settingDescription: {
        fontFamily: "Inter-Regular",
        fontSize: 13,
        color: NEUTRAL[500],
    },
    divider: {
        height: 1,
        backgroundColor: NEUTRAL[200],
        marginHorizontal: 16,
    },
    appInfo: {
        marginTop: 24,
        alignItems: "center",
        paddingBottom: 16,
    },
    version: {
        fontFamily: "Inter-Medium",
        fontSize: 14,
        color: NEUTRAL[600],
        marginBottom: 4,
    },
    copyright: {
        fontFamily: "Inter-Regular",
        fontSize: 12,
        color: NEUTRAL[500],
    },
});
