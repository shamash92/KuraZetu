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

type Connection = {saveData?: boolean; effectiveType?: string};

/**
 * Fetches Mermaid ahead of need, so a diagram is drawn without a wait.
 *
 * It waits until the browser is idle, and leaves alone a person who has
 * asked to save data or is on a slow connection: Mermaid is several
 * megabytes, and most specifications have no diagram. Returns the way to
 * call it off.
 */
export function preloadMermaid(): () => void {
    const {connection} = navigator as Navigator & {connection?: Connection};
    if (connection?.saveData || /(^|-)[23]g$/.test(connection?.effectiveType ?? "")) {
        return () => {};
    }

    // A failed fetch is not reported: the diagram asks again when it is drawn.
    const load = () => void import("mermaid").catch(() => {});
    if (typeof window.requestIdleCallback === "function") {
        const handle = window.requestIdleCallback(load, {timeout: 5000});
        return () => window.cancelIdleCallback(handle);
    }
    const handle = window.setTimeout(load, 2000);
    return () => window.clearTimeout(handle);
}

/**
 * A Mermaid diagram drawn as a static picture.
 *
 * Mermaid is large, so it is not part of the page: it is fetched ahead by
 * `preloadMermaid`, or when the first diagram is drawn.
 * The strict security level drops click handlers and links and escapes any
 * markup in labels. While it is being drawn a placeholder holds its place.
 * When the source cannot be drawn the reader gets it as a code block;
 * `showError` adds the reason for the author.
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

    // Until the outcome is known nothing of the source is shown: it would
    // flash on screen and then be replaced by the picture.
    if (failure?.source !== source) {
        return (
            <p className="diagram diagram--pending" role="status">
                Drawing diagram…
            </p>
        );
    }

    return (
        <>
            <pre>
                <code>{source}</code>
            </pre>
            {showError && (
                <p role="alert">This diagram cannot be drawn: {failure.reason}</p>
            )}
        </>
    );
}
