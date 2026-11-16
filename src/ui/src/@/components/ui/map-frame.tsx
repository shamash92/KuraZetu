import React from "react";
import {LoaderCircle, MapPinOff} from "lucide-react";

import {cn} from "@/src/@/components/lib/utils";
import {Button} from "./button";

type MapFrameProps = React.ComponentProps<"figure"> & {
    label: string;
    status?: "ready" | "loading" | "empty" | "error";
    caption?: React.ReactNode;
    errorMessage?: string;
    onRetry?: () => void;
};

/** A shared map surface; the consumer supplies its map renderer and data. */
export function MapFrame({label, children, status = children ? "ready" : "empty", caption, errorMessage = "The map could not be loaded.", onRetry, className, ...props}: MapFrameProps) {
    return <figure className={cn("overflow-clip rounded-[18px] border border-border bg-card", className)} {...props}>
        <div role="region" aria-label={label} aria-busy={status === "loading"} className="relative h-80 min-h-60 bg-secondary [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full">
            {status === "ready" ? children : <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                {status === "loading" ? <><LoaderCircle aria-hidden="true" className="size-6 motion-safe:animate-spin" /><p role="status">Loading map</p></> : <><MapPinOff aria-hidden="true" className="size-6 text-muted-foreground" /><p role={status === "error" ? "alert" : "status"}>{status === "error" ? errorMessage : "No map is available for this selection."}</p>{status === "error" && onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}</>}
            </div>}
        </div>
        {caption && <figcaption className="border-t border-border px-4 py-3 text-sm text-muted-foreground">{caption}</figcaption>}
    </figure>;
}
