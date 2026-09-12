import AuthLoading from "./authLoading";
import {COPPER, INK, RULE_16, SURFACE} from "../../app/_utils/colors";
import React, {useEffect, useState} from "react";
import {StyleSheet, Text} from "react-native";

function getRemainingSeconds(lockoutExpiresAt: number) {
    return Math.max(0, Math.ceil((lockoutExpiresAt - Date.now()) / 1000));
}

function formatRemainingTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

type LoginLockoutProps = {
    lockoutExpiresAt: number;
    onComplete: () => void;
};

/** Shows the server-authoritative wait before another password attempt. */
export default function LoginLockout({
    lockoutExpiresAt,
    onComplete,
}: LoginLockoutProps) {
    const [remainingSeconds, setRemainingSeconds] = useState(() =>
        getRemainingSeconds(lockoutExpiresAt),
    );

    useEffect(() => {
        const updateRemainingTime = () => {
            const nextRemainingSeconds = getRemainingSeconds(lockoutExpiresAt);
            setRemainingSeconds(nextRemainingSeconds);

            if (nextRemainingSeconds === 0) onComplete();
        };

        updateRemainingTime();
        const timer = setInterval(updateRemainingTime, 1000);

        return () => clearInterval(timer);
    }, [lockoutExpiresAt, onComplete]);

    const countdown = formatRemainingTime(remainingSeconds);

    return (
        <AuthLoading
            scene={
                <Text
                    accessibilityLabel={`${countdown} remaining before you can try again`}
                    accessibilityLiveRegion="polite"
                    accessibilityRole="timer"
                    style={styles.countdown}
                >
                    {countdown}
                </Text>
            }
            headline="Try again soon"
            caption="Too many attempts"
            statusLines={["Your sign-in is temporarily paused"]}
            note="This screen closes automatically"
        />
    );
}

const styles = StyleSheet.create({
    countdown: {
        minWidth: 164,
        borderWidth: 1,
        borderColor: RULE_16,
        borderRadius: 22,
        backgroundColor: SURFACE,
        paddingHorizontal: 24,
        paddingVertical: 18,
        fontSize: 50,
        fontWeight: "900",
        fontVariant: ["tabular-nums"],
        letterSpacing: -1.6,
        textAlign: "center",
        color: INK,
        shadowColor: COPPER,
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.09,
        shadowRadius: 16,
    },
});
