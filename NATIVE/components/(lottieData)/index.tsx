export type TLottiePropsName =
    | "login"
    | "chat"
    | "signup"
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
    | "contact-us";

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
        id: 5,
        title: "network-lost",
        image: require("../../assets/lottie/network-lost.json"),
    },

    {
        id: 7,
        title: "landing-loading",
        image: require("../../assets/lottie/landing-loading.json"),
    },

    {
        id: 18,
        title: "contact-us",
        image: require("../../assets/lottie/contact-us.json"),
    },
];
