import React from "react";
import {Slot} from "@radix-ui/react-slot";

import {cn} from "@/src/@/components/lib/utils";
import "./link.css";

export const Link = React.forwardRef<HTMLAnchorElement, React.ComponentProps<"a"> & {asChild?: boolean}>(function Link({asChild = false, className, target, rel, ...props}, ref) {
    const Comp = asChild ? Slot : "a";
    const relation = target === "_blank" ? Array.from(new Set(["noopener", "noreferrer", ...(rel?.split(/\s+/) ?? [])])).join(" ") : rel;
    return <Comp ref={ref} target={target} rel={relation} className={cn("kz-link", className)} {...props} />;
});
