import {IPollingCenterFeature, Location} from "../types/Location";

export const updateLocation = (location: Location): Promise<Location> => {
    // Simulate API update with a delay
    return new Promise((resolve) => {
        setTimeout(() => {
            // In a real app, this would make an API call to update the location
            resolve({
                ...location,
                lastUpdated: new Date().toISOString().split("T")[0],
            });
        }, 1000);
    });
};

export const getStatusColor = (pollingCenter: IPollingCenterFeature): string => {
    // console.log(pollingCenter, "pollingCenter");
    if (pollingCenter.properties.is_verified === true) {
        return "#10B981"; // Green for verified
    }
    if (pollingCenter.properties.pin_location_error) {
        return "#EF4444"; // Red for error
    }
    if (
        pollingCenter.properties.pin_location_error === null &&
        !pollingCenter.properties.is_verified
    ) {
        return "#F59E0B"; // Amber/Yellow for unverified
    }

    return "#9CA3AF"; // Gray for missing or unknown status
};

export const getStatusText = (location: IPollingCenterFeature): string => {
    if (location.properties.is_verified) {
        return "Verified";
    } else if (location.properties.pin_location_error) {
        return "Error";
    } else if (location.geometry === null) {
        return "Missing";
    }
    return "Unverified";
};

export default {};
