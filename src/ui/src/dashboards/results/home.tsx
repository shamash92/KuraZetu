import {useCallback} from "react";
import {useQuery} from "@tanstack/react-query";

import ResultsDashboard from "./index";
import {CustomResults} from "./CustomResults";
import {
    dashboardContextUrl,
    fetchDashboard,
    type DashboardContext,
} from "./dashboardApi";

/** An active custom dashboard if the person has one; otherwise civilian results. */
export default function ResultsHome() {
    const context = useQuery({
        queryKey: ["dashboard-context"],
        queryFn: ({signal}) =>
            fetchDashboard<DashboardContext>(dashboardContextUrl, signal),
        retry: false,
        staleTime: 0,
        gcTime: 0,
    });
    const {refetch} = context;
    const recheck = useCallback(() => void refetch(), [refetch]);
    if (context.isPending) return <p role="status">Loading results…</p>;
    if (context.data?.dashboard) {
        return <CustomResults context={context.data} onAccessLost={recheck} />;
    }
    return <ResultsDashboard />;
}
