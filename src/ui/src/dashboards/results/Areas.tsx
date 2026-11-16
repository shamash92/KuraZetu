import {Fragment, useState} from "react";
import {ChevronLeft} from "lucide-react";

import {AreaMap} from "./AreaMap";
import type {Area, Results, Tally} from "./dashboardApi";
import {Drawer} from "./Drawer";
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
    open,
    onPick,
}: {
    child: Area & Tally;
    showsFocus: boolean;
    open: boolean | undefined;
    onPick: () => void;
}) {
    const {label, tone} = standing(child);
    const top = leaders(child);
    return (
        <tr className={open ? "rd-sel" : undefined}>
            <td>
                <button
                    type="button"
                    className="rd-tlink"
                    aria-expanded={open}
                    onClick={onPick}
                >
                    {child.name}
                </button>
                <span className="rd-narrow">
                    {child.reported}/{child.stations} reported
                </span>
            </td>
            {showsFocus ? (
                <>
                    <td className="rd-r">{number.format(myVotes(child) ?? 0)}</td>
                    <td className="rd-r">{position(child)}</td>
                </>
            ) : (
                <td>{top.length ? names(top) : "—"}</td>
            )}
            <td className="rd-wide">
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

/**
 * The areas one level down. Picking a row opens its polling stations under it;
 * rows that are themselves polling stations open that station instead.
 */
export function Areas({
    data,
    up,
    view,
    onOpen,
}: {
    data: Results;
    up: Area | null;
    view: "list" | "map";
    onOpen: (area: Area) => void;
}) {
    const [picked, setPicked] = useState<string | null>(null);
    const showsFocus = follows(data.summary);
    const level = NEXT_LEVEL[data.area.level];
    const opensStation = level === "station";
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
                                <th className="rd-wide">Reported</th>
                                <th className="rd-wide">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.children.map((child) => {
                                const key = `${child.level}-${child.id}`;
                                const open = picked === key;
                                return (
                                    <Fragment key={key}>
                                        <AreaRow
                                            child={child}
                                            showsFocus={showsFocus}
                                            open={opensStation ? undefined : open}
                                            onPick={() =>
                                                opensStation
                                                    ? onOpen(child)
                                                    : setPicked(open ? null : key)
                                            }
                                        />
                                        {open && (
                                            <Drawer
                                                area={child}
                                                follows={showsFocus}
                                                columns={showsFocus ? 5 : 4}
                                                onOpen={onOpen}
                                            />
                                        )}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="rd-empty">No areas are listed here yet.</p>
            )}
        </section>
    );
}
