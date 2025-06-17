import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {useEffect, useState} from "react";

import CountyResults from "./countyResults";
import {IPresidentialNationalResults} from "./types";
import PlayGameCallToActionButton from "../../landing-pages/gameButton";
import PollingCenterResults from "./pollingCenterResults";
import {formatNumber} from "./utils";
import {useUser} from "../../App";

//TODO: split into smaller components for each administrative level
export default function ResultsDashboard() {
    const [activeTab, setActiveTab] = useState("governor");
    const [presidentialData, setPresidentialData] = useState<
        IPresidentialNationalResults[]
    >([]);

    const [showPinGameAlert, setShowPinGameAlert] = useState(true);

    const {
        djangoUserPollingCenterCode,
        djangoUserPollingCenterName,
        djangoUserWardNumber,
        djangoUserConstName,
        djangoUserCountyName,
        djangoUserWardName,
    } = useUser();

    // Mock data for county tabs
    const countyData = {
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
        womanRep: [
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
                votes: 95230,
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
            {
                name: "Candidate 3",
                party: "Party A",
                votes: 7340,
                percentage: 51.5,
                color: "#DEBEBC",
            },
            {
                name: "Candidate 4",
                party: "Party A",
                votes: 57340,
                percentage: 51.5,
                color: "#fE19BC",
            },
            {
                name: "Candidate 5",
                party: "Party A",
                votes: 107340,
                percentage: 51.5,
                color: "#19F5BC",
            },
            {
                name: "Candidate 6",
                party: "Party A",
                votes: 340,
                percentage: 51.5,
                color: "#0F9BC3",
            },
        ],
        wardMCAs: [
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

    useEffect(() => {
        // Fetch data from the API
        Example: fetch("/api/results/total-votes/presidential/")
            .then((response) => response.json())
            .then((data) => {
                // console.log(data, "data");
                setPresidentialData(data["results"]);
            });
    }, []);

    return (
        <div className="flex flex-col w-full min-h-screen p-4 bg-gray-100 ">
            {/* Header */}
            <header className="flex w-full p-4 mb-4 text-white bg-blue-900 rounded-t-lg">
                <h1 className="text-sm font-bold text-center md:text-2xl">
                    2027 Election Results Dashboard
                </h1>
            </header>

            <PlayGameCallToActionButton />

            {/* Presidential Results Section */}
            <div className="flex flex-col w-full p-4 mb-6 bg-white rounded-lg shadow-md">
                <div className="flex flex-col items-center justify-between p-4 mb-4 rounded-lg md:flex-row bg-blue-50">
                    <div className="flex items-center w-full gap-2 md:w-1/2">
                        <h2 className="text-xl font-bold text-center ">
                            Presidential Election Results
                        </h2>
                    </div>

                    {presidentialData.length > 0 &&
                        presidentialData[0].total_polling_stations_with_results && (
                            <div className="flex flex-col items-center justify-center w-full rounded-lg shadow-sm md:w-1/2 ">
                                {(() => {
                                    const reported =
                                        presidentialData[0]
                                            .total_polling_stations_with_results;
                                    const total =
                                        presidentialData[0]
                                            .nationwide_polling_stations_count;
                                    const percent = total
                                        ? (reported / total) * 100
                                        : 0;
                                    return (
                                        <div className="flex flex-col items-center justify-center w-full">
                                            <div className="flex items-center justify-between w-full px-4 mb-2">
                                                <span className="text-sm font-medium text-blue-900">
                                                    Polling Stations Reported
                                                </span>
                                                <span className="text-sm font-medium text-blue-900">
                                                    {reported} / {total}
                                                </span>
                                            </div>
                                            <div className="relative w-full h-6 overflow-hidden bg-blue-100 rounded-full">
                                                <div
                                                    className="absolute top-0 left-0 h-full transition-all duration-700 bg-gradient-to-r from-blue-500 to-blue-700"
                                                    style={{width: `${percent}%`}}
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-sm font-semibold text-white drop-shadow">
                                                        {percent.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                </div>

                <div className="flex flex-wrap justify-center gap-6 mb-6">
                    {presidentialData.map((candidate) => (
                        <div
                            key={candidate.name}
                            className="flex flex-col items-center w-64 overflow-hidden border-t-4 rounded-lg shadow-md"
                            style={{borderColor: candidate.party_color}}
                        >
                            <div className="flex items-center justify-center w-full p-3 bg-gray-100">
                                <div className="flex items-center gap-3">
                                    {candidate.image ? (
                                        <img
                                            src={candidate.image}
                                            alt={candidate.name}
                                            className="object-cover w-16 h-16 rounded-full"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-300 rounded-full" />
                                    )}

                                    <div>
                                        <h3 className="text-lg font-bold">
                                            {candidate.name}
                                        </h3>
                                        <p
                                            className="text-sm"
                                            style={{color: candidate.party_color}}
                                        >
                                            {candidate.party}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full p-4 text-center">
                                <div className="text-3xl font-bold">
                                    {candidate.percentage}%
                                </div>
                                <div className="text-sm text-gray-600">
                                    {formatNumber(candidate.votes)} votes
                                </div>
                                {candidate.percentage > 50 && (
                                    <div className="inline-block px-2 py-1 mt-2 text-sm font-medium text-green-800 bg-green-100 rounded-full">
                                        Leading
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* National Results Chart */}
                <div className="mt-6">
                    <h3 className="mb-3 font-semibold text-center">
                        National Vote Breakdown
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={presidentialData}
                                layout="vertical"
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" />
                                <Tooltip
                                    formatter={(value) => [
                                        `${formatNumber(
                                            parseInt(value.toString()),
                                        )} votes`,
                                        "Votes",
                                    ]}
                                    labelFormatter={(name) => `Candidate: ${name}`}
                                />
                                <Legend />
                                <Bar dataKey="votes" name="Votes">
                                    {presidentialData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.party_color}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            {/* County Results Section */}
            <div className="p-4 mb-6 bg-white rounded-lg shadow-md">
                <CountyResults />
            </div>
            {/* Results at Polling Center*/}
            <PollingCenterResults />
            {/* Footer */}
            <footer className="mt-4 text-sm text-center text-gray-500">
                Last updated: May 6, 2025 9:00 pm | Data source: Community members
            </footer>
        </div>
    );
}
