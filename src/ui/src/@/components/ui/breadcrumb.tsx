import React from "react";
import {Slot} from "@radix-ui/react-slot";
import {ChevronRight, MoreHorizontal} from "lucide-react";

import {cn} from "@/src/@/components/lib/utils";
import "./link.css";

function Breadcrumb({className, ...props}: React.ComponentProps<"nav">) {
    return <nav aria-label="Breadcrumb" className={cn("text-sm", className)} {...props} />;
}
function BreadcrumbList({className, ...props}: React.ComponentProps<"ol">) {
    return <ol className={cn("flex flex-wrap items-center gap-2 break-words text-muted-foreground", className)} {...props} />;
}
function BreadcrumbItem({className, ...props}: React.ComponentProps<"li">) {
    return <li className={cn("inline-flex min-w-0 items-center gap-2", className)} {...props} />;
}
function BreadcrumbLink({asChild = false, className, ...props}: React.ComponentProps<"a"> & {asChild?: boolean}) {
    const Comp = asChild ? Slot : "a";
    return <Comp className={cn("kz-link kz-breadcrumb-link", className)} {...props} />;
}
function BreadcrumbPage({className, ...props}: React.ComponentProps<"span">) {
    return <span aria-current="page" className={cn("font-medium text-foreground", className)} {...props} />;
}
function BreadcrumbSeparator({children, className, ...props}: React.ComponentProps<"li">) {
    return <li role="presentation" aria-hidden="true" className={cn("[&>svg]:size-3.5", className)} {...props}>{children ?? <ChevronRight />}</li>;
}
function BreadcrumbEllipsis({className, ...props}: React.ComponentProps<"span">) {
    return <span aria-hidden="true" className={cn("flex size-8 items-center justify-center [&>svg]:size-4", className)} {...props}><MoreHorizontal /></span>;
}

export {Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis};
