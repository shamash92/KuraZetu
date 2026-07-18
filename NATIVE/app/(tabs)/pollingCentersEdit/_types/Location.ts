export type PinStatus = "unverified" | "error" | "missing" | "verified";

export interface Location {
    id: string;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    status: PinStatus;
    address?: string;
    category?: string;
    lastUpdated?: string;
}

export interface Region {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
}

export interface IPollingCenterFeature {
    id: number;
    type: "Feature";
    geometry: {
        type: "Point";
        coordinates: [number, number];
    };
    properties: {
        name: string;
        code: string;
        ward: number;
        pin_location_error: null | string;
        is_verified: boolean;
    };
}

export interface IPollingCenterData {
    type: "FeatureCollection";
    features: IPollingCenterFeature[];
}

export default {};
