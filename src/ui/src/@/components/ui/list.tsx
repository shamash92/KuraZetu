import React from "react";
import {cn} from "@/src/@/components/lib/utils";
export function List({ordered = false, start, className, ...props}: React.HTMLAttributes<HTMLOListElement | HTMLUListElement> & {ordered?: boolean; start?: number}) {
    const Comp = ordered ? "ol" : "ul";
    return <Comp start={ordered ? start : undefined} className={cn("space-y-2 pl-6 font-sans text-sm leading-relaxed text-foreground marker:text-muted-foreground", ordered ? "list-decimal" : "list-disc", className)} {...props} />;
}
export function ListItem({className, ...props}: React.ComponentProps<"li">) {return <li className={cn("pl-1", className)} {...props} />;}
export function DescriptionList({className, ...props}: React.ComponentProps<"dl">) {return <dl className={cn("grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm", className)} {...props} />;}
export function DescriptionTerm({className, ...props}: React.ComponentProps<"dt">) {return <dt className={cn("font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground", className)} {...props} />;}
export function DescriptionDetails({className, ...props}: React.ComponentProps<"dd">) {return <dd className={cn("text-foreground", className)} {...props} />;}
