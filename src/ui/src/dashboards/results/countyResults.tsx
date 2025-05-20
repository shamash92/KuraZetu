import {Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip} from "recharts";
import {
    ICountyPresResults,
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

export function getAPIUrl(level: TLevelDjango) {
    return `/api/results/county/${level}/`;
}

function CountyResults() {
    const [activeTab, setActiveTab] = useState<TLevelDjango>("president");

    const [presResultsProcessed, setPresResultsProcessed] = useState<
        ICountyPresResults[] | null
    >(null);

    const [streamsNumber, setStreamsNumber] = useState<number>(0);

    // governor results

    const [govResultsProcessed, setGovResultsProcessed] = useState<
        ICountyPresResults[] | null
    >(null);

    // senator results

    const [senatorResultsProcessed, setSenatorResultsProcessed] = useState<
        ICountyPresResults[] | null
    >(null);

    // women rep results

    const [womenRepResultsProcessed, setWomenRepResultsProcessed] = useState<
        ICountyPresResults[] | null
    >(null);

    // mp results

    const [mpResultsProcessed, setMpResultsProcessed] = useState<
        ICountyPresResults[] | null
    >(null);

    // mca results

    const [mcaResultsProcessed, setMcaResultsProcessed] = useState<
        ICountyPresResults[] | null
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
        console.log("useEffect to call county data");

        let apiUrl = getAPIUrl("president");

        if (activeTab === "president" && presResultsProcessed === null) {
            fetch(apiUrl, {
                method: "GET",
            })
                .then((res) => res.json())
                .then((data) => {
                    // console.log(data, "data");

                    if (data["results"].length > 0) {
                        setPresResultsProcessed(data["results"]);
                    }
                });
        }

        if (activeTab === "governor" && govResultsProcessed === null) {
            let apiUrl = getAPIUrl("governor");

            fetch(apiUrl, {
                method: "GET",
            })
                .then((res) => res.json())
                .then((data) => {
                    // console.log(data, "gov data");

                    if (data["results"].length > 0) {
                        setGovResultsProcessed(data["results"]);
                    }
                });
        }

        if (activeTab === "senator" && senatorResultsProcessed === null) {
            let apiUrl = getAPIUrl("senator");

            fetch(apiUrl, {
                method: "GET",
            })
                .then((res) => res.json())
                .then((data) => {
                    // console.log(data, "senator data");

                    if (data["results"].length > 0) {
                        setSenatorResultsProcessed(data["results"]);
                    }
                });
        }

        if (activeTab === "women_rep" && womenRepResultsProcessed === null) {
            let apiUrl = getAPIUrl("women_rep");

            fetch(apiUrl, {
                method: "GET",
            })
                .then((res) => res.json())
                .then((data) => {
                    // console.log(data, "women rep data");
                    if (data["results"].length > 0) {
                        setWomenRepResultsProcessed(data["results"]);
                    }
                });
        }

        if (activeTab === "mp" && mpResultsProcessed === null) {
            let apiUrl = getAPIUrl("mp");

            fetch(apiUrl, {
                method: "GET",
            })
                .then((res) => res.json())
                .then((data) => {
                    // console.log(data, "mp  data");
                    if (data["results"].length > 0) {
                        setMpResultsProcessed(data["results"]);
                    }
                });
        }

        if (activeTab === "mca" && mcaResultsProcessed === null) {
            let apiUrl = getAPIUrl("mca");

            fetch(apiUrl, {
                method: "GET",
            })
                .then((res) => res.json())
                .then((data) => {
                    // console.log(data, "mp  data");
                    if (data["results"].length > 0) {
                        setMcaResultsProcessed(data["results"]);
                    }
                });
        }
    }, [activeTab]);

    return (
        <div className="p-4 mb-6 bg-white rounded-lg shadow-md">
            <h2 className="mb-6 text-2xl font-extrabold tracking-wide text-center bg-clip-text drop-shadow-lg">
                {djangoUserCountyName} County Election Results
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
                            ? djangoUserConstName + " MP"
                            : tab === "mca"
                            ? djangoUserWardName + " Ward MCA"
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
                            presResultsProcessed !== null ? (
                                presResultsProcessed.map((candidate) => (
                                    <PollingCandidateResults
                                        key={candidate.fullName}
                                        candidate={candidate}
                                        streamsNumber={
                                            candidate.county_polling_stations_count
                                        }
                                    />
                                ))
                            ) : activeTab === "president" ? (
                                <NoResultsComponent />
                            ) : null}

                            {activeTab === "governor" &&
                            govResultsProcessed !== null ? (
                                govResultsProcessed.map((candidate) => (
                                    <PollingCandidateResults
                                        key={candidate.fullName}
                                        candidate={candidate}
                                        streamsNumber={
                                            candidate.county_polling_stations_count
                                        }
                                    />
                                ))
                            ) : activeTab === "governor" ? (
                                <NoResultsComponent />
                            ) : null}

                            {activeTab === "senator" &&
                            senatorResultsProcessed !== null ? (
                                senatorResultsProcessed.map((candidate) => (
                                    <PollingCandidateResults
                                        key={candidate.fullName}
                                        candidate={candidate}
                                        streamsNumber={
                                            candidate.county_polling_stations_count
                                        }
                                    />
                                ))
                            ) : activeTab === "senator" ? (
                                <NoResultsComponent />
                            ) : null}

                            {activeTab === "women_rep" &&
                            womenRepResultsProcessed !== null ? (
                                womenRepResultsProcessed.map((candidate) => (
                                    <PollingCandidateResults
                                        key={candidate.fullName}
                                        candidate={candidate}
                                        streamsNumber={
                                            candidate.county_polling_stations_count
                                        }
                                    />
                                ))
                            ) : activeTab === "women_rep" ? (
                                <NoResultsComponent />
                            ) : null}

                            {activeTab === "mp" && mpResultsProcessed !== null ? (
                                mpResultsProcessed.map((candidate) => (
                                    <PollingCandidateResults
                                        key={candidate.fullName}
                                        candidate={candidate}
                                        streamsNumber={
                                            candidate.county_polling_stations_count
                                        }
                                    />
                                ))
                            ) : activeTab === "mp" ? (
                                <NoResultsComponent />
                            ) : null}

                            {activeTab === "mca" && mcaResultsProcessed !== null ? (
                                mcaResultsProcessed.map((candidate) => (
                                    <PollingCandidateResults
                                        key={candidate.fullName}
                                        candidate={candidate}
                                        streamsNumber={
                                            candidate.county_polling_stations_count
                                        }
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
                            govResultsProcessed !== null ||
                            senatorResultsProcessed !== null ||
                            womenRepResultsProcessed !== null ||
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
                                <p className="text-center text-gray-500">
                                    No data available for the selected tab.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CountyResults;
