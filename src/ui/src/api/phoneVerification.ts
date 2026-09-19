import cookie from "react-cookies";

import {
    PASSWORD_RESET_COMPLETION_URL,
    PASSWORD_RESET_PHONE_VERIFICATION_START_URL,
    PHONE_VERIFICATION_CODE_URL,
    SIGNUP_PHONE_VERIFICATION_START_URL,
} from "./apiUrls";

type ApiErrorBody = {
    code?: unknown;
    error?: string;
    retry_after_seconds?: number;
};

/**
 * Field-level validation comes back as DRF's {field: ["message"]} shape rather
 * than our own {error} envelope, so read it out instead of falling through to
 * the generic message and leaving the person with nothing to act on.
 */
function fieldError(data: Record<string, unknown>) {
    for (const value of Object.values(data)) {
        if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    }
    return null;
}

type StartPayload = {
    challenge_id: string;
    expires_in_seconds: number;
    retry_after_seconds: number;
};

type VerifyPayload =
    | {
          outcome: "existing_account";
      }
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

async function post(url: string, body: Record<string, string>) {
    let response: Response;
    try {
        response = await fetch(url, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "X-CSRFToken": cookie.load("csrftoken"),
            },
            body: JSON.stringify(body),
        });
    } catch {
        throw new PhoneVerificationRequestError({
            message: "We could not reach Kura Zetu. Check your connection and try again.",
        });
    }

    const data = (await response.json().catch(() => ({}))) as ApiErrorBody & {
        data?: unknown;
    };
    if (!response.ok) {
        throw new PhoneVerificationRequestError({
            message:
                data.error ??
                fieldError(data) ??
                "We could not complete phone verification. Try again.",
            code: typeof data.code === "string" ? data.code : null,
            retryAfterSeconds: data.retry_after_seconds ?? null,
        });
    }
    return data;
}

async function postWithData<T>(url: string, body: Record<string, string>): Promise<T> {
    const response = await post(url, body);
    if (!response.data) {
        throw new PhoneVerificationRequestError({
            message: "We could not complete phone verification. Try again.",
        });
    }
    return response.data as T;
}

export function startSignupPhoneVerification(phoneNumber: string) {
    return postWithData<StartPayload>(SIGNUP_PHONE_VERIFICATION_START_URL, {
        phone_number: phoneNumber,
    });
}

export function verifyPhoneCode(challengeId: string, code: string) {
    return postWithData<VerifyPayload>(PHONE_VERIFICATION_CODE_URL, {
        challenge_id: challengeId,
        code,
    });
}

export function startPasswordResetVerification(phoneNumber: string) {
    return postWithData<StartPayload>(PASSWORD_RESET_PHONE_VERIFICATION_START_URL, {
        phone_number: phoneNumber,
    });
}

export async function completePasswordReset(verificationTicket: string, newPassword: string) {
    await post(PASSWORD_RESET_COMPLETION_URL, {
        verification_ticket: verificationTicket,
        new_password: newPassword,
    });
}
