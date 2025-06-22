import {ChevronRight, MapPin} from "lucide-react-native";
import {StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {getStatusColor, getStatusText} from "../(utils)/LocationService";

import {IPollingCenterFeature} from "../types/Location";
import React from "react";

interface LocationItemProps {
    location: IPollingCenterFeature;
    onPress: () => void;
    onEdit: () => void;
}

const PollingCenterItem: React.FC<LocationItemProps> = ({
    location,
    onPress,
    onEdit,
}) => {
    const statusColor = getStatusColor(location);
    const statusText = getStatusText(location);

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.leftContent}>
                <View
                    style={[
                        styles.pinIconContainer,
                        {backgroundColor: `${statusColor}20`},
                    ]}
                >
                    <MapPin size={20} color={statusColor} />
                </View>
            </View>

            <View style={styles.middleContent}>
                <Text style={styles.title} numberOfLines={1}>
                    {location.properties.name}
                </Text>

                <View style={styles.detailsRow}>
                    <View
                        style={[
                            styles.statusBadge,
                            {backgroundColor: `${statusColor}20`},
                        ]}
                    >
                        <Text style={[styles.statusText, {color: statusColor}]}>
                            {statusText}
                        </Text>
                    </View>
                </View>
                {location.properties.pin_location_error && (
                    <Text style={styles.address} numberOfLines={1}>
                        {location.properties.pin_location_error || "No pin errors"}
                    </Text>
                )}
            </View>

            <TouchableOpacity style={styles.editButton} onPress={onEdit}>
                <Text style={styles.editText}>Edit</Text>
                <ChevronRight size={16} color="#3B82F6" />
            </TouchableOpacity>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#F1F5F9",
    },
    leftContent: {
        marginRight: 12,
    },
    pinIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    middleContent: {
        flex: 1,
        justifyContent: "center",
    },
    title: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1E293B",
        marginBottom: 4,
    },
    address: {
        fontSize: 12,
        color: "red",
        marginTop: 8,
    },
    detailsRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "500",
    },
    category: {
        fontSize: 12,
        color: "#94A3B8",
    },
    editButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingLeft: 8,
    },
    editText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#3B82F6",
        marginRight: 4,
    },
});

export default PollingCenterItem;
