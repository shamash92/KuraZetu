import AuthLoading from "./authLoading";
import TallyScene from "./tallyScene";

// Deliberately about what the project is for rather than which step the request
// is on — the internals mean nothing to a voter, and naming steps would imply
// progress we cannot promise.
const STATUS_LINES = ["Counted by citizens", "Your ward, your tally", "Open count"];

type LoginLoadingProps = {
    onTallyAnimationComplete?: () => void;
};

/** Shown for the whole of the sign-in handshake. */
export default function LoginLoading({
    onTallyAnimationComplete,
}: LoginLoadingProps) {
    return (
        <AuthLoading
            scene={<TallyScene onTallyAnimationComplete={onTallyAnimationComplete} />}
            caption="Counting you in"
            statusLines={STATUS_LINES}
            note="Not an IEBC system"
        />
    );
}
