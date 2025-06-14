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
        constituency: string;
        county: string;
        pin_location_error: null | string;
        is_verified: boolean;
        location_upvotes: number;
        pin_location: {
            type: "Point";
            coordinates: [number, number];
        };
    };
}

export type TLevel = "county" | "constituency" | "ward";
