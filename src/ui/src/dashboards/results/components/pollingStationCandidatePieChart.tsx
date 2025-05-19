import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {IPollingCenterResultsProcessed, TLevelDjango} from "../types";

import React from "react";
import {formatNumber} from "../utils";

// TODO: add types for props
function PollingStationCandidatePieChart({
    activeTab,
    presResultsProcessed,
    govResultsProcessed,
    senatorResultsProcessed,
    womenRepResultsProcessed,
    mpResultsProcessed,
    mcaResultsProcessed,
}: {
    activeTab: TLevelDjango;
    presResultsProcessed: IPollingCenterResultsProcessed[] | null;
    govResultsProcessed: IPollingCenterResultsProcessed[] | null;
    senatorResultsProcessed: IPollingCenterResultsProcessed[] | null;
    womenRepResultsProcessed: IPollingCenterResultsProcessed[] | null;
    mpResultsProcessed: IPollingCenterResultsProcessed[] | null;
    mcaResultsProcessed: IPollingCenterResultsProcessed[] | null;
}) {
    // Determine which data to use based on the active tab
    let activeData: IPollingCenterResultsProcessed[] = [];
    if (activeTab === "president" && presResultsProcessed) {
        activeData = presResultsProcessed;
    } else if (activeTab === "governor" && govResultsProcessed) {
        activeData = govResultsProcessed;
    } else if (activeTab === "senator" && senatorResultsProcessed) {
        activeData = senatorResultsProcessed;
    } else if (activeTab === "women_rep" && womenRepResultsProcessed) {
        activeData = womenRepResultsProcessed;
    } else if (activeTab === "mp" && mpResultsProcessed) {
        activeData = mpResultsProcessed;
    } else if (activeTab === "mca" && mcaResultsProcessed) {
        activeData = mcaResultsProcessed;
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={activeData}
                    dataKey="totalVotes"
                    nameKey="fullName"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    fill="#8884d8"
                    label={({name, percent}) =>
                        `${name}: ${(percent * 100).toFixed(1)}%`
                    }
                >
                    {activeData.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={activeData[index].party_color}
                        />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value: number, name: string, props: any) => [
                        `${formatNumber(value)} votes`,
                        props.payload.fullName,
                    ]}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}

export default PollingStationCandidatePieChart;
