import {View, Text} from "react-native";
import React from "react";

import {
    AntDesign,
    Entypo,
    EvilIcons,
    Feather,
    Ionicons,
    MaterialCommunityIcons,
    MaterialIcons,
} from "@expo/vector-icons";

export type IIconGroup =
    | "ant"
    | "entypo"
    | "evil"
    | "feather"
    | "ionicons"
    | "material-community"
    | "material-icons";

function IconComponent({
    iconGroup,
    name,
    size,
    color,
}: {
    iconGroup: IIconGroup;
    name: string;
    size?: number;
    color?: string;
}) {
    if (iconGroup === "ant") {
        return (
            <AntDesign
                name={name}
                size={size ? size : 24}
                color={color ? color : "black"}
            />
        );
    }

    if (iconGroup === "entypo") {
        return (
            <Entypo
                name={name}
                size={size ? size : 24}
                color={color ? color : "black"}
            />
        );
    }
    if (iconGroup === "evil") {
        return (
            <EvilIcons
                name={name}
                size={size ? size : 24}
                color={color ? color : "black"}
            />
        );
    }
    if (iconGroup === "feather") {
        return (
            <Feather
                name={name}
                size={size ? size : 24}
                color={color ? color : "black"}
            />
        );
    }

    if (iconGroup === "material-community") {
        return (
            <MaterialCommunityIcons
                name={name}
                size={size ? size : 24}
                color={color ? color : "black"}
            />
        );
    }
    if (iconGroup === "material-icons") {
        return (
            <MaterialIcons
                name={name}
                size={size ? size : 24}
                color={color ? color : "black"}
            />
        );
    }

    return (
        <View>
            <Ionicons
                name={name}
                size={size ? size : 24}
                color={color ? color : "black"}
            />
        </View>
    );
}

export default IconComponent;
