import {Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip} from "recharts";
import {
    IPollingCenterCandidateResults,
    IPollingCenterResultsProcessed,
    TLevelDjango,
} from "./types";
import {aggregateCandidateResults, formatNumber} from "./utils";
import {useEffect, useState} from "react";

import NoResultsComponent from "./components/noResults";
import PollingCandidateResults from "./components/pollingCandidateResults";
import PollingStationCandidatePieChart from "./components/pollingStationCandidatePieChart";
import {useUser} from "../../App";

const levelsArray: TLevelDjango[] = [
    "president",
    "governor",
    "senator",
    "women_rep",
    "mp",
    "mca",
];

function PollingCenterResults() {
    const [activeTab, setActiveTab] = useState<TLevelDjango>("president");

    const [presResults, setPresResults] = useState<
        IPollingCenterCandidateResults[] | null
    >(null);

    const [presResultsProcessed, setPresResultsProcessed] = useState<
        IPollingCenterResultsProcessed[] | null
    >(null);

    const [streamsNumber, setStreamsNumber] = useState<number>(0);
    const [totalPresVotes, setTotalPresVotes] = useState<number>(0);

    // governor results
    const [governorResults, setGovernorResults] = useState<
        IPollingCenterCandidateResults[] | null
    >(null);
    const [totalGovernorVotes, setTotalGovernorVotes] = useState<number>(0);
    const [govResultsProcessed, setGovResultsProcessed] = useState<
        IPollingCenterResultsProcessed[] | null
    >(null);

    // senator results
    const [senatorResults, setSenatorResults] = useState<
        IPollingCenterCandidateResults[] | null
    >(null);
    const [totalSenatorVotes, setTotalSenatorVotes] = useState<number>(0);
    const [senatorResultsProcessed, setSenatorResultsProcessed] = useState<
        IPollingCenterResultsProcessed[] | null
    >(null);

    // women rep results
    const [womenRepResults, setWomenRepResults] = useState<
        IPollingCenterCandidateResults[] | null
    >(null);
    const [totalWomenRepVotes, setTotalWomenRepVotes] = useState<number>(0);
    const [womenRepResultsProcessed, setWomenRepResultsProcessed] = useState<
        IPollingCenterResultsProcessed[] | null
    >(null);

    // mp results
    const [mpResults, setMpResults] = useState<IPollingCenterCandidateResults[] | null>(
        null,
    );
    const [totalMpVotes, setTotalMpVotes] = useState<number>(0);
    const [mpResultsProcessed, setMpResultsProcessed] = useState<
        IPollingCenterResultsProcessed[] | null
    >(null);

    // mca results
    const [mcaResults, setMcaResults] = useState<
        IPollingCenterCandidateResults[] | null
    >(null);
    const [totalMcaVotes, setTotalMcaVotes] = useState<number>(0);
    const [mcaResultsProcessed, setMcaResultsProcessed] = useState<
        IPollingCenterResultsProcessed[] | null
    >(null);

    const {
        djangoUserPollingCenterCode,
        djangoUserPollingCenterName,
        djangoUserWardNumber,
        djangoUserConstName,
        djangoUserCountyName,
        djangoUserWardName,
    } = useUser();

    useEffect(() => {
        console.log("useEffect to call data");

        if (presResults === null && activeTab === "president") {
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

                    let y = aggregateCandidateResults(data["data"], "president");
                    // console.log(y, 'y');

                    setTotalPresVotes(y.totalVotes);
                    setStreamsNumber(y.totalStreams);

                    setPresResultsProcessed(y.candidates);
                });
        }

        if (activeTab === "governor" && governorResults === null) {
            fetch(
                `/api/results/polling-center/${djangoUserWardNumber}/${djangoUserPollingCenterCode}/governor/`,
                {
                    method: "GET",
                },
            )
                .then((res) => res.json())
                .then((data) => {
                    // console.log(data, "gov data");

                    if (data.length > 0) {
                        setGovernorResults(data["data"]);
                        // setStreamsNumber(data['totalStreams']);
                    }

                    let y = aggregateCandidateResults(data["data"], "governor");
                    // console.log(y, "y governor");

                    setTotalGovernorVotes(y.totalVotes);
                    // setStreamsNumber(y.totalStreams);

                    setGovResultsProcessed(y.candidates);
                });
        }

        if (activeTab === "senator" && senatorResults === null) {
            fetch(
                `/api/results/polling-center/${djangoUserWardNumber}/${djangoUserPollingCenterCode}/senator/`,
                {
                    method: "GET",
                },
            )
                .then((res) => res.json())
                .then((data) => {
                    // console.log(data, "senator data");

                    if (data.length > 0) {
                        setSenatorResults(data["data"]);
                        // setStreamsNumber(data['totalStreams']);
                    }

                    let y = aggregateCandidateResults(data["data"], "senator");
                    // console.log(y, "y senator");

                    setTotalSenatorVotes(y.totalVotes);
                    // setStreamsNumber(y.totalStreams);

                    setSenatorResultsProcessed(y.candidates);
                });
        }

        if (activeTab === "women_rep" && womenRepResults === null) {
            fetch(
                `/api/results/polling-center/${djangoUserWardNumber}/${djangoUserPollingCenterCode}/women-rep/`,
                {
                    method: "GET",
                },
            )
                .then((res) => res.json())
                .then((data) => {
                    // console.log(data, "women rep data");

                    if (data.length > 0) {
                        setWomenRepResults(data["data"]);
                        // setStreamsNumber(data['totalStreams']);
                    }

                    let y = aggregateCandidateResults(data["data"], "women_rep");
                    // console.log(y, "y women rep");

                    setTotalWomenRepVotes(y.totalVotes);
                    // setStreamsNumber(y.totalStreams);

                    setWomenRepResultsProcessed(y.candidates);
                });
        }

        if (activeTab === "mp" && mpResults === null) {
            fetch(
                `/api/results/polling-center/${djangoUserWardNumber}/${djangoUserPollingCenterCode}/mp/`,
                {
                    method: "GET",
                },
            )
                .then((res) => res.json())
                .then((data) => {
                    // console.log(data, "mp data");

                    if (data.length > 0) {
                        setMpResults(data["data"]);
                    }

                    let y = aggregateCandidateResults(data["data"], "mp");
                    // console.log(y, "y mp");

                    setTotalMpVotes(y.totalVotes);

                    setMpResultsProcessed(y.candidates);
                });
        }

        if (activeTab === "mca" && mcaResults === null) {
            fetch(
                `/api/results/polling-center/${djangoUserWardNumber}/${djangoUserPollingCenterCode}/mca/`,
                {
                    method: "GET",
                },
            )
                .then((res) => res.json())
                .then((data) => {
                    // console.log(data, "mca data");

                    if (data.length > 0) {
                        setMcaResults(data["data"]);
                    }

                    let y = aggregateCandidateResults(data["data"], "mca");
                    // console.log(y, "y mca");

                    setTotalMcaVotes(y.totalVotes);

                    setMcaResultsProcessed(y.candidates);
                });
        }
    }, [activeTab]);

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
                            totalPresVotes > 0 &&
                            presResultsProcessed !== null ? (
                                presResultsProcessed.map((candidate) => (
                                    <PollingCandidateResults
                                        key={candidate.fullName}
                                        candidate={candidate}
                                        streamsNumber={streamsNumber}
                                    />
                                ))
                            ) : activeTab === "president" ? (
                                <NoResultsComponent />
                            ) : null}

                            {activeTab === "governor" &&
                            totalGovernorVotes > 0 &&
                            govResultsProcessed !== null ? (
                                govResultsProcessed.map((candidate, index) => (
                                    <PollingCandidateResults
                                        key={index}
                                        candidate={candidate}
                                        streamsNumber={streamsNumber}
                                    />
                                ))
                            ) : activeTab === "governor" ? (
                                <NoResultsComponent />
                            ) : null}

                            {activeTab === "senator" &&
                            totalSenatorVotes > 0 &&
                            senatorResultsProcessed !== null ? (
                                senatorResultsProcessed.map((candidate) => (
                                    <PollingCandidateResults
                                        key={candidate.fullName}
                                        candidate={candidate}
                                        streamsNumber={streamsNumber}
                                    />
                                ))
                            ) : activeTab === "senator" ? (
                                <NoResultsComponent />
                            ) : null}

                            {activeTab === "women_rep" &&
                            totalWomenRepVotes > 0 &&
                            womenRepResultsProcessed !== null ? (
                                womenRepResultsProcessed.map((candidate) => (
                                    <PollingCandidateResults
                                        key={candidate.fullName}
                                        candidate={candidate}
                                        streamsNumber={streamsNumber}
                                    />
                                ))
                            ) : activeTab === "women_rep" ? (
                                <NoResultsComponent />
                            ) : null}

                            {activeTab === "mp" &&
                            totalMpVotes > 0 &&
                            mpResultsProcessed !== null ? (
                                mpResultsProcessed.map((candidate) => (
                                    <PollingCandidateResults
                                        key={candidate.fullName}
                                        candidate={candidate}
                                        streamsNumber={streamsNumber}
                                    />
                                ))
                            ) : activeTab === "mp" ? (
                                <NoResultsComponent />
                            ) : null}

                            {activeTab === "mca" &&
                            totalMcaVotes > 0 &&
                            mcaResultsProcessed !== null ? (
                                mcaResultsProcessed.map((candidate) => (
                                    <PollingCandidateResults
                                        key={candidate.fullName}
                                        candidate={candidate}
                                        streamsNumber={streamsNumber}
                                    />
                                ))
                            ) : activeTab === "mca" ? (
                                <NoResultsComponent />
                            ) : null}
                        </div>
                    </div>

                    {/* Right side: Pie chart */}
                    <div>
                        <h3 className="mb-3 font-semibold text-center">
                            Vote Distribution
                        </h3>
                        <div className="h-64">
                            {presResultsProcessed !== null ||
                            governorResults !== null ||
                            senatorResults !== null ||
                            womenRepResults !== null ||
                            mpResultsProcessed !== null ||
                            mcaResultsProcessed !== null ? (
                                <PollingStationCandidatePieChart
                                    activeTab={activeTab}
                                    presResultsProcessed={presResultsProcessed}
                                    govResultsProcessed={govResultsProcessed}
                                    senatorResultsProcessed={senatorResultsProcessed}
                                    womenRepResultsProcessed={womenRepResultsProcessed}
                                    mpResultsProcessed={mpResultsProcessed}
                                    mcaResultsProcessed={mcaResultsProcessed}
                                />
                            ) : (
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
                                            {countyData[activeTab].map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.color}
                                                    />
                                                ),
                                            )}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => [
                                                `${formatNumber(
                                                    parseInt(value.toString()),
                                                )} votes`,
                                                "Votes",
                                            ]}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PollingCenterResults;
