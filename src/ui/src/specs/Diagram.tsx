import {useEffect, useId, useState} from "react";

/**
 * Removes the two ways a diagram's own source can reconfigure the renderer:
 * a front-matter block and `%%{init}%%` directives. What is left can only
 * describe the diagram.
 */
function withoutConfiguration(source: string): string {
    return source
        .replace(/^\s*---\n[\s\S]*?\n---\s*\n/, "")
        .replace(/%%\{[\s\S]*?\}%%/g, "");
}

/**
 * A Mermaid diagram drawn as a static picture.
 *
 * Mermaid is large, so it is fetched only when a specification has a diagram.
 * The strict security level drops click handlers and links and escapes any
 * markup in labels. When the source cannot be drawn the reader gets it as a
 * code block; `showError` adds the reason for the author.
 */
export function Diagram({source, showError}: {source: string; showError: boolean}) {
    const id = `diagram-${useId().replace(/[^a-z0-9]/gi, "")}`;
    const [drawing, setDrawing] = useState<{source: string; svg: string} | null>(
        null,
    );
    const [failure, setFailure] = useState<{source: string; reason: string} | null>(
        null,
    );

    useEffect(() => {
        let isCurrent = true;

        async function draw() {
            try {
                const {default: mermaid} = await import("mermaid");
                mermaid.initialize({
                    startOnLoad: false,
                    securityLevel: "strict",
                    suppressErrorRendering: true,
                });
                const {svg} = await mermaid.render(id, withoutConfiguration(source));
                if (isCurrent) setDrawing({source, svg});
            } catch (error) {
                if (isCurrent) {
                    setFailure({
                        source,
                        reason: error instanceof Error ? error.message : String(error),
                    });
                }
            }
        }

        void draw();
        return () => {
            isCurrent = false;
        };
    }, [id, source]);

    if (drawing?.source === source) {
        return (
            <figure className="diagram" dangerouslySetInnerHTML={{__html: drawing.svg}} />
        );
    }

    return (
        <>
            <pre>
                <code>{source}</code>
            </pre>
            {showError && failure?.source === source && (
                <p role="alert">This diagram cannot be drawn: {failure.reason}</p>
            )}
        </>
    );
}
