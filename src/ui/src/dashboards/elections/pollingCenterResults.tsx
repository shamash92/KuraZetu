import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import React, {useEffect, useState} from "react";

import {Presentation} from "lucide-react";
import {TLevelTabs} from "./types";
import {useUser} from "../../App";

export type TLevelDjango =
    | "president"
    | "governor"
    | "senator"
    | "mp"
    | "women_rep"
    | "mca";

const levelsArray: TLevelDjango[] = [
    "president",
    "governor",
    "senator",
    "mp",
    "women_rep",
    "mca",
];

export interface IPollingCenterPresidentialResultsProcessed {
    fullName: string;
    party: string;
    party_color: string;
    totalVotes: number;
    countedStreams: number;
    percentage: number;
}

export interface IPollingCenterPresidentialResults {
    polling_station: {
        code: string;
        stream_number: number;
        registered_voters: number;
        date_created: string;
        date_modified: string;
        is_verified: boolean;
    };
    presidential_candidate: {
        id: number;
        first_name: string;
        last_name: string;
        surname: null | string;
        party: string;
        party_color: string;
        level: TLevelDjango;
        passport_photo: null | string;
        county: null;
        constituency: null;
        ward: null;
        is_verified: boolean;
        verified_by_party: boolean;
    };
    votes: number;
    is_verified: boolean;
}

