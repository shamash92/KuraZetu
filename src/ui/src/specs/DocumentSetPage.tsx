import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {ArrowDown, ArrowUp, Info, Lock} from "lucide-react";
import {Link, useParams} from "react-router-dom";

import {specKeys} from "../api/queryKeys";
import {querySettings} from "../api/querySettings";

import {useAuth} from "../App";

import {getLibrary} from "./api";
import {getDocumentSets, rearrangeDocumentSet} from "./authorApi";
import {
    NotFound,
    SpecsShell,
    StageMark,
    formatDate,
    membersOf,
    ordinal,
} from "./SpecsShell";

/**
 * The specifications of one document set. It is the library filtered to the
 * set, so a person sees here only what the library already shows them.
 */
export function DocumentSetPage() {
    const {slug = ""} = useParams();
    const library = useQuery({
        queryKey: specKeys.library(),
        queryFn: ({signal}) => getLibrary(signal),
        ...querySettings.specs,
    });
    const members = membersOf(library.data ?? [], slug);
    const set = members[0]?.document_set;

    // The author routes answer "not found" to everyone but an author, so a
    // successful read is what shows the controls. Visitors are never asked.
    const isSignedIn = useAuth();
    const authoring = useQuery({
        queryKey: specKeys.authorDocumentSets(),
        queryFn: ({signal}) => getDocumentSets(signal),
        enabled: isSignedIn,
        retry: false,
        ...querySettings.specs,
    });
    const queryClient = useQueryClient();
    const rearrange = useMutation({
        mutationFn: (order: Array<string>) => rearrangeDocumentSet(slug, order),
        onSuccess: () =>
            queryClient.invalidateQueries({queryKey: specKeys.library()}),
    });

    /** Swaps a member with the one before or after it. */
    function move(index: number, by: -1 | 1) {
        const order = members.map((member) => member.slug);
        [order[index], order[index + by]] = [order[index + by], order[index]];
        rearrange.mutate(order);
    }

    return (
        <SpecsShell>
            {library.isPending && <p className="status">Loading specifications…</p>}
            {(library.isError || (library.isSuccess && !set)) && <NotFound />}
            {set && (
                <>
                    <header className="mast mast--set">
                        <div>
                            <p className="eyebrow">
                                Document set · {members.length}{" "}
                                {members.length === 1
                                    ? "specification"
                                    : "specifications"}
                            </p>
                            <h1>{set.title}</h1>
                            {set.summary && <p className="lede">{set.summary}</p>}
                        </div>
                        <p className="order" role="note">
                            <Info size={16} aria-hidden="true" />
                            {set.ordered
                                ? "These specifications have a suggested reading order."
                                : "These specifications can be read in any order."}
                        </p>
                    </header>
                    {rearrange.isError && (
                        <p role="alert">{rearrange.error.message}</p>
                    )}
                    <ol className="set-rows">
                        {members.map((member, index) => (
                            <li key={member.slug}>
                                {set.ordered && (
                                    <span className="n">{ordinal(index)}</span>
                                )}
                                <div className="what">
                                    <Link to={`/ui/specs/${member.slug}/`}>
                                        {member.title}
                                    </Link>
                                    {member.summary && <p>{member.summary}</p>}
                                </div>
                                <div className="standing">
                                    {member.stage && <StageMark stage={member.stage} />}
                                    {member.access === "locked" && (
                                        <span className="acc">
                                            <Lock size={14} aria-hidden="true" />
                                            Locked
                                        </span>
                                    )}
                                    {member.published_at && (
                                        <span>{formatDate(member.published_at)}</span>
                                    )}
                                </div>
                                {authoring.isSuccess && (
                                    <div className="reorder">
                                        <button
                                            type="button"
                                            className="icon"
                                            aria-label={`Move ${member.title} up`}
                                            title="Move up"
                                            disabled={index === 0 || rearrange.isPending}
                                            onClick={() => move(index, -1)}
                                        >
                                            <ArrowUp size={14} aria-hidden="true" />
                                        </button>
                                        <button
                                            type="button"
                                            className="icon"
                                            aria-label={`Move ${member.title} down`}
                                            title="Move down"
                                            disabled={
                                                index === members.length - 1 ||
                                                rearrange.isPending
                                            }
                                            onClick={() => move(index, 1)}
                                        >
                                            <ArrowDown size={14} aria-hidden="true" />
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ol>
                </>
            )}
        </SpecsShell>
    );
}
