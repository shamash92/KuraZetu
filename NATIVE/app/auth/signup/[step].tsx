import {Redirect, useLocalSearchParams} from "expo-router";

import {MapUpdates} from "../signUp";
import React from "react";

const validSteps = ["county", "constituency", "ward", "centre"] as const;

export default function SignupLocationRoute() {
    const {step} = useLocalSearchParams<{step: string}>();

    if (!validSteps.includes(step as (typeof validSteps)[number])) {
        return <Redirect href="/auth/signup/county" />;
    }

    return <MapUpdates routeStep={step as (typeof validSteps)[number]} />;
}
