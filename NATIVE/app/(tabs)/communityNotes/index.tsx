import React, {useEffect, useState} from "react";
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import {Ionicons} from "@expo/vector-icons";
import {apiBaseURL} from "@/app/(utils)/apiBaseURL";
import {router} from "expo-router";
import useAuthStore from "@/app/(utils)/authStore";
import useCurrentPollingStationStore from "@/app/(utils)/curentStationStore";

export interface IPollingCenterInfo {
    code: string;
    constituency: string;
    county: string;
    id: number;
    name: string;
    ward: string;
}

export interface IPollingStation {
    code: string;
    date_created: string;
    date_modified: string;
    is_verified: boolean;
    registered_voters: number;
    stream_number: number;
}

const ElectionResultsApp = () => {
    const [pollingCenterInfo, setPollingCenterInfo] =
        useState<IPollingCenterInfo | null>(null);

    const {
        setStations,
        stations,
        currentStationCode,
        setCurrentCenter,
        setCurrentStationCode,
        currentCenter,
    } = useCurrentPollingStationStore();

    const {userToken} = useAuthStore();

    useEffect(() => {
        if (!userToken) return;

        fetch(`${apiBaseURL}/api/stations/community-notes/polling-center-info/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${userToken}`,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                // console.log(data);
                if (data && data.data) {
                    // console.log(data.data, "data.data");
                    setPollingCenterInfo(data.data);
                    setCurrentCenter(data.data);
                    setStations(data.stations || []);
                }
            })
            .catch((error) => {
                console.error("Error fetching polling center info:", error);
            });
    }, [userToken]);

    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor: "#F5F5F5",
                paddingTop: StatusBar.currentHeight || 0,
            }}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <ScrollView
                style={{
                    flex: 1,
                    paddingHorizontal: 20,
                }}
                showsVerticalScrollIndicator={false}
            >
                <View
                    key={pollingCenterInfo?.code}
                    style={{
                        backgroundColor: "#fff",
                        borderRadius: 16,
                        padding: 20,
                        marginBottom: 20,
                        elevation: 2,
                        shadowColor: "#000",
                        shadowOffset: {width: 0, height: 2},
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                    }}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 16,
                        }}
                    >
                        <View
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 12,
                                backgroundColor: "#E3F2FD",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 12,
                            }}
                        >
                            <Ionicons name="home" size={24} color="#2196F3" />
                        </View>
                        <View style={{flex: 1}}>
                            <Text
                                style={{
                                    fontSize: 18,
                                    fontWeight: "bold",
                                    color: "#333",
                                }}
                            >
                                {pollingCenterInfo?.name}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: "#666",
                                    marginTop: 2,
                                }}
                            >
                                {pollingCenterInfo?.county} /{" "}
                                {pollingCenterInfo?.constituency} /{" "}
                                {pollingCenterInfo?.ward} Ward
                            </Text>
                        </View>
                    </View>

                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-around",
                            marginBottom: 20,
                            paddingVertical: 16,
                            borderTopWidth: 1,
                            borderBottomWidth: 1,
                            borderColor: "#F0F0F0",
                        }}
                    >
                        <View style={{alignItems: "center"}}>
                            <Text
                                style={{
                                    fontSize: 24,
                                    fontWeight: "bold",
                                    color: "#2196F3",
                                }}
                            >
                                {stations?.length.toLocaleString()}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 12,
                                    color: "#666",
                                    marginTop: 4,
                                }}
                            >
                                Stations
                            </Text>
                        </View>
                        <View style={{alignItems: "center"}}>
                            <Text
                                style={{
                                    fontSize: 24,
                                    fontWeight: "bold",
                                    color: "#2196F3",
                                }}
                            >
                                {stations
                                    ?.reduce(
                                        (acc, station) =>
                                            acc + station.registered_voters,
                                        0,
                                    )
                                    .toLocaleString()}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 12,
                                    color: "#666",
                                    marginTop: 4,
                                }}
                            >
                                Total Voters
                            </Text>
                        </View>
                    </View>

                    <View style={{marginTop: 4}}>
                        <Text
                            style={{
                                fontSize: 16,
                                fontWeight: "600",
                                color: "#333",
                                marginBottom: 12,
                            }}
                        >
                            Polling Stations
                        </Text>
                        {stations &&
                            stations.map((station) => (
                                <TouchableOpacity
                                    key={station.code}
                                    style={{
                                        backgroundColor: "#fff",
                                        borderRadius: 16,
                                        paddingVertical: 18,
                                        paddingHorizontal: 20,
                                        marginBottom: 12,
                                        borderWidth: 0,
                                        shadowColor: "#000",
                                        shadowOffset: {width: 0, height: 2},
                                        shadowOpacity: 0.07,
                                        shadowRadius: 8,
                                        elevation: 2,
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 16,
                                    }}
                                    onPress={() => {
                                        router.navigate(
                                            `/communityNotes/${station.code}`,
                                        );
                                        setCurrentStationCode(station.code);
                                    }}
                                    activeOpacity={0.92}
                                >
                                    {/* <View
                                        style={{
                                            backgroundColor: "#E3F2FD",
                                            borderRadius: 10,
                                            width: 44,
                                            height: 44,
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Ionicons
                                            name="location-outline"
                                            size={22}
                                            color="#2196F3"
                                        />
                                    </View> */}
                                    <View style={{flex: 1}}>
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                fontFamily: "Sora-Regular",
                                                fontWeight: "600",
                                                color: "#222",
                                                letterSpacing: 0.2,
                                            }}
                                        >
                                            {station.code} - (Stream{" "}
                                            {station.stream_number})
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 16,
                                                fontFamily: "Sora-Regular",
                                                color: "#6B7280",
                                                marginTop: 3,
                                            }}
                                        >
                                            {station.registered_voters.toLocaleString()}{" "}
                                            voters
                                        </Text>
                                    </View>
                                    <Ionicons
                                        name="chevron-forward"
                                        size={22}
                                        color="red"
                                    />
                                </TouchableOpacity>
                            ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ElectionResultsApp;
