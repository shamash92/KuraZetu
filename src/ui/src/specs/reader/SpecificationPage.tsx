import {useQuery} from "@tanstack/react-query";
import {Lock} from "lucide-react";
import {Link, useParams} from "react-router-dom";

import {specKeys} from "../../api/queryKeys";
import {querySettings} from "../../api/querySettings";

import {documentSetPath} from "../library/documentSets";
import {getSpecificationPage} from "../shared/api";
import {NotFound, SpecsShell} from "../shared/SpecsShell";
import {
    RESTRICTED_NOTICE,
    StageMark,
    Status,
    formatDate,
    indexOf,
} from "../shared/standing";

import {SpecMarkdown, headingId, headingsOf} from "./SpecMarkdown";

export function SpecificationPage() {
    const {slug = ""} = useParams();
    const page = useQuery({
        queryKey: specKeys.page(slug),
        queryFn: ({signal}) => getSpecificationPage(slug, signal),
        ...querySettings.specs,
    });
    const spec = page.data;
    const isLocked = spec?.access === "locked";
    const successor = spec?.superseded_by;
    const contents = spec?.body ? headingsOf(spec.body) : [];
    // A short document reads straight through; a long one gets a way around.
    const hasContents = contents.length >= 4;

    return (
        <SpecsShell editSlug={spec?.slug}>
            {page.isPending && <p className="status">Loading specification…</p>}
            {page.isError && <NotFound />}
            {spec && (
                <>
                    {successor && (
                        <p className="banner" role="note">
                            <Status archived={spec.archived} superseded />
                            <span>
                                Replaced by{" "}
                                <Link to={`/ui/specs/${successor.slug}/`}>
                                    {successor.title}
                                </Link>
                                . New work should follow the replacement.
                            </span>
                        </p>
                    )}
                    {spec.archived && !successor && (
                        <p className="banner" role="note">
                            <Status archived />
                            <span>Kept for reference. No longer maintained.</span>
                        </p>
                    )}

                    <header className="mast">
                        <h1>{spec.title}</h1>
                        {spec.summary && <p className="lede">{spec.summary}</p>}
                        <dl className="facts">
                            <div>
                                <dt>Index</dt>
                                <dd>{indexOf(spec.slug)}</dd>
                            </div>
                            {spec.document_set && (
                                <div>
                                    <dt>Document set</dt>
                                    <dd>
                                        <Link to={documentSetPath(spec.document_set.slug)}>
                                            {spec.document_set.title}
                                        </Link>
                                    </dd>
                                </div>
                            )}
                            {spec.stage && (
                                <div>
                                    <dt>Stage</dt>
                                    <dd>
                                        <StageMark stage={spec.stage} />
                                    </dd>
                                </div>
                            )}
                            {spec.published_at && (
                                <div>
                                    <dt>Published</dt>
                                    <dd>{formatDate(spec.published_at)}</dd>
                                </div>
                            )}
                            {(spec.archived || successor) && (
                                <div>
                                    <dt>Status</dt>
                                    <dd>
                                        <Status
                                            archived={spec.archived}
                                            superseded={Boolean(successor)}
                                        />
                                    </dd>
                                </div>
                            )}
                            {isLocked && (
                                <div>
                                    <dt>Access</dt>
                                    <dd>
                                        <Lock size={14} aria-hidden="true" />
                                        Restricted
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </header>

                    {isLocked ? (
                        <section className="lockpanel" aria-label="Access required">
                            <Lock size={40} strokeWidth={1.4} aria-hidden="true" />
                            <h2>This specification is restricted.</h2>
                            <p>{RESTRICTED_NOTICE}</p>
                        </section>
                    ) : (
                        <div className={hasContents ? "reader has-toc" : "reader"}>
                            <article className="doc-body">
                                <SpecMarkdown source={spec.body ?? ""} />
                            </article>
                            {hasContents && (
                                <nav className="toc" aria-label="Contents">
                                    <p className="t">Contents</p>
                                    <ol>
                                        {contents.map((heading) => (
                                            <li key={heading}>
                                                <a href={`#${headingId(heading)}`}>
                                                    {heading}
                                                </a>
                                            </li>
                                        ))}
                                    </ol>
                                </nav>
                            )}
                        </div>
                    )}
                </>
            )}
        </SpecsShell>
    );
}
