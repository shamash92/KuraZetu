import React from "react";
import {cn} from "@/src/@/components/lib/utils";
import {Image} from "./image";
type ComparisonImage = React.ComponentProps<typeof Image> & {label: string};
export function ImageComparison({left, right, stackOnSmallScreens = false, className, ...props}: React.ComponentProps<"section"> & {left: ComparisonImage; right: ComparisonImage; stackOnSmallScreens?: boolean}) {
    const {label: leftLabel, ...leftImage} = left;
    const {label: rightLabel, ...rightImage} = right;
    return <section aria-label="Image comparison" className={cn("grid gap-4", stackOnSmallScreens ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2", className)} {...props}><div className="min-w-0"><p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{leftLabel}</p><Image {...leftImage} /></div><div className="min-w-0"><p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{rightLabel}</p><Image {...rightImage} /></div></section>;
}
