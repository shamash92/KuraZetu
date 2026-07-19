import {NativeTabs} from "expo-router/unstable-native-tabs";
import {DynamicColorIOS, Platform} from "react-native";

const tabTintColor =
    Platform.OS === "ios"
        ? DynamicColorIOS({
              light: "#1A2C4E",
              dark: "#E9F0FF",
          })
        : "#1A2C4E";

const tabLabelColor =
    Platform.OS === "ios"
        ? DynamicColorIOS({
              light: "#1A2C4E",
              dark: "#FFFFFF",
          })
        : "#1A2C4E";

export default function TabLayout() {
    return (
        <NativeTabs
            tintColor={tabTintColor}
            labelStyle={{
                color: tabLabelColor,
                fontFamily: "Inter-Medium",
                fontSize: 10,
            }}
            indicatorColor="#E9F0FF"
            labelVisibilityMode="labeled"
            tabBarRespectsIMEInsets
            minimizeBehavior="onScrollDown"
        >
            <NativeTabs.Trigger name="index">
                <NativeTabs.Trigger.Icon
                    sf={{default: "chart.bar.xaxis", selected: "chart.bar.xaxis"}}
                    md="bar_chart"
                />
                <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="pollingCentersEdit">
                <NativeTabs.Trigger.Icon
                    sf={{default: "person", selected: "person.fill"}}
                    md="person"
                />
                <NativeTabs.Trigger.Label>Verify</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="communityNotes">
                <NativeTabs.Trigger.Icon
                    sf={{default: "chart.xyaxis.line", selected: "chart.xyaxis.line"}}
                    md="query_stats"
                />
                <NativeTabs.Trigger.Label>Stations</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="settings/index">
                <NativeTabs.Trigger.Icon sf="slider.horizontal.3" md="tune" />
                <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}
