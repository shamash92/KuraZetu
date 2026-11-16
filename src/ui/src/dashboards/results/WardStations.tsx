import {useRef, useState} from "react";
import {useQuery} from "@tanstack/react-query";

import {
    fetchDashboard,
    shortCache,
    stationsUrl,
    type Area,
    type StationRow,
    type Stations,
} from "./dashboardApi";
import {StationUploads} from "./StationUploads";
import {number, stationLeader, stationPosition} from "./tally";

type Centre = {id: number; name: string; streams: Array<StationRow>};

function byCentre(rows: Array<StationRow>): Array<Centre> {
    const centres = new Map<number, Centre>();
    for (const row of rows) {
        const centre = centres.get(row.center.id) ?? {...row.center, streams: []};
        centre.streams.push(row);
        centres.set(row.center.id, centre);
    }
    return Array.from(centres.values());
}

function status(row: StationRow) {
    if (row.disagrees) return <span className="rd-chip trail">Uploads disagree</span>;
    if (!row.reported) return <span className="rd-chip none">No upload yet</span>;
    return <span className="rd-chip">Reported</span>;
}

function Streams({
    centre,
    follows,
    picked,
    onPick,
}: {
    centre: Centre;
    follows: boolean;
    picked: number | null;
    onPick: (row: StationRow) => void;
}) {
    return (
        <tbody>
            <tr className="rd-group">
                <th scope="rowgroup" colSpan={follows ? 4 : 3}>
                    {centre.name}
                </th>
            </tr>
            {centre.streams.map((row) => (
                <tr key={row.id} className={picked === row.id ? "rd-sel" : undefined}>
                    <td>
                        <button
                            type="button"
                            className="rd-tlink rd-tlink-sm"
                            aria-pressed={picked === row.id}
                            onClick={() => onPick(row)}
                        >
                            Stream {row.stream}
                        </button>
                    </td>
                    {follows ? (
                        <>
                            <td className="rd-r rd-votes">
                                {row.reported ? number.format(row.votes ?? 0) : "—"}
                            </td>
                            <td className="rd-r">{stationPosition(row)}</td>
                        </>
                    ) : (
                        <td>{row.reported ? stationLeader(row) : "—"}</td>
                    )}
                    <td className="rd-rep">{status(row)}</td>
                </tr>
            ))}
        </tbody>
    );
}

function Heading({follows}: {follows: boolean}) {
    return (
        <thead>
            <tr>
                <th>Stream</th>
                {follows ? (
                    <>
                        <th className="rd-r">Votes</th>
                        <th className="rd-r">Position</th>
                    </>
                ) : (
                    <th>Leading</th>
                )}
                <th className="rd-rep">Status</th>
            </tr>
        </thead>
    );
}

/** A ward's polling centres with every stream; a picked stream opens alongside. */
export function WardStations({ward, follows}: {ward: Area; follows: boolean}) {
    const [picked, setPicked] = useState<StationRow | null>(null);
    const detail = useRef<HTMLElement>(null);
    const url = stationsUrl(ward);
    const stations = useQuery({
        queryKey: ["dashboard-stations", url],
        queryFn: ({signal}) => fetchDashboard<Stations>(url, signal),
        ...shortCache,
    });
    if (stations.isPending) {
        return (
            <p role="status" className="rd-empty">
                Loading polling centres…
            </p>
        );
    }
    if (stations.isError) return <p role="alert">{stations.error.message}</p>;
    const centres = byCentre(stations.data.stations);
    if (!centres.length) {
        return <p className="rd-empty">No polling centres are listed here yet.</p>;
    }

    function pick(row: StationRow) {
        setPicked(row);
        // On a phone the result sits under the list, so bring it into view.
        detail.current?.scrollIntoView?.({block: "nearest"});
    }

    return (
        <div className="rd-split">
            <div className="rd-scroll">
                <table className="rd-st rd-centres">
                    <Heading follows={follows} />
                    {centres.map((centre) => (
                        <Streams
                            key={centre.id}
                            centre={centre}
                            follows={follows}
                            picked={picked ? Number(picked.id) : null}
                            onPick={pick}
                        />
                    ))}
                </table>
            </div>
            <aside ref={detail} className="rd-detail" aria-live="polite">
                {picked ? (
                    <StationUploads key={picked.id} station={picked} inline />
                ) : (
                    <p className="rd-empty">
                        Pick a stream to see its result and form.
                    </p>
                )}
            </aside>
        </div>
    );
}
