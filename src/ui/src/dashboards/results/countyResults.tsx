import {Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip} from "recharts";
import {
    ICountyPresResults,
    IPollingCenterCandidateResults,
    IPollingCenterResultsProcessed,
    TLevelDjango,
} from "./types";
import {aggregateCandidateResults, formatNumber} from "./utils";
import {useState} from "react";
import {useQuery} from "@tanstack/react-query";

import NoResultsComponent from "./components/noResults";
import PollingCandidateResults from "./components/pollingCandidateResults";
import PollingStationCandidatePieChart from "./components/pollingStationCandidatePieChart";
import {useUser} from "../../App";
import {countyResultsUrl} from "../../api/apiUrls";
import {resultKeys} from "../../api/queryKeys";
import {querySettings} from "../../api/querySettings";

const levelsArray: TLevelDjango[] = [
    "president",
    "governor",
    "senator",
    "women_rep",
    "mp",
    "mca",
];

interface CountyResultsResponse {
    results: ICountyPresResults[];
}

function CountyResults() {
    const [activeTab, setActiveTab] = useState<TLevelDjango>("president");

    const {
        djangoUserPollingCenterCode,
        djangoUserPollingCenterName,
        djangoUserWardNumber,
        djangoUserConstName,
        djangoUserCountyName,
        djangoUserCountyNumber,
        djangoUserWardName,
    } = useUser();

    // One query for whichever tab is open. Switching tabs changes the key, so
    // a race is fetched the first time it is opened and served from cache
    // afterwards — the six near-identical branches this replaced each guarded
    // themselves with a `=== null` check to get the same effect.
    const resultsQuery = useQuery({
        queryKey: resultKeys.county(djangoUserCountyNumber, activeTab),

        queryFn: async ({signal}): Promise<CountyResultsResponse> => {
            const response = await fetch(countyResultsUrl(activeTab), {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    Accept: "application/json",
                },
                signal,
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw Object.assign(
                    new Error(data?.error ?? "Could not load results"),
                    {
                        status: response.status,
                        payload: data,
                    },
                );
            }

            return data;
        },

        ...querySettings.results,
    });

    // Read straight off `data` so the reference stays stable between renders.
    const results = resultsQuery.data?.results;
    const hasResults = results !== undefined && results.length > 0;

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
                            {resultsQuery.isPending ? (
                                <p className="text-gray-500">Loading results…</p>
                            ) : resultsQuery.isError ? (
                                <div className="space-y-2">
                                    <p className="text-red-600">
                                        {resultsQuery.error.message}
                                    </p>
                                    <button
                                        type="button"
                                        className="px-3 py-1 text-sm border rounded"
                                        onClick={() => resultsQuery.refetch()}
                                    >
                                        Try again
                                    </button>
                                </div>
                            ) : hasResults ? (
                                results.map((candidate) => (
                                    <PollingCandidateResults
                                        key={candidate.fullName}
                                        candidate={candidate}
                                        streamsNumber={
                                            candidate.county_polling_stations_count
                                        }
                                    />
                                ))
                            ) : (
                                <NoResultsComponent />
                            )}
                        </div>
                    </div>

                    {/* Right side: Pie chart */}
                    <div>
                        <h3 className="mb-3 font-semibold text-center">
                            Vote Distribution
                        </h3>
                        <div className="h-64">
                            {hasResults ? (
                                <PollingStationCandidatePieChart
                                    activeTab={activeTab}
                                    data={results}
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
