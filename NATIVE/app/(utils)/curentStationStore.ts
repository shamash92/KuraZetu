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

export interface IPollingStation {
    code: string;
    date_created: string;
    date_modified: string;
    is_verified: boolean;
    registered_voters: number;
    stream_number: number;
}

export interface ICurrentStationInfo extends IPollingStation {
    polling_center: string;
}

export type TCurrentStationCode = string | null;
interface CurrentStationState {
    currentStationCode: TCurrentStationCode;
    currentCenter: IPollingCenterInfo | null;
    currentStationInfo: ICurrentStationInfo | null;
    stations: IPollingStation[];
    setCurrentStationCode: (code: TCurrentStationCode) => void;
    setCurrentCenter: (center: IPollingCenterInfo | null) => void;
    setStations: (stations: IPollingStation[]) => void;
    setCurrentStationInfo: (station: ICurrentStationInfo) => void;
}

export const useCurrentPollingStationStore = create(
    persist<CurrentStationState>(
        (set) => ({
            currentStationCode: null,
            currentCenter: null,
            stations: [],
            currentStationInfo: null,
            setCurrentStationCode: (code: TCurrentStationCode) => {
                set((state) => ({
                    ...state,
                    currentStationCode: code !== null ? String(code) : null,
                }));
            },
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
            setCurrentStationInfo: (station: ICurrentStationInfo) => {
                set((state) => ({
                    ...state,
                    currentStationInfo: station,
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
