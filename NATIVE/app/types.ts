export interface ICountyFeature {
    id: number;
    type: "Feature";
    geometry: {
        type: "Polygon";
        coordinates: [number, number][][];
    };
    properties: {
        number: number;
        name: string;
    };
}

export interface ICountyFeatureCollection {
    type: "FeatureCollection";
    features: ICountyFeature[];
}

export type TLevelTabs =
    | "president"
    | "governor"
    | "senator"
    | "womanRep"
    | "mp"
    | "mca";

export type TLevelDjango =
    | "president"
    | "governor"
    | "senator"
    | "mp"
    | "women_rep"
    | "mca";

export interface ICandidateDetails {
    id: number;
    first_name: string;
    last_name: string;
    surname: null | string;
    party: string;
    party_color: string;
    level: TLevelDjango;
    passport_photo: null | string;
    county: null;
    constituency: null;
    ward: null;
    is_verified: boolean;
    verified_by_party: boolean;
}

export interface IPollingStationData {
    code: string;
    stream_number: number;
    registered_voters: number;
    date_created: string;
    date_modified: string;
    is_verified: boolean;
}

export interface IPollingCenterCandidateResults {
    polling_station: IPollingStationData;
    presidential_candidate: ICandidateDetails | null;
    governor_candidate: ICandidateDetails | null;
    senator_candidate: ICandidateDetails | null;
    woman_rep_candidate: ICandidateDetails | null;
    mp_candidate: ICandidateDetails | null;
    mca_candidate: ICandidateDetails | null;

    votes: number;
    is_verified: boolean;
}

export interface IPresidentialNationalResults {
    name: string;
    party: string;
    party_color: string;
    votes: number;
    percentage: number;
    total_polling_stations_with_results: number;
    nationwide_polling_stations_count: number;
    image: string;
}

export interface ICountyPresResults {
    fullName: string;
    party: string;
    party_color: string;
    totalVotes: number;
    countedStreams: number;
    county_polling_stations_count: number;
    percentage: number;
}

export interface IPollingStationPresResults {
    polling_station: IPollingStationData;
    presidential_candidate: ICandidateDetails;
    votes: number;
    is_verified: boolean;
}

export default {};
