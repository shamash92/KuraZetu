import {ArrowRight} from "lucide-react";

type ExistingAccountRecoveryProps = {
    onUseAnotherNumber: () => void;
};

/**
 * Shown only after a person has proved they control a number that already has
 * an account. Keeping it separate makes the sign-in hand-off a complete,
 * reviewable UI state rather than an exceptional branch in the OTP form.
 */
export function ExistingAccountRecovery({onUseAnotherNumber}: ExistingAccountRecoveryProps) {
    return (
        <section className="account-recovery flex flex-col items-center" aria-labelledby="existing-account-heading">
            <ExistingAccountRecoveryIllustration />
            <h1 className="m-0" id="existing-account-heading">Choose how to continue.</h1>
            <p className="account-recovery-warning mt-3">This number already has an account.</p>
            <div className="account-recovery-options mt-7" aria-label="Choose how to continue">
                <a className="account-recovery-choice account-recovery-choice--sign-in" href="/accounts/login/">
                    Sign in
                    <ArrowRight />
                </a>
                <span className="account-recovery-or" aria-hidden="true">or</span>
                <a className="account-recovery-choice account-recovery-choice--reset" href="/ui/password-reset/">
                    Reset password
                </a>
            </div>
            <div className="account-recovery-actions mt-5">
                <button className="text-action" type="button" onClick={onUseAnotherNumber}>
                    Use another number
                </button>
            </div>
        </section>
    );
}

function ExistingAccountRecoveryIllustration() {
    return (
        <svg
            aria-hidden="true"
            className="account-recovery-illustration mb-6"
            focusable="false"
            viewBox="0 0 400 300"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M-10 274 C58 262 118 276 198 280 C278 284 338 272 412 262" />
            <path d="M156 36 L244 36 A18 18 0 0 1 262 54 L262 242 A18 18 0 0 1 244 260 L156 260 A18 18 0 0 1 138 242 L138 54 A18 18 0 0 1 156 36 Z" />
            <path className="recovery-muted-line" d="M160 60 L240 60 A10 10 0 0 1 250 70 L250 226 A10 10 0 0 1 240 236 L160 236 A10 10 0 0 1 150 226 L150 70 A10 10 0 0 1 160 60 Z" />
            <path d="M186 48 L214 48" />
            <path className="recovery-muted-line" d="M166 86 L212 86" />
            <path d="M171 98 L229 98 A5 5 0 0 1 234 103 L234 115 A5 5 0 0 1 229 120 L171 120 A5 5 0 0 1 166 115 L166 103 A5 5 0 0 1 171 98 Z" />
            <path className="recovery-lime-line" d="M175 109 L225 109" />
            <path className="recovery-muted-line" d="M166 142 L222 142" />
            <path className="recovery-muted-line" d="M166 158 L200 158" />
            <path className="recovery-copper-line" d="M222 228 A30 30 0 1 0 282 228 A30 30 0 1 0 222 228" />
            <path d="M241 217 L263 239" />
            <path d="M263 217 L241 239" />
            <path className="recovery-muted-arrow" d="M300 252 C342 242 358 214 350 188" />
            <path className="recovery-muted-arrow" d="M342 196 L350 184 L359 192" />
            <path className="recovery-muted-line" d="M84 113 C85.12 117.62 86.38 118.88 91 120 C86.38 121.12 85.12 122.38 84 127 C82.88 122.38 81.62 121.12 77 120 C81.62 118.88 82.88 117.62 84 113 Z" />
            <path className="recovery-muted-line" d="M330 91 C330.8 94.3 331.7 95.2 335 96 C331.7 96.8 330.8 97.7 330 101 C329.2 97.7 328.3 96.8 325 96 C328.3 95.2 329.2 94.3 330 91 Z" />
        </svg>
    );
}
