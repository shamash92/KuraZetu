import NetInfo, {useNetInfo} from "@react-native-community/netinfo";

import {networkStatus} from "./networkStatus";

// iOS reports no native reachability, so NetInfo would otherwise ping a Google
// URL every minute. Without the probe it reports iOS as unreachable, so
// networkStatus reads only the connection state.
NetInfo.configure({reachabilityShouldRun: () => false});

export function useNetworkStatus() {
    return networkStatus(useNetInfo());
}
