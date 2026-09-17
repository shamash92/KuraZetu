import {createContext, useCallback, useContext, useState} from "react";

import type {ReactNode} from "react";

type SignupVerificationSessionValue = {
    verificationTicket: string | null;
    setVerificationTicket: (ticket: string) => void;
    clearVerificationTicket: () => void;
};

const SignupVerificationSession = createContext<SignupVerificationSessionValue | null>(null);

/**
 * Holds the opaque signup ticket only for this running React session. It is
 * deliberately not mirrored to browser storage, a URL, or route state.
 */
export function SignupVerificationSessionProvider({children}: {children: ReactNode}) {
    const [verificationTicket, setVerificationTicket] = useState<string | null>(null);
    const clearVerificationTicket = useCallback(() => setVerificationTicket(null), []);

    return (
        <SignupVerificationSession.Provider
            value={{
                verificationTicket,
                setVerificationTicket,
                clearVerificationTicket,
            }}
        >
            {children}
        </SignupVerificationSession.Provider>
    );
}

export function useSignupVerificationSession() {
    const session = useContext(SignupVerificationSession);
    if (!session) {
        throw new Error("Signup verification must be used inside its session provider.");
    }
    return session;
}
