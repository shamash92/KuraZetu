import React from "react";
import {formatNumber} from "../utils/index";

function PollingCandidateResults({candidate, streamsNumber}) {
    return (
        <div
            className="flex items-center justify-between p-3 border-l-4 rounded-lg shadow-sm"
            style={{borderColor: candidate.party_color}}
        >
            <div>
                <div className="font-medium">{candidate.fullName}</div>
                <div className="text-sm text-gray-600">{candidate.party}</div>
            </div>
            <div>
                <p style={{fontSize: "0.8rem"}}>
                    {candidate.countedStreams}/{streamsNumber} streams
                </p>
            </div>

            <div className="text-right">
                <div className="font-bold">
                    {formatNumber(candidate.totalVotes)} votes
                </div>
                <div className="text-sm text-gray-600">
                    {candidate.percentage.toFixed(2)}%
                </div>
            </div>
        </div>
    );
}

export default PollingCandidateResults;
