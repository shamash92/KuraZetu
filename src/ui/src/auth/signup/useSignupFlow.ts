import {useCallback, useEffect, useState} from "react";

export type SignupStep =
    | "choice"
    | "county"
    | "constituency"
    | "ward"
    | "polling"
    | "summary";

export interface CountySelection {
    number: number;
    name: string;
}
export interface ConstituencySelection {
    number: number;
    name: string;
}
export interface WardSelection {
    number: number;
    name: string;
}
export interface PollingSelection {
    code: string;
    name: string;
}

export interface SignupFlowState {
    step: SignupStep;
    county: CountySelection | null;
    constituency: ConstituencySelection | null;
    ward: WardSelection | null;
    pollingCenter: PollingSelection | null;
}

const STORAGE_KEY = "kz_signup_flow";

// Forward order. `choice` is the entry card; the rest are the ladder.
const STEP_ORDER: SignupStep[] = [
    "choice",
    "county",
    "constituency",
    "ward",
    "polling",
    "summary",
];

// The selection a given step is responsible for picking. Used by `back` so we
// clear the level we are returning to, letting the user re-pick it.
const STEP_SELECTION: Partial<Record<SignupStep, keyof SignupFlowState>> = {
    county: "county",
    constituency: "constituency",
    ward: "ward",
    polling: "pollingCenter",
};

const EMPTY: SignupFlowState = {
    step: "choice",
    county: null,
    constituency: null,
    ward: null,
    pollingCenter: null,
};

function isStep(value: unknown): value is SignupStep {
    return typeof value === "string" && (STEP_ORDER as string[]).includes(value);
}

function loadState(): SignupFlowState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return EMPTY;
        const parsed = JSON.parse(raw) as Partial<SignupFlowState>;
        return {
            step: isStep(parsed.step) ? parsed.step : "choice",
            county: parsed.county ?? null,
            constituency: parsed.constituency ?? null,
            ward: parsed.ward ?? null,
            pollingCenter: parsed.pollingCenter ?? null,
        };
    } catch {
        return EMPTY;
    }
}

export function useSignupFlow() {
    const [state, setState] = useState<SignupFlowState>(loadState);

    // Persist every change so refresh/back restores the same step + selections.
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {
            // storage full / disabled — flow still works in-memory.
        }
    }, [state]);

    const start = useCallback(() => {
        setState((prev) => ({...prev, step: "county"}));
    }, []);

    const selectCounty = useCallback((county: CountySelection) => {
        setState({
            step: "constituency",
            county,
            constituency: null,
            ward: null,
            pollingCenter: null,
        });
    }, []);

    const selectConstituency = useCallback((constituency: ConstituencySelection) => {
        setState((prev) => ({
            ...prev,
            step: "ward",
            constituency,
            ward: null,
            pollingCenter: null,
        }));
    }, []);

    const selectWard = useCallback((ward: WardSelection) => {
        setState((prev) => ({
            ...prev,
            step: "polling",
            ward,
            pollingCenter: null,
        }));
    }, []);

    const selectPollingCenter = useCallback((pollingCenter: PollingSelection) => {
        setState((prev) => ({...prev, step: "summary", pollingCenter}));
    }, []);

    const back = useCallback(() => {
        setState((prev) => {
            const index = STEP_ORDER.indexOf(prev.step);
            if (index <= 0) return prev;
            const target = STEP_ORDER[index - 1];
            const next: SignupFlowState = {...prev, step: target};
            // Clear the selection owned by the step we are returning to, plus
            // anything downstream of it, so the user re-picks cleanly.
            const cleared = STEP_SELECTION[target];
            if (cleared) {
                const targetIdx = STEP_ORDER.indexOf(target);
                STEP_ORDER.forEach((s, i) => {
                    const key = STEP_SELECTION[s];
                    if (key && i >= targetIdx) {
                        (next as unknown as Record<string, unknown>)[key] = null;
                    }
                });
            }
            return next;
        });
    }, []);

    const reset = useCallback(() => {
        setState(EMPTY);
    }, []);

    // Drop a stale selection (e.g. a saved id missing from a fresh fetch) and
    // bounce back to the step that owns it.
    const resetToStep = useCallback((step: SignupStep) => {
        setState((prev) => {
            const targetIdx = STEP_ORDER.indexOf(step);
            const next: SignupFlowState = {...prev, step};
            STEP_ORDER.forEach((s, i) => {
                const key = STEP_SELECTION[s];
                if (key && i >= targetIdx) {
                    (next as unknown as Record<string, unknown>)[key] = null;
                }
            });
            return next;
        });
    }, []);

    return {
        ...state,
        start,
        selectCounty,
        selectConstituency,
        selectWard,
        selectPollingCenter,
        back,
        reset,
        resetToStep,
    };
}

export type SignupFlow = ReturnType<typeof useSignupFlow>;
