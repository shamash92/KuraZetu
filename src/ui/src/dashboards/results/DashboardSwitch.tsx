import {useEffect, useId, useRef, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {ChevronDown} from "lucide-react";

import {
    dashboardListUrl,
    fetchDashboard,
    shortCache,
    type DashboardList,
} from "./dashboardApi";

/** The dashboards this person can open, as a list that opens from the top bar. */
export function DashboardSwitch({current}: {current: number | undefined}) {
    const [open, setOpen] = useState(false);
    const menu = useId();
    const root = useRef<HTMLDivElement>(null);
    const list = useQuery({
        queryKey: ["dashboard-list"],
        queryFn: ({signal}) => fetchDashboard<DashboardList>(dashboardListUrl, signal),
        ...shortCache,
    });
    useEffect(() => {
        if (!open) return;
        function outside(event: MouseEvent) {
            if (!root.current?.contains(event.target as Node)) setOpen(false);
        }
        function escape(event: KeyboardEvent) {
            if (event.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", outside);
        document.addEventListener("keydown", escape);
        return () => {
            document.removeEventListener("mousedown", outside);
            document.removeEventListener("keydown", escape);
        };
    }, [open]);
    return (
        <div className="rd-switch" ref={root}>
            <button
                type="button"
                className="rd-switch-button"
                aria-expanded={open}
                aria-controls={menu}
                onClick={() => setOpen(!open)}
            >
                Dashboards
                <ChevronDown aria-hidden="true" size={16} />
            </button>
            {open && (
                <ul id={menu} className="rd-switch-menu">
                    {list.data?.dashboards.map((dashboard) => (
                        <li key={dashboard.id}>
                            <a
                                href={dashboard.url}
                                aria-current={
                                    dashboard.id === current ? "page" : undefined
                                }
                            >
                                {dashboard.name}
                            </a>
                        </li>
                    ))}
                    {list.isPending && <li className="rd-empty">Loading…</li>}
                    <li>
                        <a href="/ui/">Public results</a>
                    </li>
                </ul>
            )}
        </div>
    );
}
