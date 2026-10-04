import {useMutation, useQuery} from "@tanstack/react-query";
import {useState} from "react";
import {useNavigate} from "react-router-dom";

import {specKeys} from "../api/queryKeys";
import {querySettings} from "../api/querySettings";

import {createSpecification, getAuthorLibrary} from "./authorApi";
import type {AccessPolicy, AuthorEntry} from "./authorApi";
import {NotFound, SpecsShell} from "./SpecsShell";

export const POLICY_NAMES: Record<AccessPolicy, string> = {
    PUBLIC: "Public",
    RESTRICTED_LISTED: "Restricted, listed",
    RESTRICTED_CONCEALED: "Restricted, concealed",
};

export function publicationStatus(spec: AuthorEntry): string {
    if (!spec.published) return "Not published";
    return spec.has_unpublished_changes
        ? "Published, with unpublished changes in the draft"
        : "Published";
}

export function NewSpecification() {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");

    // Read only to learn whether this account may write at all.
    const library = useQuery({
        queryKey: specKeys.authorLibrary(),
        queryFn: ({signal}) => getAuthorLibrary(signal),
        retry: false,
        ...querySettings.specs,
    });
    const create = useMutation({
        mutationFn: () => createSpecification(title),
        onSuccess: (created) => navigate(`/ui/specs/author/${created.slug}/`),
    });

    if (library.isError) {
        return (
            <SpecsShell>
                <NotFound />
            </SpecsShell>
        );
    }

    // Nothing is offered until the account is known to be an author.
    if (library.isPending) return <SpecsShell>{null}</SpecsShell>;

    return (
        <SpecsShell>
            {/* A blank sheet from the library: the title is written straight
                onto it. */}
            <form
                className="blank"
                onSubmit={(event) => {
                    event.preventDefault();
                    create.mutate();
                }}
            >
                <div className="sheet-top">
                    <h1>New specification</h1>
                    <span>Draft</span>
                </div>
                <label htmlFor="new-title">Title</label>
                <textarea
                    id="new-title"
                    rows={2}
                    autoFocus
                    required
                    maxLength={200}
                    placeholder="What is it called?"
                    value={title}
                    // A title is one line, however it wraps on the sheet.
                    onChange={(event) =>
                        setTitle(event.target.value.replace(/\s*\n\s*/g, " "))
                    }
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            event.currentTarget.form?.requestSubmit();
                        }
                    }}
                />
                {create.isError && <p role="alert">{create.error.message}</p>}
                <div className="blank-foot">
                    <p>
                        Starts concealed. Only authors can see it until you change
                        its access.
                    </p>
                    <button
                        className="primary"
                        type="submit"
                        disabled={create.isPending}
                    >
                        Create draft
                    </button>
                </div>
            </form>
        </SpecsShell>
    );
}
