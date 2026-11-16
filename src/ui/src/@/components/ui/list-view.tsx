import React from "react";
import {cn} from "@/src/@/components/lib/utils";
import "./list-view.css";
export function ListView({label, status = "ready", maxHeight = 320, children, className, ...props}: Omit<React.ComponentProps<"ul">, "title"> & {label: string; status?: "ready" | "loading" | "empty" | "error"; maxHeight?: number | string}) {
    const empty = React.Children.count(children) === 0;
    return <div className="kz-list-view-scroll" role="region" aria-label={label} tabIndex={0} style={{maxHeight}}><ul className={cn("kz-list-view", className)} {...props}>{status === "ready" && !empty ? children : <li className="kz-list-view-state"><p role={status === "error" ? "alert" : "status"}>{status === "loading" ? "Loading items…" : status === "error" ? "The items could not be loaded." : "No items to display."}</p></li>}</ul></div>;
}
export function ListViewItem({onSelect, selected, disabled, children, className, ...props}: Omit<React.ComponentProps<"li">, "onSelect"> & {onSelect?: () => void; selected?: boolean; disabled?: boolean}) {
    return <li data-selected={selected || undefined} className={cn("kz-list-view-item", className)} {...props}>{onSelect ? <button type="button" onClick={onSelect} disabled={disabled} aria-pressed={selected}>{children}</button> : <div>{children}</div>}</li>;
}
