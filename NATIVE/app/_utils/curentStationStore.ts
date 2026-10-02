import {createJSONStorage, persist} from "zustand/middleware";
import {deleteItemAsync, getItem, setItem} from "expo-secure-store";

import {create} from "zustand";

export interface IPollingStationInfo {
    code: string;
    date_created: string;
    date_modified: string;
    is_verified: boolean;
    registered_voters: number;
    stream_number: number;
    polling_center: string;
}

export interface IPollingCenterInfo {
    code: string;
    constituency: string;
    county: string;
    id: number;
    name: string;
    ward: string;
}

interface IPollingStation {
    code: string;
    date_created: string;
    date_modified: string;
    is_verified: boolean;
    registered_voters: number;
    stream_number: number;
}

interface CurrentStationState {
    currentCenter: IPollingCenterInfo | null;
    stations: IPollingStation[];
    setCurrentCenter: (center: IPollingCenterInfo | null) => void;
    setStations: (stations: IPollingStation[]) => void;
}

export const useCurrentPollingStationStore = create(
    persist<CurrentStationState>(
        (set) => ({
            currentCenter: null,
            stations: [],
            setCurrentCenter: (center: IPollingCenterInfo | null) => {
                set((state) => ({
                    ...state,
                    currentCenter: center,
                }));
            },
            setStations: (stations: IPollingStation[]) => {
                set((state) => ({
                    ...state,
                    stations,
                }));
            },
        }),
        {
            name: "current-stations-store",
            storage: createJSONStorage(() => ({
                setItem,
                getItem,
                removeItem: deleteItemAsync,
            })),
        },
    ),
);

export default useCurrentPollingStationStore;
