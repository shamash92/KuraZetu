import {useQuery} from "@tanstack/react-query";

import {
    fetchDashboard,
    photoUrl,
    uncached,
    uploadsUrl,
    type Area,
    type Upload,
    type Uploads,
} from "./dashboardApi";
import {number} from "./tally";

type Row = {label: string; values: Array<number | null>};

function figureRows(data: Uploads): Array<Row> {
    const candidates = data.candidates.map((candidate) => ({
        label: candidate.name,
        values: data.uploads.map((upload) => upload.votes[candidate.id] ?? null),
    }));
    const most = (row: Row) => Math.max(0, ...row.values.map((value) => value ?? 0));
    candidates.sort((a, b) => most(b) - most(a) || a.label.localeCompare(b.label));
    const field = (label: string, pick: (upload: Upload) => number) => ({
        label,
        values: data.uploads.map(pick),
    });
    return [
        ...candidates,
        field("Rejected votes", (upload) => upload.rejected),
        field("Disputed votes", (upload) => upload.disputed),
    ];
}

function differs(row: Row) {
    return new Set(row.values).size > 1;
}

function agreedBy(count: number) {
    if (!count) return "No one else agreed yet";
    return count === 1 ? "Agreed by 1 person" : `Agreed by ${count} people`;
}

function UploadsBody({data}: {data: Uploads}) {
    if (!data.uploads.length) {
        return <p className="rd-empty">No counted uploads yet.</p>;
    }
    const rows = figureRows(data);
    const names = data.uploads.map((_, index) => `Upload ${index + 1}`);
    return (
        <>
            <ul className="rd-photos">
                {data.uploads.map((upload, index) => (
                    <li key={upload.id}>
                        <a href={photoUrl(upload.id)} target="_blank" rel="noreferrer">
                            <img
                                src={photoUrl(upload.id)}
                                alt={`Form photo, ${names[index].toLowerCase()}`}
                                loading="lazy"
                            />
                        </a>
                        <b>{names[index]}</b>
                        <span>{agreedBy(upload.agreed)}</span>
                    </li>
                ))}
            </ul>
            <div className="rd-scroll">
                <table className="rd-atbl rd-compare">
                    <thead>
                        <tr>
                            <th>Figure</th>
                            {names.map((name) => (
                                <th key={name} className="rd-r">
                                    {name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr
                                key={row.label}
                                className={differs(row) ? "rd-differs" : undefined}
                            >
                                <td>{row.label}</td>
                                {row.values.map((value, index) => (
                                    <td key={names[index]} className="rd-r">
                                        {value === null ? "—" : number.format(value)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

/** What each upload at one station says, with its form photo. Read only. */
export function StationUploads({station}: {station: Area}) {
    const uploads = useQuery({
        queryKey: ["dashboard-uploads", station.id],
        queryFn: ({signal}) =>
            fetchDashboard<Uploads>(uploadsUrl(Number(station.id)), signal),
        ...uncached,
    });
    const count = uploads.data?.uploads.length ?? 0;
    const disagree =
        uploads.data !== undefined && figureRows(uploads.data).some(differs);
    return (
        <section className="rd-panel rd-wm">
            <div className="rd-band-head">
                <h2>Uploads at this station</h2>
                {count > 1 && (
                    <span className={`rd-chip ${disagree ? "trail" : "lead"}`}>
                        {disagree ? "Uploads disagree" : "Uploads agree"}
                    </span>
                )}
            </div>
            {uploads.isPending ? (
                <p role="status" className="rd-empty">
                    Loading uploads…
                </p>
            ) : uploads.isError ? (
                <p role="alert">{uploads.error.message}</p>
            ) : (
                <UploadsBody data={uploads.data} />
            )}
        </section>
    );
}
