import React, {useState} from "react";
import {ImageOff, LoaderCircle} from "lucide-react";

import {cn} from "@/src/@/components/lib/utils";

type ImageProps = Omit<React.ComponentProps<"img">, "alt" | "children"> & {
    alt: string;
    caption?: React.ReactNode;
    aspectRatio?: string;
    fit?: "cover" | "contain";
    /** Optional parent-owned state, for example while an upload is pending. */
    status?: "loading" | "error";
};

function ImageContent({alt, caption, aspectRatio = "4 / 3", fit = "cover", status, className, onLoad, onError, ...props}: ImageProps) {
    const [state, setState] = useState<"loading" | "ready" | "error">(props.src ? "loading" : "error");
    const current = status ?? state;
    return (
        <figure className={cn("w-full", className)} aria-busy={current === "loading"}>
            <div className="relative overflow-clip rounded-[18px] border border-border bg-secondary" style={{aspectRatio}}>
                {current !== "error" && <img {...props} alt={alt} className={cn("h-full w-full", fit === "cover" ? "object-cover" : "object-contain", current === "loading" && "invisible")} onLoad={(event) => {setState("ready"); onLoad?.(event);}} onError={(event) => {setState("error"); onError?.(event);}} />}
                {current === "loading" && <div role="status" className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" />Loading image</div>}
                {current === "error" && <div role={alt ? "img" : undefined} aria-hidden={!alt} aria-label={alt ? `${alt}. Image unavailable.` : undefined} className="flex h-full flex-col items-center justify-center gap-2 p-4 text-sm text-muted-foreground"><ImageOff aria-hidden="true" className="size-6" /><span>Image unavailable</span></div>}
            </div>
            {caption && <figcaption className="mt-2 text-sm text-muted-foreground">{caption}</figcaption>}
        </figure>
    );
}

/** Resets loading and error state when the source changes. className styles the frame. */
export function Image(props: ImageProps) {
    return <ImageContent key={props.src} {...props} />;
}
