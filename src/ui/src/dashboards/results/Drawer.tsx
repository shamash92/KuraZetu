import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {ChevronRight} from "lucide-react";

import {
    fetchDashboard,
    stationsUrl,
    uncached,
    type Area,
    type StationRow,
    type Stations,
} from "./dashboardApi";
import {AREA_NAMES, NEXT_LEVEL, number, stationLeader, stationPosition} from "./tally";

type Open = (area: Area) => void;

function ShortList({
    title,
    rows,
    countClass,
    onOpen,
}: {
    title: string;
    rows: Array<StationRow>;
    countClass: string;
    onOpen: Open;
}) {
    const [all, setAll] = useState(false);
    if (!rows.length) return null;
    return (
        <div>
            <h3>
                {title} <span className={countClass}>{number.format(rows.length)}</span>
            </h3>
            <ul>
                {(all ? rows : rows.slice(0, 3)).map((row) => (
                    <li key={row.id}>
                        <button
                            type="button"
                            className="rd-alink"
                            onClick={() => onOpen(row)}
                        >
                            {row.name}
                            <ChevronRight aria-hidden="true" size={16} />
                        </button>
                    </li>
                ))}
            </ul>
            {rows.length > 3 && (
                <button type="button" className="rd-more" onClick={() => setAll(!all)}>
                    {all ? "Show fewer" : `See all ${number.format(rows.length)}`}
                </button>
            )}
        </div>
    );
}

function StationVotes({
    rows,
    follows,
    onOpen,
}: {
    rows: Array<StationRow>;
    follows: boolean;
    onOpen: Open;
}) {
    return (
        <table className="rd-st">
            <thead>
                <tr>
                    <th>Polling station</th>
                    {follows ? (
                        <>
                            <th className="rd-r">Votes</th>
                            <th className="rd-r">Position</th>
                        </>
                    ) : (
                        <th>Leading</th>
                    )}
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr key={row.id}>
                        <td>
                            <button
                                type="button"
                                className="rd-tlink rd-tlink-sm"
                                onClick={() => onOpen(row)}
                            >
                                {row.name}
                            </button>
                        </td>
                        {follows ? (
                            <>
                                <td className="rd-r">
                                    {number.format(row.votes ?? 0)}
                                </td>
                                <td className="rd-r">{stationPosition(row)}</td>
                            </>
                        ) : (
                            <td>{stationLeader(row)}</td>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function DrawerBody({
    area,
    rows,
    follows,
    onOpen,
}: {
    area: Area;
    rows: Array<StationRow>;
    follows: boolean;
    onOpen: Open;
}) {
    const [all, setAll] = useState(false);
    const reported = rows.filter((row) => row.reported);
    if (follows) reported.sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
    const next = NEXT_LEVEL[area.level];
    return (
        <div className="rd-drawer-body">
            <div>
                <h3>Votes by polling station in {area.name}</h3>
                {reported.length ? (
                    <StationVotes
                        rows={all ? reported : reported.slice(0, 5)}
                        follows={follows}
                        onOpen={onOpen}
                    />
                ) : (
                    <p className="rd-empty">
                        No polling station in {area.name} has reported yet. Votes appear
                        here as each Form 34A is uploaded.
                    </p>
                )}
                <div className="rd-drawer-actions">
                    {reported.length > 5 && (
                        <button
                            type="button"
                            className="rd-more"
                            onClick={() => setAll(!all)}
                        >
                            {all
                                ? "Show fewer"
                                : `Show all ${number.format(reported.length)} stations`}
                        </button>
                    )}
                    {next && (
                        <button
                            type="button"
                            className="rd-more"
                            onClick={() => onOpen(area)}
                        >
                            Open {AREA_NAMES[next].toLowerCase()} in {area.name}
                        </button>
                    )}
                </div>
            </div>
            <div className="rd-att">
                <ShortList
                    title="No upload yet"
                    rows={rows.filter((row) => !row.reported)}
                    countClass="rd-cnt"
                    onOpen={onOpen}
                />
                <ShortList
                    title="Uploads disagree"
                    rows={rows.filter((row) => row.disagrees)}
                    countClass="rd-cnt rd-cnt-dis"
                    onOpen={onOpen}
                />
            </div>
        </div>
    );
}

/** The polling stations inside one area row, opened underneath it. */
export function Drawer({
    area,
    follows,
    columns,
    onOpen,
}: {
    area: Area;
    follows: boolean;
    columns: number;
    onOpen: Open;
}) {
    const stations = useQuery({
        queryKey: ["dashboard-stations", area],
        queryFn: ({signal}) => fetchDashboard<Stations>(stationsUrl(area), signal),
        ...uncached,
    });
    return (
        <tr className="rd-drawer">
            <td colSpan={columns}>
                {stations.isPending ? (
                    <p role="status" className="rd-empty">
                        Loading polling stations…
                    </p>
                ) : stations.isError ? (
                    <p role="alert">{stations.error.message}</p>
                ) : (
                    <DrawerBody
                        area={area}
                        rows={stations.data.stations}
                        follows={follows}
                        onOpen={onOpen}
                    />
                )}
            </td>
        </tr>
    );
}
