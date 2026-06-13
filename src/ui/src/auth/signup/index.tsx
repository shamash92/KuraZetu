import "../../landing-pages/landing.css";
import "./auth.css";

import React from "react";

import {useSignupFlow} from "./useSignupFlow";
import ChoiceStep from "./flow/ChoiceStep";
import CountyStep from "./flow/CountyStep";
import ConstituencyStep from "./flow/ConstituencyStep";
import WardStep from "./flow/WardStep";
import PollingStep from "./flow/PollingStep";
import SummaryStep from "./flow/SummaryStep";

function SignupComponent() {
    const flow = useSignupFlow();

    return (
        <div className="kz-auth">
            {flow.step === "choice" && <ChoiceStep onStart={flow.start} />}
            {flow.step === "county" && <CountyStep flow={flow} />}
            {flow.step === "constituency" && <ConstituencyStep flow={flow} />}
            {flow.step === "ward" && <WardStep flow={flow} />}
            {flow.step === "polling" && <PollingStep flow={flow} />}
            {flow.step === "summary" && <SummaryStep flow={flow} />}
        </div>
    );
}

export default SignupComponent;
