import {useEffect} from "react";
import {ChevronLeft} from "lucide-react";

import {AreaMap} from "./AreaMap";
import type {Area, Results, Tally} from "./dashboardApi";
import {WardStations} from "./WardStations";
import {ReportedBar} from "./Summary";
import {
    AREA_NAME,
    AREA_NAMES,
    NEXT_LEVEL,
    follows,
    leaders,
    myVotes,
    names,
    number,
    position,
    standing,
} from "./tally";

export function UpButton({to, onOpen}: {to: Area; onOpen: (area: Area) => void}) {
    return (
        <button type="button" className="rd-back" onClick={() => onOpen(to)}>
            <ChevronLeft aria-hidden="true" size={16} />
            Up to {to.name}
        </button>
    );
}

function AreaRow({
    child,
    showsFocus,
    onPick,
}: {
    child: Area & Tally;
    showsFocus: boolean;
    onPick: () => void;
}) {
    const {label, tone} = standing(child);
    const top = leaders(child);
    return (
        <tr>
            <td>
                <button type="button" className="rd-tlink" onClick={onPick}>
                    {child.name}
                </button>
                <span className="rd-narrow">
                    {child.reported}/{child.stations} reported
                </span>
            </td>
            {showsFocus ? (
                <>
                    <td className="rd-r rd-votes">
                        {number.format(myVotes(child) ?? 0)}
                    </td>
                    <td className="rd-r">{position(child)}</td>
                </>
            ) : (
                <td>{top.length ? names(top) : "—"}</td>
            )}
            <td className="rd-wide rd-rep">
                <span className="rd-rt">
                    {number.format(child.reported)}/{number.format(child.stations)}
                </span>
                <ReportedBar tally={child} />
            </td>
            <td className="rd-wide">
                <span className={`rd-chip ${tone}`}>{label}</span>
            </td>
        </tr>
    );
}

// Loading more than this many areas ahead would load the server for little gain.
const PREFETCH_LIMIT = 20;

/**
 * The areas one level down; picking one opens it. Inside a ward the list is
 * its polling centres with every stream, and a stream opens beside the list.
 */
export function Areas({
    data,
    up,
    view,
    onOpen,
    onPrefetch,
}: {
    data: Results;
    up: Area | null;
    view: "list" | "map";
    onOpen: (area: Area) => void;
    onPrefetch: (area: Area) => void;
}) {
    const showsFocus = follows(data.summary);
    const level = NEXT_LEVEL[data.area.level];
    const opensStation = level === "station";
    const inWard = level === "center";
    const {children} = data;
    useEffect(() => {
        // Open the next level at once: load it while the person reads this one.
        if (inWard || opensStation || children.length > PREFETCH_LIMIT) return;
        children.forEach(onPrefetch);
    }, [children, inWard, opensStation, onPrefetch]);
    return (
        <section className="rd-panel rd-wm">
            <div className="rd-panel-head">
                {up && <UpButton to={up} onOpen={onOpen} />}
                <h2>
                    {data.area.level === "national"
                        ? AREA_NAMES[level]
                        : `${AREA_NAMES[level]} in ${data.area.name}`}
                </h2>
            </div>
            {view === "map" && opensStation && data.children.length > 0 && (
                <p className="rd-empty">
                    Polling stations share their centre&apos;s location, so they are
                    listed here instead of mapped.
                </p>
            )}
            {view === "map" && !opensStation && data.children.length ? (
                <AreaMap data={data} onOpen={onOpen} />
            ) : inWard ? (
                <WardStations ward={data.area} follows={showsFocus} />
            ) : data.children.length ? (
                <div className="rd-scroll">
                    <table className="rd-atbl">
                        <thead>
                            <tr>
                                <th>{AREA_NAME[level]}</th>
                                {showsFocus ? (
                                    <>
                                        <th className="rd-r">Votes</th>
                                        <th className="rd-r">Position</th>
                                    </>
                                ) : (
                                    <th>Leading</th>
                                )}
                                <th className="rd-wide rd-rep">Reported</th>
                                <th className="rd-wide">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.children.map((child) => (
                                <AreaRow
                                    key={`${child.level}-${child.id}`}
                                    child={child}
                                    showsFocus={showsFocus}
                                    onPick={() => onOpen(child)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="rd-empty">No areas are listed here yet.</p>
            )}
        </section>
    );
}
