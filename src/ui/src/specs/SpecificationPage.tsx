import {useQuery} from "@tanstack/react-query";
import {Link, useParams} from "react-router-dom";

import {specKeys} from "../api/queryKeys";
import {querySettings} from "../api/querySettings";

import {getSpecificationPage} from "./api";
import {SpecMarkdown} from "./SpecMarkdown";
import {RESTRICTED_NOTICE, SpecsShell} from "./SpecsShell";

const PUBLISHED_DATE = new Intl.DateTimeFormat("en-KE", {dateStyle: "long"});

export function SpecificationPage() {
    const {slug = ""} = useParams();
    const page = useQuery({
        queryKey: specKeys.page(slug),
        queryFn: ({signal}) => getSpecificationPage(slug, signal),
        ...querySettings.specs,
    });
    const spec = page.data;

    return (
        <SpecsShell>
            {page.isPending && <p className="status">Loading specification…</p>}
            {page.isError && (
                <>
                    <h1>Specification not found</h1>
                    <p className="lede">
                        There is no specification at this address.{" "}
                        <Link to="/ui/specs/">See all specifications</Link>.
                    </p>
                </>
            )}
            {spec && (
                <article>
                    <h1>{spec.title}</h1>
                    {spec.summary && <p className="lede">{spec.summary}</p>}
                    {spec.published_at && (
                        <p className="meta">
                            Published{" "}
                            {PUBLISHED_DATE.format(new Date(spec.published_at))}
                        </p>
                    )}
                    {spec.archived && (
                        <p className="notice">
                            Archived. This specification is no longer maintained.
                        </p>
                    )}
                    {spec.superseded_by && (
                        <p className="notice">
                            Superseded by{" "}
                            <Link to={`/ui/specs/${spec.superseded_by.slug}/`}>
                                {spec.superseded_by.title}
                            </Link>
                            .
                        </p>
                    )}
                    {spec.access === "locked" ? (
                        <p className="notice">{RESTRICTED_NOTICE}</p>
                    ) : (
                        <SpecMarkdown source={spec.body ?? ""} />
                    )}
                </article>
            )}
        </SpecsShell>
    );
}
