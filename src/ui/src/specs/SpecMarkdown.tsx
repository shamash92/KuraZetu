import type {ComponentProps} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * A link out of a specification.
 *
 * `react-markdown` blanks the address of a link with an unsafe scheme, and
 * that is shown as plain text rather than a link to nowhere. A link to
 * another site gets no reference back to this page.
 */
function SpecLink({href, children}: ComponentProps<"a">) {
    if (!href) return <span>{children}</span>;

    // `//host/path` names another site without naming a scheme.
    const isExternal = /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(href);

    return (
        <a
            href={href}
            {...(isExternal ? {rel: "noopener noreferrer", target: "_blank"} : {})}
        >
            {children}
        </a>
    );
}

/**
 * The one renderer for specification Markdown, shared by the reader and the
 * editor preview so the two cannot drift apart.
 *
 * Raw HTML is never parsed, and images are dropped so a specification body
 * cannot make the browser load anything from another origin.
 */
export function SpecMarkdown({source}: {source: string}) {
    return (
        <div className="prose">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                disallowedElements={["img"]}
                components={{a: SpecLink}}
            >
                {source}
            </ReactMarkdown>
        </div>
    );
}
