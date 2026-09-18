import AuthLoading from "./authLoading";
import BallotScene from "./ballotScene";

const STATUS_LINES = ["Watching the count", "Non-partisan by design"];

type SignupLoadingProps = {
    onBallotAnimationComplete?: () => void;
};

/** Shown while the account is being created and the completion scene plays. */
export default function SignupLoading({
    onBallotAnimationComplete,
}: SignupLoadingProps) {
    return (
        <AuthLoading
            scene={<BallotScene onAnimationComplete={onBallotAnimationComplete} />}
            headline="Making it official"
            statusLines={STATUS_LINES}
            note="Not an IEBC system"
        />
    );
}
