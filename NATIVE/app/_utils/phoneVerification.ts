import {apiBaseURL} from "./apiBaseURL";

type ApiErrorBody = {
    code?: unknown;
    error?: string;
    retry_after_seconds?: number;
};

type StartPayload = {
    challenge_id: string;
    expires_in_seconds: number;
    retry_after_seconds: number;
};

type VerifyPayload =
    | {outcome: "existing_account"}
    | {
          outcome: "verified";
          verification_ticket: string;
          expires_in_seconds: number;
      };

export class PhoneVerificationRequestError extends Error {
    code: string | null;
    retryAfterSeconds: number | null;

    constructor({
        message,
        code = null,
        retryAfterSeconds = null,
    }: {
        message: string;
        code?: string | null;
        retryAfterSeconds?: number | null;
    }) {
        super(message);
        this.code = code;
        this.retryAfterSeconds = retryAfterSeconds;
    }
}

function fieldError(data: Record<string, unknown>) {
    for (const value of Object.values(data)) {
        if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    }
    return null;
}

async function post<T>(path: string, body: Record<string, string>): Promise<T> {
    let response: Response;
    try {
        response = await fetch(`${apiBaseURL}${path}`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    } catch {
        throw new PhoneVerificationRequestError({
            message: "We could not reach Kura Zetu. Check your connection and try again.",
        });
    }

    const data = (await response.json().catch(() => ({}))) as ApiErrorBody & {
        data?: T;
    };
    if (!response.ok || !data.data) {
        throw new PhoneVerificationRequestError({
            message:
                data.error ??
                fieldError(data) ??
                "We could not complete phone verification. Try again.",
            code: typeof data.code === "string" ? data.code : null,
            retryAfterSeconds: data.retry_after_seconds ?? null,
        });
    }

    return data.data;
}

export function startSignupPhoneVerification(phoneNumber: string) {
    return post<StartPayload>("/api/accounts/phone-verification/signup/start/", {
        phone_number: phoneNumber,
    });
}

export function verifyPhoneCode(challengeId: string, code: string) {
    return post<VerifyPayload>("/api/accounts/phone-verification/verify/", {
        challenge_id: challengeId,
        code,
    });
}
