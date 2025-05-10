import {LOTTIE_DATA, TLottiePropsName} from "./(lottieData)";
import React, {useRef} from "react";

import LottieView from "lottie-react-native";
import {View} from "react-native";

interface ILottieFilePath {
    name: TLottiePropsName;
    backgroundColor?: string;
    width?: number;
}

export default function LottieComponent({
    name,
    backgroundColor,
    width,
}: ILottieFilePath) {
    const animation = useRef(null);

    let pathName = LOTTIE_DATA.find((item) => item.title === name);

    // console.log(pathName, "pathName");

    return (
        <View
            style={{
                backgroundColor: backgroundColor ? backgroundColor : "white",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {pathName && (
                <LottieView
                    autoPlay
                    ref={animation}
                    style={{
                        width: width ? width : 200,
                        height: width ? width : 200,
                        backgroundColor: backgroundColor ? backgroundColor : "white",
                    }}
                    source={pathName.image}
                />
            )}
        </View>
    );
}
