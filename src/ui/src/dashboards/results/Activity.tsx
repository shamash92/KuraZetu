import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {ChevronRight} from "lucide-react";

import {
    activityUrl,
    fetchDashboard,
    shortCache,
    type Activity as Feed,
    type Area,
} from "./dashboardApi";
import {number} from "./tally";

const FIRST = 2;
const MORE = 50;
const ago = new Intl.RelativeTimeFormat("en", {numeric: "auto"});

function since(at: string) {
    const minutes = Math.round((Date.parse(at) - Date.now()) / 60_000);
    if (minutes > -60) return ago.format(minutes, "minute");
    const hours = Math.round(minutes / 60);
    return hours > -24
        ? ago.format(hours, "hour")
        : ago.format(Math.round(hours / 24), "day");
}

function Stations({
    title,
    count,
    rows,
    more,
    empty,
    onMore,
    onOpen,
}: {
    title: string;
    count?: number;
    rows: Array<Area & {at: string}>;
    more: boolean | null;
    empty: string;
    onMore: () => void;
    onOpen: (area: Area) => void;
}) {
    return (
        <div className="rd-feed">
            <h2>
                {title}
                {count !== undefined && (
                    <span className="rd-cnt rd-cnt-dis">{number.format(count)}</span>
                )}
            </h2>
            {rows.length ? (
                <ul>
                    {rows.map((row, index) => (
                        <li key={`${row.id}-${index}`}>
                            <button
                                type="button"
                                className="rd-alink"
                                onClick={() => onOpen(row)}
                            >
                                <span>
                                    {row.name}
                                    <small>{since(row.at)}</small>
                                </span>
                                <ChevronRight aria-hidden="true" size={16} />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="rd-empty">{empty}</p>
            )}
            {more !== null && (
                <button type="button" className="rd-more" onClick={onMore}>
                    {more ? "Show fewer" : "See more"}
                </button>
            )}
        </div>
    );
}

/** Contested stations and the latest uploads across the whole dashboard area. */
export function Activity({onOpen}: {onOpen: (area: Area) => void}) {
    const [contestedAll, setContestedAll] = useState(false);
    const [recentAll, setRecentAll] = useState(false);
    const limit = contestedAll || recentAll ? MORE : FIRST;
    const feed = useQuery({
        queryKey: ["dashboard-activity", limit],
        queryFn: ({signal}) => fetchDashboard<Feed>(activityUrl(limit), signal),
        placeholderData: (previous) => previous,
        ...shortCache,
    });
    return (
        <aside className="rd-panel rd-activity">
            {feed.isPending ? (
                <p role="status" className="rd-empty">
                    Loading uploads…
                </p>
            ) : feed.isError ? (
                <p role="alert">{feed.error.message}</p>
            ) : (
                <>
                    <Stations
                        title="Contested uploads"
                        count={feed.data.contested_total}
                        rows={feed.data.contested.slice(0, contestedAll ? MORE : FIRST)}
                        more={feed.data.contested_total > FIRST ? contestedAll : null}
                        empty="No station has uploads that disagree."
                        onMore={() => setContestedAll(!contestedAll)}
                        onOpen={onOpen}
                    />
                    <Stations
                        title="Latest uploads"
                        rows={feed.data.recent.slice(0, recentAll ? MORE : FIRST)}
                        more={feed.data.recent.length >= FIRST ? recentAll : null}
                        empty="No forms have been uploaded yet."
                        onMore={() => setRecentAll(!recentAll)}
                        onOpen={onOpen}
                    />
                </>
            )}
        </aside>
    );
}
