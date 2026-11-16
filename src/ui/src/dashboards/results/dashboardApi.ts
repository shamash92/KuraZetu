export const dashboardContextUrl = "/api/results/dashboard/";

export type DashboardContext = {
    dashboard: {id: number; name: string; kind: string} | null;
    manage_url: string | null;
    onboarding_url: string | null;
};

export type Area = {level: string; id: number | null; name: string};
export type Candidate = {
    id: number;
    name: string;
    party: string;
    votes: number;
    share: number;
    focused: boolean;
};
export type Tally = {
    candidates: Array<Candidate>;
    votes: number;
    reported: number;
    stations: number;
    disagreements: number;
    leader_ids: Array<number>;
    status: string;
};
export type Results = {
    dashboard: string;
    race: string;
    focus: string | null;
    area: Area;
    breadcrumbs: Array<Area>;
    summary: Tally;
    children: Array<Area & Tally>;
};

export class DashboardError extends Error {
    constructor(
        message: string,
        readonly status: number,
    ) {
        super(message);
    }
}

export async function fetchDashboard<T>(url: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(url, {
        credentials: "same-origin",
        signal,
        cache: "no-store",
        headers: {Accept: "application/json"},
    });
    if (!response.ok) {
        throw new DashboardError(
            response.status === 404
                ? "This area is not part of your dashboard."
                : "Could not load dashboard results.",
            response.status,
        );
    }
    return response.json();
}

export function resultsUrl(area: Area | null) {
    if (!area) return "/api/results/dashboard/results/";
    const params = new URLSearchParams({area: area.level});
    if (area.id !== null) params.set("id", String(area.id));
    return `/api/results/dashboard/results/?${params}`;
}

export type StationRow = Area & {
    reported: boolean;
    disagrees: boolean;
    votes: number | null;
    position: number | null;
    tied: boolean;
    leaders: Array<string>;
};
export type Stations = {area: Area; stations: Array<StationRow>};

export function stationsUrl(area: Area) {
    const params = new URLSearchParams({area: area.level});
    if (area.id !== null) params.set("id", String(area.id));
    return `/api/results/dashboard/stations/?${params}`;
}

/** Results change as uploads arrive, so never serve them from a cache. */
export const uncached = {
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
} as const;

export type Upload = {
    id: string;
    votes: Record<string, number | null>;
    rejected: number;
    disputed: number;
    agreed: number;
};
export type Uploads = {
    station: Area;
    candidates: Array<{id: number; name: string}>;
    uploads: Array<Upload>;
};

export function uploadsUrl(stationId: number) {
    return `/api/results/dashboard/uploads/?id=${stationId}`;
}

export function photoUrl(uploadId: string) {
    return `/api/results/dashboard/uploads/${uploadId}/photo/`;
}
