import {Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip} from "recharts";
import {
    IAggregatedResults,
    IPollingCenterCandidateResults,
    TLevelDjango,
} from "./types";
import {aggregateCandidateResults, formatNumber} from "./utils";
import {useState} from "react";
import {useQuery} from "@tanstack/react-query";

import NoResultsComponent from "./components/noResults";
import PollingCandidateResults from "./components/pollingCandidateResults";
import PollingStationCandidatePieChart from "./components/pollingStationCandidatePieChart";
import {useUser} from "../../App";
import {pollingCenterResultsUrl} from "../../api/apiUrls";
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

interface PollingCenterResultsResponse {
    data: IPollingCenterCandidateResults[];
    streams: number;
    /** The API reports a missing ward or centre in the body of a 200. */
    error?: string;
}

interface PollingCenterResults extends IAggregatedResults {
    /**
     * Every stream at the centre, whether or not it has reported. The
     * aggregate's own `totalStreams` counts only streams already present in the
     * response, which cannot express outstanding ones — the county tab uses the
     * equivalent full count for the same "x/y streams" display.
     */
    centerStreams: number;
}

function PollingCenterResults() {
    const [activeTab, setActiveTab] = useState<TLevelDjango>("president");

    const {
        djangoUserPollingCenterCode,
        djangoUserPollingCenterName,
        djangoUserWardNumber,
    } = useUser();

    const hasPollingCenter =
        djangoUserWardNumber !== null && djangoUserPollingCenterCode !== null;

    // One query for whichever tab is open. Switching tabs changes the key, so a
    // race is fetched the first time it is opened and served from cache
    // afterwards — the six near-identical branches this replaced each guarded
    // themselves with a `=== null` check, which never held because the value
    // they tested was never assigned, so every revisit refetched.
    const resultsQuery = useQuery({
        queryKey: resultKeys.pollingCenter(
            djangoUserWardNumber,
            djangoUserPollingCenterCode,
            activeTab,
        ),

        queryFn: async ({signal}): Promise<PollingCenterResults> => {
            // `enabled` below already holds this, but the check is what narrows
            // both values away from `null` for the URL builder.
            if (djangoUserWardNumber === null || djangoUserPollingCenterCode === null) {
                throw new Error("No polling center is linked to this account");
            }

            const response = await fetch(
                pollingCenterResultsUrl(
                    djangoUserWardNumber,
                    djangoUserPollingCenterCode,
                    activeTab,
                ),
                {
                    method: "GET",
                    credentials: "same-origin",
                    headers: {
                        Accept: "application/json",
                    },
                    signal,
                },
            );

            const body: PollingCenterResultsResponse | null = await response
                .json()
                .catch(() => null);

            // A missing ward or centre comes back as a 200 carrying `error`, so
            // the status alone does not tell us whether there is data to read.
            if (!response.ok || body?.error || !body?.data) {
                throw Object.assign(
                    new Error(body?.error ?? "Could not load results"),
                    {
                        status: response.status,
                        payload: body,
                    },
                );
            }

            // Aggregating here rather than in the component keeps one processed
            // object in the cache, with a reference that is stable between
            // renders.
            return {
                ...aggregateCandidateResults(body.data, activeTab),
                centerStreams: body.streams,
            };
        },

        enabled: hasPollingCenter,

        ...querySettings.results,
    });

    const aggregate = resultsQuery.data;
    const hasResults = aggregate !== undefined && aggregate.totalVotes > 0;

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
                            {!hasPollingCenter ? (
                                <p className="text-gray-500">
                                    No polling center is linked to this account yet.
                                </p>
                            ) : resultsQuery.isPending ? (
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
                                aggregate.candidates.map((candidate) => (
                                    <PollingCandidateResults
                                        key={candidate.fullName}
                                        candidate={candidate}
                                        streamsNumber={aggregate.centerStreams}
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
                                    data={aggregate.candidates}
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

export default PollingCenterResults;
