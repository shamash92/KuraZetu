import React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import {cn} from "@/src/@/components/lib/utils";

function Tabs({className, ...props}: React.ComponentProps<typeof TabsPrimitive.Root>) {
    return <TabsPrimitive.Root className={cn("flex min-w-0 flex-col gap-4 data-[orientation=vertical]:flex-row", className)} {...props} />;
}
function TabsList({className, ...props}: React.ComponentProps<typeof TabsPrimitive.List>) {
    return <TabsPrimitive.List className={cn("inline-flex w-fit max-w-full flex-wrap items-center gap-1 rounded-2xl border border-border bg-background p-1 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch", className)} {...props} />;
}
function TabsTrigger({className, ...props}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
    return <TabsPrimitive.Trigger className={cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary active:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-foreground data-[state=active]:text-background", className)} {...props} />;
}
function TabsContent({className, ...props}: React.ComponentProps<typeof TabsPrimitive.Content>) {
    return <TabsPrimitive.Content className={cn("min-w-0 flex-1 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", className)} {...props} />;
}

export {Tabs, TabsList, TabsTrigger, TabsContent};
