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
import {IPollingCenterResultsProcessed} from "../types";

import React from "react";
import {formatNumber, getResultPartyColor} from "../utils";

// TODO: Add a check for zero votes since its rendering badly, maybe exclude it from the chart
// TODO: Fix pie charts, it renders out of bounds when aspirants names are long
// TODO: add types for props

function PollingStationCandidatePieChart({
    data,
}: {
    /** The active race's results. Callers hold one query per tab. */
    data?: IPollingCenterResultsProcessed[] | null;
}) {
    const activeData: IPollingCenterResultsProcessed[] = data ?? [];

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
                            fill={getResultPartyColor(entry.party_color, index)}
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
