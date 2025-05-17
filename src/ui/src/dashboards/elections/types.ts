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

export interface IPollingCenterResultsProcessed {
    fullName: string;
    party: string;
    party_color: string;
    totalVotes: number;
    countedStreams: number;
    percentage: number;
}

export interface IAggregatedResults {
    totalStreams: number;
    candidates: IPollingCenterResultsProcessed[];
    totalVotes: number;
}

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

export interface IPollingCenterCandidateResults {
    polling_station: {
        code: string;
        stream_number: number;
        registered_voters: number;
        date_created: string;
        date_modified: string;
        is_verified: boolean;
    };
    presidential_candidate: ICandidateDetails | null;
    governor_candidate: ICandidateDetails | null;
    senator_candidate: ICandidateDetails | null;
    woman_rep_candidate: ICandidateDetails | null;

    votes: number;
    is_verified: boolean;
}

export interface IPollingCenterResultsProcessed {
    fullName: string;
    party: string;
    party_color: string;
    totalVotes: number;
    countedStreams: number;
    percentage: number;
}
