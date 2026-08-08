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
