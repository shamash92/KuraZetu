import {useQuery} from "@tanstack/react-query";
import {Link} from "react-router-dom";

import {specKeys} from "../api/queryKeys";
import {querySettings} from "../api/querySettings";

import {useAuth} from "../App";

import {getLibrary} from "./api";
import {getAuthorLibrary} from "./authorApi";
import {RESTRICTED_NOTICE, SpecsShell} from "./SpecsShell";

export function Library() {
    const library = useQuery({
        queryKey: specKeys.library(),
        queryFn: ({signal}) => getLibrary(signal),
        ...querySettings.specs,
    });

    // The author routes answer "not found" to everyone but an author, so a
    // successful read is what shows the way in. Visitors are never asked.
    const isSignedIn = useAuth();
    const authoring = useQuery({
        queryKey: specKeys.authorLibrary(),
        queryFn: ({signal}) => getAuthorLibrary(signal),
        enabled: isSignedIn,
        retry: false,
        ...querySettings.specs,
    });

    return (
        <SpecsShell>
            <h1>Specifications</h1>
            <p className="lede">How Kura Zetu is designed to work, and why.</p>
            {authoring.isSuccess && (
                <p>
                    <Link to="/ui/specs/author/">Write and manage specifications</Link>
                </p>
            )}

            {library.isPending && <p className="status">Loading specifications…</p>}
            {library.isError && (
                <p className="status" role="alert">
                    The specifications could not be loaded. Reload the page to try
                    again.
                </p>
            )}
            {library.data?.length === 0 && (
                <p className="status">No specifications are published yet.</p>
            )}

            <ul className="entries">
                {library.data?.map((entry) => (
                    <li key={entry.slug}>
                        <h2>
                            <Link to={`/ui/specs/${entry.slug}/`}>{entry.title}</Link>
                        </h2>
                        {entry.summary && <p>{entry.summary}</p>}
                        {entry.access === "locked" && (
                            <p className="meta">{RESTRICTED_NOTICE}</p>
                        )}
                        {entry.archived && (
                            <p className="meta">Archived. No longer maintained.</p>
                        )}
                    </li>
                ))}
            </ul>
        </SpecsShell>
    );
}
