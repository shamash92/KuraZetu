import React from "react";

import {cn} from "@/src/@/components/lib/utils";
import "./marker.css";

/** Green by default; lime on the landing hero, red for the "what it is not" heading. */
export function Marker({tone = "green", className, ...props}: React.ComponentProps<"span"> & {tone?: "green" | "lime" | "red"}) {
    return <span className={cn("kz-marker", `kz-marker-${tone}`, className)} {...props} />;
}
