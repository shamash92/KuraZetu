import type {Candidate, StationRow, Tally} from "./dashboardApi";

export const RACE_NAMES: Record<string, string> = {
    president: "Presidential race",
    governor: "Governor race",
    senator: "Senator race",
    women_rep: "Women representative race",
    mp: "MP race",
    mca: "MCA race",
};
export const AREA_NAMES: Record<string, string> = {
    county: "Counties",
    constituency: "Constituencies",
    ward: "Wards",
    center: "Polling centres",
    station: "Polling stations",
};
export const AREA_NAME: Record<string, string> = {
    county: "County",
    constituency: "Constituency",
    ward: "Ward",
    center: "Polling centre",
    station: "Polling station",
};
export const NEXT_LEVEL: Record<string, string> = {
    national: "county",
    county: "constituency",
    constituency: "ward",
    ward: "center",
    center: "station",
};

export const number = new Intl.NumberFormat("en-KE");

export function percent(value: number) {
    return `${value.toFixed(1)}%`;
}

export function ordinal(value: number) {
    const tens = value % 100;
    const suffixes: Record<number, string> = {1: "st", 2: "nd", 3: "rd"};
    const suffix = tens >= 11 && tens <= 13 ? "th" : suffixes[value % 10] || "th";
    return `${value}${suffix}`;
}

export function names(candidates: Array<Candidate>) {
    return candidates.map((candidate) => candidate.name).join(", ");
}

export function leaders(tally: Tally) {
    return tally.candidates.filter((candidate) =>
        tally.leader_ids.includes(candidate.id),
    );
}

/** The candidates the dashboard follows: the aspirant, or the party's. */
export function focused(tally: Tally) {
    return tally.candidates.filter((candidate) => candidate.focused);
}

export function follows(tally: Tally) {
    return focused(tally).length > 0;
}

export function myVotes(tally: Tally) {
    const mine = focused(tally).map((candidate) => candidate.votes);
    return mine.length ? Math.max(...mine) : null;
}

export function myShare(tally: Tally) {
    const mine = focused(tally).map((candidate) => candidate.share);
    return mine.length ? Math.max(...mine) : null;
}

export type Tone = "lead" | "trail" | "none" | "";

/** Where the followed candidate stands, or who leads when no one is followed. */
export function standing(tally: Tally): {label: string; tone: Tone} {
    if (!tally.reported) return {label: "No results", tone: "none"};
    if (!follows(tally) || !tally.leader_ids.length) {
        const tones: Record<string, Tone> = {Leading: "lead", Tied: ""};
        return {label: tally.status, tone: tones[tally.status] ?? "none"};
    }
    const leads = focused(tally).some((candidate) =>
        tally.leader_ids.includes(candidate.id),
    );
    if (!leads) return {label: "Trailing", tone: "trail"};
    return tally.leader_ids.length > 1
        ? {label: "Tied", tone: ""}
        : {label: "Leading", tone: "lead"};
}

function place(position: number, tied: boolean) {
    return tied ? `${ordinal(position)}, tied` : ordinal(position);
}

export function position(tally: Tally) {
    const mine = myVotes(tally);
    if (mine === null || !tally.votes) return "—";
    const votes = tally.candidates.map((candidate) => candidate.votes);
    return place(
        1 + votes.filter((count) => count > mine).length,
        votes.filter((count) => count === mine).length > 1,
    );
}

export function stationPosition(row: StationRow) {
    return row.position === null ? "—" : place(row.position, row.tied);
}

export function stationLeader(row: StationRow) {
    if (row.leaders.length > 1) return `Tied: ${row.leaders.join(", ")}`;
    return row.leaders[0] ?? "No counted votes";
}

export type Gap = {tone: "ahead" | "behind" | "plain"; text: string; votes?: number};

/** One factual sentence on the vote gap, or null before any votes count. */
export function gap(tally: Tally): Gap | null {
    const [first, second] = tally.candidates;
    if (!tally.reported || !first?.votes) return null;
    const top = leaders(tally);
    if (top.length > 1) {
        const others = top.filter((candidate) => !candidate.focused);
        return others.length < top.length
            ? {tone: "plain", text: `Tied with ${names(others)}`}
            : {tone: "plain", text: `Tied: ${names(top)}`};
    }
    if (!second) return null;
    if (!follows(tally)) {
        return {
            tone: "plain",
            text: `${first.name} ahead of ${second.name} by`,
            votes: first.votes - second.votes,
        };
    }
    if (first.focused) {
        return {
            tone: "ahead",
            text: `Ahead of ${second.name} by`,
            votes: first.votes - second.votes,
        };
    }
    return {
        tone: "behind",
        text: `Behind ${first.name} by`,
        votes: first.votes - (myVotes(tally) ?? 0),
    };
}
