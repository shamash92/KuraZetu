import React from "react";

import {cn} from "@/src/@/components/lib/utils";

const headingStyles = {
    display: "text-[clamp(48px,6vw,84px)] font-black leading-[0.94] tracking-[-0.045em]",
    headline: "text-[30px] font-black leading-[1.27] tracking-[-0.023em]",
    title: "text-2xl font-extrabold leading-tight tracking-[-0.035em]",
};

/** Heading level controls semantics; size controls the visual hierarchy. */
export function Heading({as: Comp = "h2", size = "title", className, ...props}: React.HTMLAttributes<HTMLHeadingElement> & {as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"; size?: keyof typeof headingStyles}) {
    return <Comp className={cn("font-sans text-foreground", headingStyles[size], className)} {...props} />;
}

const textStyles = {
    body: "font-sans text-sm font-medium leading-[1.65]",
    lede: "font-sans text-[17.5px] leading-[1.6]",
    label: "font-mono text-[11px] font-semibold leading-normal tracking-[0.22em] uppercase",
    meta: "font-mono text-[10.5px] font-medium leading-normal tracking-[0.06em]",
};

export function Text({as: Comp = "p", size = "body", className, ...props}: React.HTMLAttributes<HTMLElement> & {as?: "p" | "span" | "div"; size?: keyof typeof textStyles}) {
    return <Comp className={cn("text-foreground", textStyles[size], className)} {...props} />;
}
