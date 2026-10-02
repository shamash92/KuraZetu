import React, {createContext, useContext, useEffect, useState} from "react";

import {apiBaseURL} from "@/app/_utils/apiBaseURL";
import useAuthStore from "@/app/_utils/authStore";
import {handleUnauthorized} from "@/app/_utils/handleUnauthorized";

interface IStationInfo {
    code: string;
    polling_center: string;
    stream_number: number;
    registered_voters: number;
    is_verified: boolean;
    ward: string | null;
    constituency: string | null;
    county: string | null;
}

const StationInfoContext = createContext<IStationInfo | null>(null);

export function StationInfoProvider({
    code,
    children,
}: {
    code: string;
    children: React.ReactNode;
}) {
    const [station, setStation] = useState<IStationInfo | null>(null);

    const {userToken} = useAuthStore();

    useEffect(() => {
        if (!code || !userToken) {
            return;
        }

        const fetchStation = async () => {
            try {
                const response = await fetch(
                    `${apiBaseURL}/api/stations/community-notes/polling-stations/${code}/info/`,
                    {
                        headers: {Authorization: `Bearer ${userToken}`},
                    },
                );
                if (await handleUnauthorized(response)) return;
                const data = await response.json();
                // An unknown station comes back as 200 with an `error` key.
                setStation(data.error ? null : data);
            } catch (error) {
                console.error("Error fetching polling station info:", error);
            }
        };

        fetchStation();
    }, [code, userToken]);

    return (
        <StationInfoContext.Provider value={station}>
            {children}
        </StationInfoContext.Provider>
    );
}

export function useStationInfo() {
    return useContext(StationInfoContext);
}
