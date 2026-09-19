import "../../landing-pages/landing.css";
import "./auth.css";

import {ArrowLeft, ArrowRight} from "lucide-react";
import {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";

import {
    PhoneVerificationRequestError,
    startSignupPhoneVerification,
    verifyPhoneCode,
} from "../../api/phoneVerification";
import {ExistingAccountRecovery} from "./ExistingAccountRecovery";
import {useSignupVerificationSession} from "./SignupVerificationSession";
import {useSignupFlow} from "./useSignupFlow";

type Challenge = {
    id: string;
    expiresAt: number;
    resendAt: number;
};

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

/**
 * Kenyan numbers get written as 0712 345 678, and browser autofill hands back
 * the full +254712345678. Both carry the same nine significant digits, so keep
 * only those rather than sending the server a number it cannot parse.
 */
function nationalDigits(value: string) {
    const digits = value.replace(/\D/g, "");
    return (digits.startsWith("254") ? digits.slice(3) : digits)
        .replace(/^0+/, "")
        .slice(0, 9);
}

function maskedPhone(phoneDigits: string) {
    return `+254 ••• ••• ${phoneDigits.slice(-3)}`;
}

export default function PhoneVerification() {
    const navigate = useNavigate();
    const {wardCode, pollingCenterCode} = useParams();
    const flow = useSignupFlow();
    const {clearVerificationTicket, setVerificationTicket} = useSignupVerificationSession();
    const [phoneDigits, setPhoneDigits] = useState("");
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [code, setCode] = useState("");
    const [existingAccount, setExistingAccount] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const secondsUntilExpiry = useSecondsUntil(challenge?.expiresAt ?? null);
    const secondsUntilResend = useSecondsUntil(challenge?.resendAt ?? null);
    const phoneInput = useRef<HTMLInputElement>(null);
    const codeInput = useRef<HTMLInputElement>(null);
    const hasExpired = secondsUntilExpiry === 0;
    const step = challenge ? "code" : "phone";

    const hasMatchingSelection = useMemo(
        () =>
            flow.ward?.number === Number(wardCode) &&
            flow.pollingCenter?.code === pollingCenterCode,
        [flow.pollingCenter?.code, flow.ward?.number, pollingCenterCode, wardCode],
    );

    // Focus follows the step, so the keyboard does not land on a control that
    // has just been replaced.
    useEffect(() => {
        (step === "code" ? codeInput : phoneInput).current?.focus();
    }, [step]);

    useEffect(() => {
        clearVerificationTicket();
        if (!hasMatchingSelection) navigate("/ui/signup/", {replace: true});
    }, [clearVerificationTicket, hasMatchingSelection, navigate]);

    if (!hasMatchingSelection || !wardCode || !pollingCenterCode) return null;

    const sendCode = async () => {
        if (phoneDigits.length !== 9) {
            setError("Enter a Kenyan mobile number with nine digits after +254.");
            return;
        }

        setIsSending(true);
        setError(null);
        setExistingAccount(false);
        try {
            const result = await startSignupPhoneVerification(`+254${phoneDigits}`);
            const now = Date.now();
            setChallenge({
                id: result.challenge_id,
                expiresAt: now + result.expires_in_seconds * 1000,
                resendAt: now + result.retry_after_seconds * 1000,
            });
            setCode("");
        } catch (requestError) {
            const error = requestError as PhoneVerificationRequestError;
            setError(error.message);
            if (error.retryAfterSeconds) {
                setChallenge((current) =>
                    current
                        ? {
                              ...current,
                              resendAt: Date.now() + error.retryAfterSeconds! * 1000,
                          }
                        : current,
                );
            }
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
            if (result.outcome === "existing_account") {
                setChallenge(null);
                setCode("");
                setExistingAccount(true);
                return;
            }
            setVerificationTicket(result.verification_ticket);
            navigate(`/ui/signup/accounts/${wardCode}/${pollingCenterCode}/`);
        } catch (requestError) {
            const error = requestError as PhoneVerificationRequestError;
            setError(error.message);
        } finally {
            setIsVerifying(false);
        }
    };

    const changeNumber = () => {
        setChallenge(null);
        setCode("");
        setExistingAccount(false);
        setError(null);
    };

    return (
        <div className="kz-auth">
            <div className="register otp-verification">
                {existingAccount ? (
                    <ExistingAccountRecovery onUseAnotherNumber={changeNumber} />
                ) : challenge ? (
                    <>
                        <h1>Check your messages.</h1>
                        <p className="lede">
                            Enter the six-digit code sent to {maskedPhone(phoneDigits)}. It
                            expires in two minutes.
                        </p>

                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                void verifyCode();
                            }}
                        >
                            <div className="field">
                                <label className="label" htmlFor="signup-otp-code">
                                    Six-digit code
                                </label>
                                <div className="otp-control">
                                    <input
                                        id="signup-otp-code"
                                        className="otp-code-input"
                                        ref={codeInput}
                                        autoComplete="one-time-code"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={code}
                                        onChange={(event) =>
                                            setCode(
                                                event.target.value
                                                    .replace(/\D/g, "")
                                                    .slice(0, 6),
                                            )
                                        }
                                        aria-describedby={
                                            error
                                                ? "signup-otp-help signup-otp-error"
                                                : "signup-otp-help"
                                        }
                                        aria-invalid={error ? true : undefined}
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
                                <p className="otp-help" id="signup-otp-help">
                                    {hasExpired
                                        ? "This code has expired. Request another one below."
                                        : `Code expires in ${clock(secondsUntilExpiry ?? 0)}.`}
                                </p>
                            </div>

                            {error && (
                                <p className="otp-error" id="signup-otp-error" role="alert">
                                    {error}
                                </p>
                            )}

                            <button
                                className="submit"
                                type="submit"
                                disabled={isVerifying || code.length !== 6 || hasExpired}
                            >
                                {isVerifying ? "Verifying…" : "Verify and continue"}
                                <ArrowRight />
                            </button>
                        </form>

                        <div className="otp-actions">
                            <button
                                className="text-action"
                                type="button"
                                disabled={isSending || (secondsUntilResend ?? 0) > 0}
                                onClick={() => void sendCode()}
                            >
                                {isSending ? "Sending…" : "Resend code"}
                            </button>
                            <button
                                className="text-action"
                                type="button"
                                onClick={changeNumber}
                            >
                                Change number
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h1>Your phone, first.</h1>
                        <p className="lede">
                            We&rsquo;ll send a six-digit code before collecting your account
                            details.
                        </p>

                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                void sendCode();
                            }}
                        >
                            <div className="field">
                                <label className="label" htmlFor="signup-phone-number">
                                    Phone number
                                </label>
                                <div className="phone-input">
                                    <div className="prefix">
                                        <span className="flag" aria-hidden="true" />
                                        +254
                                    </div>
                                    <input
                                        id="signup-phone-number"
                                        placeholder="712 345 678"
                                        autoComplete="tel"
                                        inputMode="tel"
                                        ref={phoneInput}
                                        value={phoneDigits}
                                        onChange={(event) =>
                                            setPhoneDigits(nationalDigits(event.target.value))
                                        }
                                        aria-describedby={
                                            error ? "signup-phone-error" : undefined
                                        }
                                        aria-invalid={error ? true : undefined}
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="otp-error" id="signup-phone-error" role="alert">
                                    {error}
                                </p>
                            )}

                            <button className="submit" type="submit" disabled={isSending}>
                                {isSending ? "Sending…" : "Send six-digit code"}
                                <ArrowRight />
                            </button>
                        </form>

                        <button
                            className="cancel"
                            type="button"
                            onClick={() => navigate("/ui/signup/")}
                        >
                            <ArrowLeft />
                            Back to location
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
