import {useCallback, useEffect, useState} from "react";
import {useQuery, useQueryClient} from "@tanstack/react-query";

import {Activity} from "./Activity";
import {Areas, UpButton} from "./Areas";
import {DashboardSwitch} from "./DashboardSwitch";
import {
    DashboardError,
    fetchDashboard,
    resultsKey,
    resultsUrl,
    shortCache,
    stationsUrl,
    type Area,
    type DashboardContext,
    type Results,
    type Stations,
} from "./dashboardApi";
import {StationUploads} from "./StationUploads";
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

const DASHBOARD_QUERIES = new Set([
    "dashboard-results",
    "dashboard-stations",
    "dashboard-uploads",
    "dashboard-activity",
]);

type View = "list" | "map";

function ViewSwitch({view, onChange}: {view: View; onChange: (view: View) => void}) {
    return (
        <div className="rd-seg" role="group" aria-label="View">
            {(["list", "map"] as const).map((option) => (
                <button
                    key={option}
                    type="button"
                    aria-pressed={view === option}
                    onClick={() => onChange(option)}
                >
                    {option === "list" ? "List" : "Map"}
                </button>
            ))}
        </div>
    );
}

function Body({
    data,
    kind,
    view,
    onOpen,
    onPrefetch,
}: {
    data: Results;
    kind: string;
    view: View;
    onOpen: (area: Area) => void;
    onPrefetch: (area: Area) => void;
}) {
    const crumbs = data.breadcrumbs;
    const up = crumbs.length > 1 ? crumbs[crumbs.length - 2] : null;
    const atStation = data.area.level === "station";
    return (
        <>
            {up && atStation && <UpButton to={up} onOpen={onOpen} />}
            <div className="rd-top">
                <Summary data={data} kind={kind} up={up} />
                <Activity onOpen={onOpen} />
            </div>
            {atStation ? (
                <StationUploads station={data.area} />
            ) : (
                <Areas
                    key={`${data.area.level}-${data.area.id}`}
                    data={data}
                    up={up}
                    view={view}
                    onOpen={onOpen}
                    onPrefetch={onPrefetch}
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
    const [view, setView] = useState<View>("list");
    const queryClient = useQueryClient();
    const results = useQuery({
        queryKey: resultsKey(context.dashboard?.id, area),
        queryFn: ({signal}) => fetchDashboard<Results>(resultsUrl(area), signal),
        ...shortCache,
    });
    const dashboardId = context.dashboard?.id;
    const prefetch = useCallback(
        (next: Area) => {
            void queryClient.prefetchQuery({
                queryKey: resultsKey(dashboardId, next),
                queryFn: ({signal}) =>
                    fetchDashboard<Results>(resultsUrl(next), signal),
                ...shortCache,
            });
            if (next.level !== "ward") return;
            // A ward opens on its centres and streams, so load those too.
            const url = stationsUrl(next);
            void queryClient.prefetchQuery({
                queryKey: ["dashboard-stations", url],
                queryFn: ({signal}) => fetchDashboard<Stations>(url, signal),
                ...shortCache,
            });
        },
        [queryClient, dashboardId],
    );
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
                <div className="rd-nav-actions">
                    <DashboardSwitch current={context.dashboard?.id} />
                    {context.manage_url && (
                        <a className="da-results-button" href={context.manage_url}>
                            Manage viewers
                        </a>
                    )}
                </div>
            </nav>
            <div className="rd-sub">
                <Who data={results.data} fallback={context.dashboard?.name ?? ""} />
                <div className="rd-sub-actions">
                    {results.data && results.data.area.level !== "station" && (
                        <ViewSwitch view={view} onChange={setView} />
                    )}
                    <button
                        type="button"
                        className="rd-secondary"
                        onClick={refresh}
                        disabled={results.isFetching}
                    >
                        {results.isFetching ? "Refreshing…" : "Refresh"}
                    </button>
                </div>
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
                        view={view}
                        onOpen={setArea}
                        onPrefetch={prefetch}
                    />
                )}
            </main>
        </div>
    );
}
