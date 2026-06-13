import {ArrowRight} from "lucide-react";

import React, {useEffect} from "react";

import type {SignupFlow} from "../useSignupFlow";

interface SummaryStepProps {
    flow: SignupFlow;
}

export default function SummaryStep({flow}: SummaryStepProps) {
    useEffect(() => {
        if (!flow.pollingCenter || !flow.ward) {
            flow.resetToStep("polling");
        }
    }, []);

    if (!flow.pollingCenter || !flow.ward || !flow.county || !flow.constituency) {
        return null;
    }

    return (
        <div className="summary">
            <h2>You are almost done…</h2>

            <div className="summary-card">
                <div className="summary-row">
                    <span className="k">County</span>
                    <span className="v">{flow.county.name}</span>
                </div>
                <div className="summary-row">
                    <span className="k">Constituency</span>
                    <span className="v">{flow.constituency.name}</span>
                </div>
                <div className="summary-row">
                    <span className="k">Ward</span>
                    <span className="v">{flow.ward.name}</span>
                </div>
                <div className="summary-row">
                    <span className="k">Polling Center</span>
                    <span className="v">{flow.pollingCenter.name}</span>
                </div>
            </div>

            <p className="note">Proceed below to share your information.</p>

            <div className="cta-stack">
                <a
                    className="submit"
                    href={`/ui/signup/accounts/${flow.ward.number}/${flow.pollingCenter.code}/`}
                >
                    Proceed to registration <ArrowRight />
                </a>
                <button type="button" className="geo-back" onClick={flow.back}>
                    Back
                </button>
            </div>
        </div>
    );
}
