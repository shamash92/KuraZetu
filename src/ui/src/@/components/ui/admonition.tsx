import React from "react";
import {CircleAlert, CircleCheck, Info, Lightbulb, TriangleAlert} from "lucide-react";
import {cn} from "@/src/@/components/lib/utils";
import "./admonition.css";
const icons = {note: Info, info: Info, tip: Lightbulb, warning: TriangleAlert, error: CircleAlert, success: CircleCheck};
export function Admonition({kind = "note", title, children, className, ...props}: Omit<React.ComponentProps<"div">, "title"> & {kind?: keyof typeof icons; title?: React.ReactNode}) {
    const Icon = icons[kind];
    return <div role={kind === "error" ? "alert" : "note"} className={cn("kz-admonition", `kz-admonition-${kind}`, className)} {...props}><Icon aria-hidden="true" size={20} /><div><strong className="kz-admonition-title">{title ?? kind}</strong><div className="kz-admonition-content">{children}</div></div></div>;
}
