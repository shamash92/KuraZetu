export interface IPollingCenterFeature {
    id: number;
    type: "Feature";
    geometry: {
        type: "Polygon";
        coordinates: [number, number][];
    };
    properties: {
        name: string;
        code: string;
        ward: string;
        ward_number?: number | null;
        ward_boundary?: any | null;
        constituency: string;
        county: string;
        radius?: number;
        pin_location_error: null | string;
        is_verified: boolean;
        is_unlocated?: boolean;
        location_upvotes: number;
        pin_location: {
            type: "Point";
            coordinates: [number, number];
        };
        // Present on partial-verification features (existing suggestions).
        suggested_by?: string;
        suggested_on?: string;
        comment?: string | null;
        ai_suggestion?: boolean;
        ai_model?: string | null;
        nominatim?: boolean;
        is_outlier?: boolean;
        is_upvote?: boolean;
    };
}

// Result row from the geocode endpoint (/api/stations/geocode/).
export interface IGeocodeResult {
    name: string;
    lat: number;
    lng: number;
    type: string;
}

// Consensus summary returned by the verify endpoint.
export interface IConsensus {
    verified: boolean;
    agree: number;
    needed: number;
    outliers: number;
}

export type TLevel = "county" | "constituency" | "ward";
