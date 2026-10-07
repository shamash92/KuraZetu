import {useQuery} from "@tanstack/react-query";

import {specKeys} from "../../api/queryKeys";
import {querySettings} from "../../api/querySettings";
import {useAuth} from "../../App";

import {getAuthorLibrary} from "./authorApi";

/**
 * Whether the person on the page is an author.
 *
 * The author routes answer "not found" to everyone but an author, so a
 * successful read of the author's library is what makes a person one here.
 * A visitor is never asked: with no account the answer is already no.
 */
export function useAuthor() {
    const isSignedIn = useAuth();
    const library = useQuery({
        queryKey: specKeys.authorLibrary(),
        queryFn: ({signal}) => getAuthorLibrary(signal),
        enabled: isSignedIn,
        retry: false,
        ...querySettings.specs,
    });

    return {
        isAuthor: library.isSuccess,
        /** False only while a signed-in person's answer is on its way. */
        isKnown: !isSignedIn || !library.isPending,
        /** Every specification, drafts included. Empty for anyone else. */
        library: library.data ?? [],
    };
}
