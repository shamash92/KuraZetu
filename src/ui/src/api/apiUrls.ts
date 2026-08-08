// KuraZetu API paths for the web client. Same-origin, so no base URL.
//
// Fixed paths are constants; parameterised paths are builders. Group by domain
// rather than letting this become a general-purpose utility module.

export const COUNTY_BOUNDARIES_URL = "/api/stations/counties/boundaries/";

export function constituencyBoundariesUrl(countyNumber: number): string {
    return `/api/stations/county/${countyNumber}/constituencies/boundaries/`;
}

export function wardBoundariesUrl(constituencyNumber: number): string {
    return `/api/stations/constituencies/${constituencyNumber}/wards/boundaries/`;
}

export function pollingCenterPinsUrl(wardNumber: number): string {
    return `/api/stations/wards/${wardNumber}/polling-centers/pins/`;
}

export const SIGNUP_URL = "/api/accounts/signup/";

export function countyResultsUrl(level: string): string {
    return `/api/results/county/${level}/`;
}

// The polling-centre routes predate the level names the client uses, so two of
// the six segments differ from their level. Keep this map in step with
// `results/api/urls.py`; a level missing from it is a type error at the call
// site rather than an `undefined` in a URL.
const POLLING_CENTER_RESULT_PATHS = {
    president: "presidential",
    governor: "governor",
    senator: "senator",
    women_rep: "women-rep",
    mp: "mp",
    mca: "mca",
} as const;

export function pollingCenterResultsUrl(
    wardNumber: number,
    pollingCenterCode: string,
    level: keyof typeof POLLING_CENTER_RESULT_PATHS,
): string {
    const path = POLLING_CENTER_RESULT_PATHS[level];
    return `/api/results/polling-center/${wardNumber}/${encodeURIComponent(
        pollingCenterCode,
    )}/${path}/`;
}
