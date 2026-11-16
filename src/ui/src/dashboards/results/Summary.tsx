import type {ReactNode} from "react";

import type {Area, Results, Tally} from "./dashboardApi";
import {
    RACE_NAMES,
    follows,
    gap,
    myShare,
    myVotes,
    number,
    percent,
    standing,
} from "./tally";

export function ReportedBar({tally}: {tally: {reported: number; stations: number}}) {
    const width = tally.stations ? (tally.reported * 100) / tally.stations : 0;
    return (
        <div className="rd-rbar" aria-hidden="true">
            <i style={{width: `${width}%`}} />
        </div>
    );
}

function title(data: Results, up: Area | null) {
    const race = RACE_NAMES[data.race] ?? "Results";
    const {level, name} = data.area;
    if (level === "national") return race;
    if (!up) return `${race} · all of ${name}`;
    return level === "station" ? `${race} · ${name}` : `${race} · ${name} only`;
}

function Figure({label, children}: {label: string; children: ReactNode}) {
    return (
        <div>
            <span>{label}</span>
            <b>{children}</b>
        </div>
    );
}

function Figures({tally, kind}: {tally: Tally; kind: string}) {
    if (!follows(tally)) {
        return (
            <>
                <Figure label="Counted votes">{number.format(tally.votes)}</Figure>
                <Figure label="Uploads disagree">
                    {number.format(tally.disagreements)}
                </Figure>
            </>
        );
    }
    const yours = kind === "party" ? "Your party's" : "Your";
    const share = myShare(tally);
    return (
        <>
            <Figure label={`${yours} votes`}>
                {number.format(myVotes(tally) ?? 0)}
            </Figure>
            <Figure label={`${yours} share`}>
                {tally.votes && share !== null ? percent(share) : "—"}
            </Figure>
        </>
    );
}

function GapLine({tally}: {tally: Tally}) {
    const line = gap(tally);
    if (!line) return null;
    return (
        <div className={`rd-gap rd-gap-${line.tone}`}>
            {line.text}
            {line.votes !== undefined && <b> {number.format(line.votes)} votes</b>}
        </div>
    );
}

const HEX = /^#[0-9a-f]{6}$/i;

/** The party's own colour, when one has been set. */
function partyColour(colour: string | null) {
    return colour && HEX.test(colour) ? colour : undefined;
}

function CandidateBars({tally, kind}: {tally: Tally; kind: string}) {
    if (!tally.candidates.length) {
        return <p className="rd-empty">No candidates are listed for this race yet.</p>;
    }
    const top = Math.max(0, ...tally.candidates.map((candidate) => candidate.votes));
    return (
        <ul className="rd-bars">
            {tally.candidates.map((candidate) => (
                <li
                    key={candidate.id}
                    className={candidate.focused ? "rd-me" : undefined}
                >
                    <div className="rd-bar-name">
                        {candidate.name}
                        <small>
                            {candidate.party}
                            {candidate.focused && (
                                <>
                                    {" · "}
                                    <em>{kind === "party" ? "your party" : "You"}</em>
                                </>
                            )}
                        </small>
                    </div>
                    <div className="rd-bar" aria-hidden="true">
                        <i
                            style={{
                                width: `${top ? (candidate.votes * 100) / top : 0}%`,
                                background: partyColour(candidate.colour),
                            }}
                        />
                    </div>
                    <div className="rd-bar-value">
                        {percent(candidate.share)}
                        <small>{number.format(candidate.votes)}</small>
                    </div>
                </li>
            ))}
        </ul>
    );
}

/** The figures for the whole area being viewed, in one band across the top. */
export function Summary({
    data,
    kind,
    up,
}: {
    data: Results;
    kind: string;
    up: Area | null;
}) {
    const tally = data.summary;
    const {label, tone} = standing(tally);
    return (
        <section className="rd-band rd-wm">
            <div className="rd-band-head">
                <h1>{title(data, up)}</h1>
                <span className={`rd-chip ${tone}`}>{label}</span>
            </div>
            <div className="rd-band-grid">
                <div className="rd-nums">
                    <Figures tally={tally} kind={kind} />
                    <div>
                        <span>Stations reported</span>
                        <b>
                            {number.format(tally.reported)}
                            <small> / {number.format(tally.stations)}</small>
                        </b>
                        <ReportedBar tally={tally} />
                    </div>
                    <GapLine tally={tally} />
                </div>
                <CandidateBars tally={tally} kind={kind} />
            </div>
        </section>
    );
}
