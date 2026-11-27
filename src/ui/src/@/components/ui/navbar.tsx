import React, {useId, useRef, useState} from "react";
import {ChevronDown, Menu, X} from "lucide-react";

import {Lockup} from "./brand";
import {cn} from "@/src/@/components/lib/utils";
import {Button} from "./button";
import "./navbar.css";

type NavbarLink = {label: string; href: string; current?: boolean; external?: boolean};
export type NavbarItem = NavbarLink | {label: string; items: ReadonlyArray<NavbarLink>; current?: boolean};

export function NavbarLinks({items}: {items: ReadonlyArray<NavbarItem>}) {
    return <>{items.map((item) => "items" in item ? (
        <details className="kz-ui-navbar-group kz-nav-group" key={item.label} onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
        }} onKeyDown={(event) => {
            if (event.key === "Escape") {
                event.stopPropagation();
                event.currentTarget.open = false;
                event.currentTarget.querySelector("summary")?.focus();
            }
        }}>
            <summary data-current={item.current || undefined}>{item.label}<ChevronDown aria-hidden="true" size={14} /></summary>
            <div className="kz-ui-navbar-dropdown kz-nav-menu"><NavbarLinks items={item.items} /></div>
        </details>
    ) : (
        <a key={item.label} href={item.href} aria-current={item.current ? "page" : undefined} target={item.external ? "_blank" : undefined} rel={item.external ? "noreferrer" : undefined}>{item.label}</a>
    ))}</>;
}

export function Navbar({items, actions, brand, defaultMenuOpen = false, className, ...props}: React.ComponentProps<"div"> & {items: ReadonlyArray<NavbarItem>; actions?: React.ReactNode; brand?: React.ReactNode; defaultMenuOpen?: boolean}) {
    const [open, setOpen] = useState(defaultMenuOpen);
    const menuId = useId();
    const triggerRef = useRef<HTMLButtonElement>(null);
    return (
        <div className={cn("kz-ui-navbar", className)} {...props}>
            <div className="kz-ui-navbar-notice"><span>Citizen tally · Not an IEBC system</span><span className="kz-ui-navbar-notice-source">Open source · MIT · github.com/shamash92/kurazetu</span></div>
            <header className="kz-ui-navbar-header" onKeyDown={(event) => {
                if (event.key === "Escape" && open) {setOpen(false); triggerRef.current?.focus();}
            }}>
                {brand ?? <a href="/ui/" title="KuraZetu home" className="kz-ui-navbar-brand"><Lockup width={125} /><span className="kz-ui-navbar-brand-tag">Powered by Kiongozi</span></a>}
                <nav className="kz-ui-navbar-links" aria-label="Main navigation"><NavbarLinks items={items} /></nav>
                <div className="kz-ui-navbar-actions">{actions}</div>
                <div className="kz-ui-navbar-toggle"><Button ref={triggerRef} className="size-11" variant="ghost" size="icon" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls={menuId} onClick={() => setOpen((value) => !value)}>{open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</Button></div>
                {open && <nav id={menuId} className="kz-ui-navbar-mobile" aria-label="Mobile navigation"><NavbarLinks items={items} /><div className="kz-ui-navbar-mobile-actions">{actions}</div></nav>}
            </header>
        </div>
    );
}
