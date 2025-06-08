import {Animated, StyleSheet, View} from "react-native";
import React, {useEffect} from "react";

import {IPollingCenterFeature} from "../types/Location";
import {Location} from "../types/Location";
import {MapPin} from "lucide-react-native";
import {getStatusColor} from "../(utils)/LocationService";

interface LocationPinProps {
    location: IPollingCenterFeature;
    selected?: boolean;
}

const LocationPin: React.FC<LocationPinProps> = ({location, selected = false}) => {
    const statusColor = getStatusColor(location);
    const scale = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (selected) {
            Animated.sequence([
                Animated.timing(scale, {
                    toValue: 1.4,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 1.2,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.timing(scale, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [selected, scale]);

    return (
        <Animated.View style={[styles.container, {transform: [{scale}]}]}>
            <View style={[styles.pinContainer, {backgroundColor: `${statusColor}20`}]}>
                <MapPin size={24} color={statusColor} strokeWidth={selected ? 3 : 2} />
            </View>
            {selected && <View style={[styles.dot, {backgroundColor: statusColor}]} />}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        width: 48,
        height: 48,
    },
    pinContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#FFFFFF",
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    dot: {
        position: "absolute",
        bottom: 0,
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "#FFFFFF",
    },
});

export default LocationPin;