function PollingCenterResults() {
    const [activeTab, setActiveTab] = useState<TLevelDjango>("president");

    const [presResults, setPresResults] = useState<
        IPollingCenterPresidentialResults[] | null
    >(null);

    const [presResultsProcessed, setPresResultsProcessed] = useState<
        IPollingCenterPresidentialResultsProcessed[] | null
    >(null);

    const [streamsNumber, setStreamsNumber] = useState<number>(0);
    const [totalVotes, setTotalVotes] = useState<number>(0);

    const {
        djangoUserPollingCenterCode,
        djangoUserPollingCenterName,
        djangoUserWardNumber,
        djangoUserConstName,
        djangoUserCountyName,
        djangoUserWardName,
    } = useUser();

    // Parse and aggregate candidate results across all streams
    function aggregateCandidateResults(data: IPollingCenterPresidentialResults[]) {
        // Map to hold aggregation per candidate id
        const candidateMap: Record<
            number,
            {
                fullName: string;
                party: string;
                party_color: string;
                totalVotes: number;
                countedStreams: number;
            }
        > = {};

        // Find total streams (unique polling_station.code + stream_number)
        const uniqueStreams = new Set(
            data.map(
                (item: IPollingCenterPresidentialResults) =>
                    `${item.polling_station.code}-${item.polling_station.stream_number}`,
            ),
        );
        const totalStreams = uniqueStreams.size;

        data.forEach((item: IPollingCenterPresidentialResults) => {
            const candidate = item.presidential_candidate;
            const candidateId = candidate.id;
            const fullName = [
                candidate.first_name,
                candidate.last_name,
                candidate.surname,
            ]
                .filter(Boolean)
                .join(" ")
                .trim();

            if (!candidateMap[candidateId]) {
                candidateMap[candidateId] = {
                    fullName,
                    party: candidate.party,
                    party_color: candidate.party_color,
                    totalVotes: 0,
                    countedStreams: 0,
                };
            }
            candidateMap[candidateId].totalVotes += item.votes;
            candidateMap[candidateId].countedStreams += 1;
        });

        // Calculate total votes for percentage
        const totalVotes = Object.values(candidateMap).reduce(
            (sum, c) => sum + c.totalVotes,
            0,
        );

        // Return as array, including totalStreams for reference and percentage for each candidate
        return {
            totalStreams,
            candidates: Object.values(candidateMap).map((c) => ({
                ...c,
                percentage: totalVotes > 0 ? (c.totalVotes / totalVotes) * 100 : 0,
            })),
            totalVotes,
        };
    }

    useEffect(() => {
        console.log("useEffect to call counties");

        if (presResults === null) {
            fetch(
                `/api/results/polling-center/${djangoUserWardNumber}/${djangoUserPollingCenterCode}/presidential/`,
                {
                    method: "GET",
                },
            )
                .then((res) => res.json())
                .then((data) => {
                    // console.log(data, "data");

                    if (data.length > 0) {
                        setPresResults(data["data"]);
                        setStreamsNumber(data["totalStreams"]);
                    }

                    let y = aggregateCandidateResults(data["data"]);
                    console.log(y, "y");

                    setTotalVotes(y.totalVotes);
                    setStreamsNumber(y.totalStreams);

                    setPresResultsProcessed(y.candidates);
                });
        }
    }, [presResults]);

    // Mock data for county tabs
    const countyData = {
        president: [
            {
                name: "Candidate 1",
                party: "Party A",
                votes: 230450,
                percentage: 17.2,
                color: "#0015BC",
            },
            {
                name: "Candidate 2",
                party: "Party B",
                votes: 172340,
                percentage: 82.8,
                color: "#E9141D",
            },
        ],
        governor: [
            {
                name: "Candidate 1",
                party: "Party A",
                votes: 230450,
                percentage: 57.2,
                color: "#0015BC",
            },
            {
                name: "Candidate 2",
                party: "Party B",
                votes: 172340,
                percentage: 42.8,
                color: "#E9141D",
            },
        ],
        senator: [
            {
                name: "Candidate 1",
                party: "Party A",
                votes: 215670,
                percentage: 53.6,
                color: "#0015BC",
            },
            {
                name: "Candidate 2",
                party: "Party B",
                votes: 186590,
                percentage: 46.4,
                color: "#E9141D",
            },
        ],
        women_rep: [
            {
                name: "Candidate 1",
                party: "Party B",
                votes: 195230,
                percentage: 48.5,
                color: "#E9141D",
            },
            {
                name: "Candidate 2",
                party: "Party A",
                votes: 207340,
                percentage: 51.5,
                color: "#0015BC",
            },
        ],

        mp: [
            {
                name: "Candidate 1",
                party: "Party B",
                votes: 195230,
                percentage: 48.5,
                color: "#E9141D",
            },
            {
                name: "Candidate 2",
                party: "Party A",
                votes: 207340,
                percentage: 51.5,
                color: "#0015BC",
            },
        ],
        mca: [
            {
                name: "Candidate 1",
                party: "Party B",
                votes: 45230,
                percentage: 31.2,
                color: "#E9141D",
            },
            {
                name: "Candidate 2",
                party: "Party A",
                votes: 52170,
                percentage: 36.0,
                color: "#0015BC",
            },
            {
                name: "Candidate 3",
                party: "Independent",
                votes: 47620,
                percentage: 32.8,
                color: "#FFB90F",
            },
        ],
    };

    const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

    // Format large numbers with commas
    const formatNumber = (num) => {
        return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    };

    return (
        <div className="p-4 mb-6 bg-white rounded-lg shadow-md">
            <h2 className="mb-4 text-xl font-bold text-center">
                {djangoUserPollingCenterName ? djangoUserPollingCenterName : ""} Polling
                Center Election Results
            </h2>
            {/* Tabs */}
            <div className="flex mb-4 border-b">
                {levelsArray.map((tab) => (
                    <button
                        key={tab}
                        className={`px-4 py-2 font-medium ${
                            activeTab === tab
                                ? "border-b-2 border-blue-500 text-blue-600"
                                : "text-gray-500"
                        }`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === "women_rep"
                            ? "Women Rep"
                            : tab === "mp"
                            ? "MP"
                            : tab === "mca"
                            ? "MCA"
                            : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>
            {/* Tab Content */}
            <div className="mb-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Left side: List of candidates */}
                    <div>
                        <h3 className="mb-3 font-semibold">Candidates</h3>
                        <div className="space-y-3">
                            {activeTab === "president" &&
                                presResultsProcessed &&
                                presResultsProcessed.map((candidate) => (
                                    <div
                                        key={candidate.fullName}
                                        className="flex items-center justify-between p-3 border-l-4 rounded-lg shadow-sm"
                                        style={{borderColor: candidate.party_color}}
                                    >
                                        <div>
                                            <div className="font-medium">
                                                {candidate.fullName}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {candidate.party}
                                            </div>
                                        </div>
                                        <div>
                                            <p style={{fontSize: "0.8rem"}}>
                                                {candidate.countedStreams}/
                                                {streamsNumber} streams
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <div className="font-bold">
                                                {candidate.percentage.toFixed(2)}%
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {formatNumber(candidate.totalVotes)}{" "}
                                                votes
                                            </div>
                                        </div>
                                    </div>
                                ))}

                            {countyData[activeTab].map((candidate) => (
                                <div
                                    key={candidate.name}
                                    className="flex items-center justify-between p-3 border-l-4 rounded-lg shadow-sm"
                                    style={{borderColor: candidate.color}}
                                >
                                    <div>
                                        <div className="font-medium">
                                            {candidate.name}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {candidate.party}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">
                                            {candidate.percentage}%
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {formatNumber(candidate.votes)} votes
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right side: Pie chart */}
                    <div>
                        <h3 className="mb-3 font-semibold">Vote Distribution</h3>
                        <div className="h-64">
                            {activeTab === "president" && presResultsProcessed && (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={presResultsProcessed}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="totalVotes"
                                            nameKey="fullName"
                                            label={({name, percentage}) =>
                                                `${name}: ${percentage.toFixed(2)}%`
                                            }
                                        >
                                            {presResultsProcessed.map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.party_color}
                                                    />
                                                ),
                                            )}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => [
                                                `${formatNumber(value)} votes`,
                                                "Votes",
                                            ]}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}

                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={countyData[activeTab]}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="votes"
                                        nameKey="name"
                                        label={({name, percentage}) =>
                                            `${name}: ${percentage}%`
                                        }
                                    >
                                        {countyData[activeTab].map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => [
                                            `${formatNumber(value)} votes`,
                                            "Votes",
                                        ]}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PollingCenterResults;
