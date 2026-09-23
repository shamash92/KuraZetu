export type NetworkStatus = "checking" | "online" | "offline";

type Connectivity = {isConnected: boolean | null};

/**
 * Offline means NetInfo reports no connection at all. Whether that connection
 * reaches Django is left to the sign-in request itself, and `null` means
 * NetInfo is still checking.
 */
export function networkStatus({isConnected}: Connectivity): NetworkStatus {
    if (isConnected === false) return "offline";
    if (isConnected === null) return "checking";
    return "online";
}
