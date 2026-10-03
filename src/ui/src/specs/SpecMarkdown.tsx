import type {ComponentProps} from "react";
import ReactMarkdown from "react-markdown";
import type {ExtraProps} from "react-markdown";
import remarkGfm from "remark-gfm";

import {Diagram} from "./Diagram";

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

/** The source of a fenced `mermaid` block, or null for any other block. */
function diagramSource(pre: ExtraProps["node"]): string | null {
    const code = pre?.children[0];
    if (code?.type !== "element") return null;

    const languages = code.properties.className;
    if (!Array.isArray(languages) || !languages.includes("language-mermaid")) {
        return null;
    }

    const text = code.children[0];
    return text?.type === "text" ? text.value : null;
}

/**
 * The one renderer for specification Markdown, shared by the reader and the
 * editor preview so the two cannot drift apart.
 *
 * Raw HTML is never parsed, and images are dropped so a specification body
 * cannot make the browser load anything from another origin.
 */
export function SpecMarkdown({
    source,
    showDiagramErrors = false,
}: {
    source: string;
    /** The editor preview says why a diagram failed; the reader does not. */
    showDiagramErrors?: boolean;
}) {
    function Block({node, children}: ComponentProps<"pre"> & ExtraProps) {
        const diagram = diagramSource(node);
        if (diagram === null) return <pre>{children}</pre>;
        return <Diagram source={diagram} showError={showDiagramErrors} />;
    }

    return (
        <div className="prose">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                disallowedElements={["img"]}
                components={{a: SpecLink, pre: Block}}
            >
                {source}
            </ReactMarkdown>
        </div>
    );
}
