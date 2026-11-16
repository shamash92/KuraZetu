import React from "react";
import {ResultsChart} from "@/src/@/components/ui/results-chart";
import type {IPollingCenterResultsProcessed} from "../types";
import {getResultPartyColor} from "../utils";

export default function PollingStationCandidatePieChart({data}: {data?: Array<IPollingCenterResultsProcessed> | null}) {
    return <ResultsChart kind="donut" label="Votes by candidate" data={(data ?? []).map((entry, index) => ({name: entry.fullName, value: entry.totalVotes, color: getResultPartyColor(entry.party_color, index)}))} />;
}
