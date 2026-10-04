import {useMutation, useQuery} from "@tanstack/react-query";
import {useState} from "react";
import {Link, useNavigate} from "react-router-dom";

import {specKeys} from "../api/queryKeys";
import {querySettings} from "../api/querySettings";

import {createSpecification, getAuthorLibrary} from "./authorApi";
import type {AccessPolicy, AuthorEntry} from "./authorApi";
import {SpecsShell} from "./SpecsShell";

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

export function AuthorLibrary() {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");

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
                <h1>Page not found</h1>
                <p className="lede">
                    <Link to="/ui/specs/">See all specifications</Link>.
                </p>
            </SpecsShell>
        );
    }

    return (
        <SpecsShell>
            <h1>Write specifications</h1>
            {library.isPending && <p className="status">Loading…</p>}

            <ul className="entries">
                {library.data?.map((spec) => (
                    <li key={spec.slug}>
                        <h2>
                            <Link to={`/ui/specs/author/${spec.slug}/`}>
                                {spec.title}
                            </Link>
                        </h2>
                        <p className="meta">
                            {spec.slug} · {POLICY_NAMES[spec.access_policy]} ·{" "}
                            {publicationStatus(spec)}
                            {spec.archived && " · Archived"}
                        </p>
                    </li>
                ))}
            </ul>

            <form
                className="panel"
                onSubmit={(event) => {
                    event.preventDefault();
                    create.mutate();
                }}
            >
                <h2>New specification</h2>
                <p>
                    A new specification is concealed until you change its access
                    policy. Its address is generated and says nothing about its
                    title.
                </p>
                <label htmlFor="new-title">Title</label>
                <input
                    id="new-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    maxLength={200}
                />
                {create.isError && <p role="alert">{create.error.message}</p>}
                <button type="submit" disabled={create.isPending}>
                    Create draft
                </button>
            </form>
        </SpecsShell>
    );
}
