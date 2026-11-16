import {useEffect, useState} from "react";
import {useQuery, useQueryClient} from "@tanstack/react-query";

import {Areas, UpButton} from "./Areas";
import {
    DashboardError,
    fetchDashboard,
    resultsUrl,
    uncached,
    type Area,
    type DashboardContext,
    type Results,
} from "./dashboardApi";
import {Summary} from "./Summary";
import {OFFICES} from "./tally";
import "../access/access.css";
import "./dashboard.css";

/** Whose dashboard this is, the race, and the area it covers. */
function Who({data, fallback}: {data: Results | undefined; fallback: string}) {
    if (!data) return <span>{fallback}</span>;
    const root = data.breadcrumbs[0];
    const parts = [
        data.focus ?? fallback,
        OFFICES[data.race] ?? data.race,
        root.level === "national" ? "Kenya" : root.name,
    ];
    return (
        <span className="rd-who">
            {parts.map((part) => (
                <span key={part}>{part}</span>
            ))}
        </span>
    );
}

const DASHBOARD_QUERIES = new Set(["dashboard-results", "dashboard-stations"]);

function Body({
    data,
    kind,
    onOpen,
}: {
    data: Results;
    kind: string;
    onOpen: (area: Area) => void;
}) {
    const crumbs = data.breadcrumbs;
    const up = crumbs.length > 1 ? crumbs[crumbs.length - 2] : null;
    const atStation = data.area.level === "station";
    return (
        <>
            {up && atStation && <UpButton to={up} onOpen={onOpen} />}
            <Summary data={data} kind={kind} up={up} />
            {!atStation && (
                <Areas
                    key={`${data.area.level}-${data.area.id}`}
                    data={data}
                    up={up}
                    onOpen={onOpen}
                />
            )}
        </>
    );
}

/** The results page for someone on an active dashboard. */
export function CustomResults({
    context,
    onAccessLost,
}: {
    context: DashboardContext;
    onAccessLost: () => void;
}) {
    const [area, setArea] = useState<Area | null>(null);
    const queryClient = useQueryClient();
    const results = useQuery({
        queryKey: ["dashboard-results", context.dashboard?.id, area],
        queryFn: ({signal}) => fetchDashboard<Results>(resultsUrl(area), signal),
        ...uncached,
    });
    const lost =
        results.error instanceof DashboardError && results.error.status === 404;
    useEffect(() => {
        // Access may have been switched off; ask again which view applies.
        if (lost) onAccessLost();
    }, [lost, onAccessLost]);

    function refresh() {
        void queryClient.invalidateQueries({
            predicate: (query) => DASHBOARD_QUERIES.has(String(query.queryKey[0])),
        });
    }

    return (
        <div className="rd rd-dashboard">
            <div className="rd-strip">
                <span>● Citizen tally · Not an IEBC system</span>
                <span>Numbers are reported, never final</span>
            </div>
            <nav className="rd-nav" aria-label="Main">
                <a href="/">
                    Kura Zetu<span>.</span>
                </a>
                {context.manage_url && (
                    <a className="da-results-button" href={context.manage_url}>
                        Manage viewers
                    </a>
                )}
            </nav>
            <div className="rd-sub">
                <Who data={results.data} fallback={context.dashboard?.name ?? ""} />
                <button
                    type="button"
                    className="rd-secondary"
                    onClick={refresh}
                    disabled={results.isFetching}
                >
                    {results.isFetching ? "Refreshing…" : "Refresh"}
                </button>
            </div>
            <main className="rd-body">
                {results.isPending ? (
                    <p role="status">Loading results…</p>
                ) : results.isError ? (
                    <p role="alert">
                        {results.error.message}{" "}
                        <button
                            type="button"
                            className="rd-secondary"
                            onClick={() => setArea(null)}
                        >
                            Back to the top
                        </button>
                    </p>
                ) : (
                    <Body
                        data={results.data}
                        kind={context.dashboard?.kind ?? ""}
                        onOpen={setArea}
                    />
                )}
            </main>
        </div>
    );
}
