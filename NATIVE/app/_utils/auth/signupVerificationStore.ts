import {create} from "zustand";

type SignupVerificationState = {
    verificationTicket: string | null;
    setVerificationTicket: (ticket: string) => void;
    clearVerificationTicket: () => void;
};

/**
 * The opaque signup ticket exists only while this app process is running. It
 * must not be persisted to SecureStore, AsyncStorage, or a route URL.
 */
export const useSignupVerificationStore = create<SignupVerificationState>((set) => ({
    verificationTicket: null,
    setVerificationTicket: (verificationTicket) => set({verificationTicket}),
    clearVerificationTicket: () => set({verificationTicket: null}),
}));
