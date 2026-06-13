import {ArrowRight} from "lucide-react";

import React from "react";

interface ChoiceStepProps {
    onStart: () => void;
}

export default function ChoiceStep({onStart}: ChoiceStepProps) {
    return (
        <div className="welcome">
            <div className="eyebrow">Join KuraZetu</div>
            <h2>
                Help keep the <span className="accent">count honest.</span>
            </h2>
            <div className="path-grid">
                <button type="button" className="path-tile primary" onClick={onStart}>
                    <span className="tag">New here</span>
                    <h3>Create your account</h3>
                    <p>
                        Start your registration to join the community and access every
                        feature. It only takes a few minutes.
                    </p>
                    <span className="go">
                        Start Registration <ArrowRight />
                    </span>
                </button>

                <a className="path-tile" href="/accounts/login/">
                    <span className="tag">Returning</span>
                    <h3>Already a member?</h3>
                    <p>Welcome back — pick up right where you left off.</p>
                    <span className="go">
                        Log in <ArrowRight />
                    </span>
                </a>
            </div>
        </div>
    );
}
