import {BarChart, ListFilter, Map, User} from "lucide-react-native";
import {Platform, StyleSheet, View} from "react-native";

import {BlurView} from "expo-blur";
import {Tabs} from "expo-router";

const TabBarIcon = ({
    IconComponent,
    focused,
    color,
    size,
}: {
    IconComponent: React.ComponentType<{color: string; size: number}>;
    focused: boolean;
    color: string;
    size: number;
}) => {
    return (
        <View style={[styles.iconContainer, focused && styles.activeIcon]}>
            <IconComponent color={color} size={size} />
        </View>
    );
};

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    ...styles.tabBar,
                    ...(Platform.OS === "web" ? {} : {backgroundColor: "transparent"}),
                },
                tabBarBackground: () =>
                    Platform.OS !== "web" ? (
                        <BlurView
                            tint="light"
                            intensity={80}
                            style={StyleSheet.absoluteFill}
                        />
                    ) : null,
                tabBarActiveTintColor: "#1A2C4E",
                tabBarInactiveTintColor: "#8E8E93",
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Dashboard",
                    tabBarIcon: ({focused, color, size}) => (
                        <TabBarIcon
                            IconComponent={BarChart}
                            focused={focused}
                            color={color}
                            size={size}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="pollingCentersEdit"
                options={{
                    title: "Verify Centers",
                    tabBarIcon: ({focused, color, size}) => (
                        <TabBarIcon
                            IconComponent={Map}
                            focused={focused}
                            color={color}
                            size={size}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="communityNotes"
                options={{
                    title: "Notes",
                    tabBarIcon: ({focused, color, size}) => (
                        <TabBarIcon
                            IconComponent={User}
                            focused={focused}
                            color={color}
                            size={size}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="tabThree/index"
                options={{
                    title: "Profile",
                    tabBarIcon: ({focused, color, size}) => (
                        <TabBarIcon
                            IconComponent={ListFilter}
                            focused={focused}
                            color={color}
                            size={size}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        borderTopWidth: 0,
        elevation: 0,
        height: 90,
        paddingBottom: 25,
        paddingTop: 10,
    },
    tabLabel: {
        fontFamily: "Inter-Medium",
        fontSize: 11,
    },
    iconContainer: {
        alignItems: "center",
        justifyContent: "center",
        width: 42,
        height: 28,
        borderRadius: 14,
    },
    activeIcon: {
        backgroundColor: "#E9F0FF",
    },
});
