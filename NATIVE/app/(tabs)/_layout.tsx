import React from "react";
import {StyleSheet} from "react-native";
import {TabBarIcon} from "@/components/navigation/TabBarIcon";
import {Tabs} from "expo-router";
import {orangeColor} from "../(utils)/colors";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: orangeColor,
                tabBarInactiveTintColor: "white",
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: "rgba(0,0,0,0.8)",
                    // opacity: 0.6,
                    // backgroundColor: "#581b98",
                    // backgroundColor: "black",

                    // backgroundColor: "transparent",
                    elevation: 0,
                    position: "absolute",
                    borderTopWidth: StyleSheet.hairlineWidth,
                    // height: 60,
                    paddingTop: 12,
                    paddingBottom: 0,
                    marginBottom: 0,
                    alignItems: "center",
                    justifyContent: "center",
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({color, focused}) => (
                        <TabBarIcon
                            name={focused ? "home" : "home-outline"}
                            color={color}
                        />
                    ),
                    headerShown: false,
                }}
            />

            <Tabs.Screen
                name="tabTwo"
                options={{
                    title: "Update Map",
                    tabBarIcon: ({color, focused}) => (
                        <TabBarIcon
                            name={focused ? "person" : "person-outline"}
                            color={color}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="tabThree"
                options={{
                    title: "Profile",
                    tabBarIcon: ({color, focused}) => (
                        <TabBarIcon
                            name={focused ? "person" : "person-outline"}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
