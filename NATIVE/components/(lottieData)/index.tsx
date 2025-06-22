export type TLottiePropsName =
    | "login"
    | "login-fingerprint"
    | "chat"
    | "signup"
    | "maps-loading"
    | "notifications-enabled"
    | "notifications-disabled"
    | "network-lost"
    | "appointment-loading"
    | "landing-loading"
    | "chats-loading"
    | "chatroom"
    | "google-pay"
    | "calendar-booking-process"
    | "sharing"
    | "sharing-friends"
    | "translate"
    | "translateModal"
    | "visitor-welcome"
    | "audio"
    | "contact-us"
    | "tea"
    | "wave";

export interface ILottiePropsType {
    id: number;
    title: TLottiePropsName;
    image: string;
}

export const LOTTIE_DATA: ILottiePropsType[] = [
    {
        id: 1,
        title: "login",
        image: require("../../assets/lottie/loginLoading.json"),
    },
    {
        id: 2,
        title: "maps-loading",
        image: require("../../assets/lottie/mapsLoading.json"),
    },

    {
        id: 3,
        title: "signup",
        image: require("../../assets/lottie/signup.json"),
    },
    {
        id: 4,
        title: "notifications-enabled",
        image: require("../../assets/lottie/notifications-enabled.json"),
    },
    {
        id: 5,
        title: "notifications-disabled",
        image: require("../../assets/lottie/notifications-disabled.json"),
    },
    {
        id: 6,
        title: "network-lost",
        image: require("../../assets/lottie/network-lost.json"),
    },

    {
        id: 7,
        title: "landing-loading",
        image: require("../../assets/lottie/landing-loading.json"),
    },

    {
        id: 8,
        title: "login-fingerprint",
        image: require("../../assets/lottie/loginFingerprint.json"),
    },

    {
        id: 9,
        title: "contact-us",
        image: require("../../assets/lottie/contact-us.json"),
    },
    {
        id: 10,
        title: "tea",
        image: require("../../assets/lottie/boiling.json"),
    },
    {
        id: 11,
        title: "wave",
        image: require("../../assets/lottie/wave.json"),
    },
];
