import "../../landing-pages/landing.css";
import "../signup/auth.css";

import {ArrowLeft, ArrowRight} from "lucide-react";
import {useEffect, useRef, useState} from "react";
import {useSearchParams} from "react-router-dom";

import {
    completePasswordReset,
    getPasswordResetPhonePrefill,
    PhoneVerificationRequestError,
    startPasswordResetVerification,
    verifyPhoneCode,
} from "../../api/phoneVerification";

type Challenge = {
    id: string;
    expiresAt: number;
};

type Step = "phone" | "code" | "password" | "complete";

function useSecondsUntil(deadline: number | null) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!deadline) return;
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [deadline]);

    return deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null;
}

function clock(seconds: number) {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function nationalDigits(value: string) {
    const digits = value.replace(/\D/g, "");
    return (digits.startsWith("254") ? digits.slice(3) : digits)
        .replace(/^0+/, "")
        .slice(0, 9);
}

function maskedPhone(phoneDigits: string) {
    return `+254 ••• ••• ${phoneDigits.slice(-3)}`;
}

export default function PasswordReset() {
    const [searchParams] = useSearchParams();
    const phoneVerificationRequired = searchParams.get("reason") === "phone_unverified";
    const [step, setStep] = useState<Step>("phone");
    const [phoneDigits, setPhoneDigits] = useState("");
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [code, setCode] = useState("");
    const [verificationTicket, setVerificationTicket] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const phoneInput = useRef<HTMLInputElement>(null);
    const codeInput = useRef<HTMLInputElement>(null);
    const secondsUntilExpiry = useSecondsUntil(challenge?.expiresAt ?? null);
    const hasExpired = secondsUntilExpiry === 0;

    useEffect(() => {
        if (step === "phone") phoneInput.current?.focus();
        if (step === "code") codeInput.current?.focus();
    }, [step]);

    useEffect(() => {
        if (!phoneVerificationRequired) return;
        let current = true;

        async function prefillPhoneNumber() {
            const phoneNumber = await getPasswordResetPhonePrefill();
            if (current && phoneNumber) setPhoneDigits(nationalDigits(phoneNumber));
        }

        void prefillPhoneNumber();
        return () => {
            current = false;
        };
    }, [phoneVerificationRequired]);

    const sendCode = async () => {
        if (phoneDigits.length !== 9) {
            setError("Enter a Kenyan mobile number with nine digits after +254.");
            return;
        }

        setIsSending(true);
        setError(null);
        try {
            const result = await startPasswordResetVerification(`+254${phoneDigits}`);
            setChallenge({
                id: result.challenge_id,
                expiresAt: Date.now() + result.expires_in_seconds * 1000,
            });
            setCode("");
            setStep("code");
        } catch (requestError) {
            setError((requestError as PhoneVerificationRequestError).message);
        } finally {
            setIsSending(false);
        }
    };

    const verifyCode = async () => {
        if (!challenge || code.length !== 6) {
            setError("Enter the six-digit code from your SMS.");
            return;
        }
        if (hasExpired) {
            setError("That code has expired. Send a new one to continue.");
            return;
        }

        setIsVerifying(true);
        setError(null);
        try {
            const result = await verifyPhoneCode(challenge.id, code);
            if (result.outcome !== "verified") {
                setError("This verification cannot reset your password. Start again.");
                return;
            }
            setVerificationTicket(result.verification_ticket);
            setStep("password");
        } catch (requestError) {
            setError((requestError as PhoneVerificationRequestError).message);
        } finally {
            setIsVerifying(false);
        }
    };

    const resetPassword = async () => {
        if (!verificationTicket) {
            setError("This verification has expired. Start again.");
            setStep("phone");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("The passwords do not match.");
            return;
        }

        setIsResetting(true);
        setError(null);
        try {
            await completePasswordReset(verificationTicket, newPassword);
            setVerificationTicket(null);
            setStep("complete");
        } catch (requestError) {
            setError((requestError as PhoneVerificationRequestError).message);
        } finally {
            setIsResetting(false);
        }
    };

    const startAgain = () => {
        setChallenge(null);
        setCode("");
        setVerificationTicket(null);
        setNewPassword("");
        setConfirmPassword("");
        setError(null);
        setStep("phone");
    };

    return (
        <div className="kz-auth">
            <main className="register otp-verification password-reset">
                {step === "complete" ? (
                    <>
                        <h1>Password updated.</h1>
                        <p className="lede">You can now sign in with your new password.</p>
                        <a className="submit" href="/accounts/login/">
                            Sign in
                            <ArrowRight />
                        </a>
                    </>
                ) : step === "password" ? (
                    <>
                        <h1>Set a new password.</h1>
                        <p className="lede">Choose a password you do not use elsewhere.</p>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                void resetPassword();
                            }}
                        >
                            <div className="field">
                                <label className="label" htmlFor="new-password">
                                    New password
                                </label>
                                <input
                                    className="inp"
                                    id="new-password"
                                    autoComplete="new-password"
                                    onChange={(event) => setNewPassword(event.target.value)}
                                    type="password"
                                    value={newPassword}
                                />
                            </div>
                            <div className="field">
                                <label className="label" htmlFor="confirm-new-password">
                                    Confirm new password
                                </label>
                                <input
                                    className="inp"
                                    id="confirm-new-password"
                                    autoComplete="new-password"
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    type="password"
                                    value={confirmPassword}
                                />
                            </div>
                            {error && <p className="otp-error" role="alert">{error}</p>}
                            <button
                                className="submit"
                                disabled={isResetting || !newPassword || !confirmPassword}
                                type="submit"
                            >
                                {isResetting ? "Updating…" : "Update password"}
                                <ArrowRight />
                            </button>
                        </form>
                    </>
                ) : step === "code" ? (
                    <>
                        <h1>Check your messages.</h1>
                        <p className="lede">
                            Enter the six-digit code sent to {maskedPhone(phoneDigits)}.
                        </p>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                void verifyCode();
                            }}
                        >
                            <div className="field">
                                <label className="label" htmlFor="reset-otp-code">
                                    Six-digit code
                                </label>
                                <div className="otp-control">
                                    <input
                                        id="reset-otp-code"
                                        className="otp-code-input"
                                        ref={codeInput}
                                        autoComplete="one-time-code"
                                        inputMode="numeric"
                                        maxLength={6}
                                        onChange={(event) =>
                                            setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                                        }
                                        value={code}
                                    />
                                    <div className="otp-cells" aria-hidden="true">
                                        {Array.from({length: 6}, (_, index) => (
                                            <span
                                                className={`otp-cell ${
                                                    code[index] ? "filled" : ""
                                                } ${
                                                    index === code.length && code.length < 6
                                                        ? "cursor"
                                                        : ""
                                                }`}
                                                key={index}
                                            >
                                                {code[index] ?? ""}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <p className="otp-help">
                                    {hasExpired
                                        ? "This code has expired. Request another one below."
                                        : `Code expires in ${clock(secondsUntilExpiry ?? 0)}.`}
                                </p>
                            </div>
                            {error && <p className="otp-error" role="alert">{error}</p>}
                            <button
                                className="submit"
                                disabled={isVerifying || code.length !== 6 || hasExpired}
                                type="submit"
                            >
                                {isVerifying ? "Verifying…" : "Verify and continue"}
                                <ArrowRight />
                            </button>
                        </form>
                        <div className="otp-actions">
                            <button
                                className="text-action"
                                disabled={isSending || !hasExpired}
                                onClick={() => void sendCode()}
                                type="button"
                            >
                                {isSending ? "Sending…" : "Resend code"}
                            </button>
                            <button className="text-action" onClick={startAgain} type="button">
                                Change number
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h1>
                            {phoneVerificationRequired
                                ? "Verify your phone."
                                : "Reset your password."}
                        </h1>
                        <p className="lede">
                            {phoneVerificationRequired
                                ? "We’ll send a six-digit code, then you’ll set a new password to continue."
                                : "Enter your number and we’ll send a six-digit code if it has an account."}
                        </p>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                void sendCode();
                            }}
                        >
                            <div className="field">
                                <label className="label" htmlFor="reset-phone-number">
                                    Phone number
                                </label>
                                <div className="phone-input">
                                    <div className="prefix">
                                        <span className="flag" aria-hidden="true" />
                                        +254
                                    </div>
                                    <input
                                        id="reset-phone-number"
                                        autoComplete="tel"
                                        inputMode="tel"
                                        onChange={(event) =>
                                            setPhoneDigits(nationalDigits(event.target.value))
                                        }
                                        placeholder="712 345 678"
                                        ref={phoneInput}
                                        value={phoneDigits}
                                    />
                                </div>
                            </div>
                            {error && <p className="otp-error" role="alert">{error}</p>}
                            <button className="submit" disabled={isSending} type="submit">
                                {isSending ? "Sending…" : "Send six-digit code"}
                                <ArrowRight />
                            </button>
                        </form>
                        <a className="cancel" href="/accounts/login/">
                            <ArrowLeft />
                            Back to sign in
                        </a>
                    </>
                )}
            </main>
        </div>
    );
}
