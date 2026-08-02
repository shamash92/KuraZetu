import AuthLoading from "./authLoading";
import BallotScene from "./ballotScene";

const STATUS_LINES = ["Watching the count", "Non-partisan by design"];

/** Shown while the account is being created. */
export default function SignupLoading() {
    return (
        <AuthLoading
            scene={<BallotScene />}
            headline="Making it official"
            statusLines={STATUS_LINES}
            note="Not an IEBC system"
        />
    );
}
