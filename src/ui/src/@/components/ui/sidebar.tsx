import React, {createContext, useContext, useState} from "react";
import {Slot} from "@radix-ui/react-slot";
import {Circle, PanelLeftClose, PanelLeftOpen} from "lucide-react";
import {cn} from "@/src/@/components/lib/utils";
import {Button} from "./button";
import "./sidebar.css";
type SidebarState = {collapsed: boolean; change: (value: boolean) => void};
const Context = createContext<SidebarState | null>(null);
export function Sidebar({label = "Sidebar navigation", collapsed, defaultCollapsed = false, onCollapsedChange, className, children, ...props}: React.ComponentProps<"nav"> & {label?: string; collapsed?: boolean; defaultCollapsed?: boolean; onCollapsedChange?: (value: boolean) => void}) {
    const [internal, setInternal] = useState(defaultCollapsed);
    const current = collapsed ?? internal;
    function change(value: boolean) {if (collapsed === undefined) setInternal(value); onCollapsedChange?.(value);}
    return <Context.Provider value={{collapsed: current, change}}><nav aria-label={label} className={cn("kz-sidebar", current && "is-collapsed", className)} {...props}>{children}</nav></Context.Provider>;
}
export function SidebarToggle() {
    const context = useContext(Context);
    if (!context) throw new Error("SidebarToggle must be inside Sidebar");
    return <Button variant="ghost" size="icon" className="kz-sidebar-toggle" aria-label={context.collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!context.collapsed} onClick={() => context.change(!context.collapsed)}>{context.collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}</Button>;
}
export function SidebarGroup({label, children, className, ...props}: React.ComponentProps<"div"> & {label?: string}) {return <div className={cn("kz-sidebar-group", className)} {...props}>{label && <p className="kz-sidebar-group-label">{label}</p>}{children}</div>;}
export function SidebarLink({label, icon, active, asChild = false, children, className, ...props}: React.ComponentProps<"a"> & {label: string; icon?: React.ReactNode; active?: boolean; asChild?: boolean}) {
    const context = useContext(Context);
    const Comp = asChild ? Slot : "a";
    const body = <>{icon ?? (context?.collapsed && <Circle aria-hidden="true" size={18} />)}<span className="kz-sidebar-link-label">{label}</span></>;
    const content = asChild && React.isValidElement<{children?: React.ReactNode}>(children) ? React.cloneElement(children, undefined, body) : body;
    return <Comp title={label} aria-label={label} aria-current={active ? "page" : undefined} className={cn("kz-sidebar-link", className)} {...props}>{content}</Comp>;
}
