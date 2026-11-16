import React, {createContext, useContext, useId, useState} from "react";
import {ChevronDown} from "lucide-react";
import {cn} from "@/src/@/components/lib/utils";
import "./accordion.css";
const Group = createContext<string | undefined>(undefined);
export function Accordion({multiple = false, className, children, ...props}: React.ComponentProps<"div"> & {multiple?: boolean}) {
    const id = useId();
    return <Group.Provider value={multiple ? undefined : id}><div className={cn("kz-accordion", className)} {...props}>{children}</div></Group.Provider>;
}
export function AccordionItem({title, defaultOpen = false, disabled = false, className, children, onToggle, ...props}: Omit<React.ComponentProps<"details">, "title" | "name"> & {title: React.ReactNode; defaultOpen?: boolean; disabled?: boolean}) {
    const name = useContext(Group);
    const [open, setOpen] = useState(defaultOpen);
    return <details {...props} name={name} open={props.open ?? open} className={cn("kz-accordion-item", disabled && "is-disabled", className)} onToggle={(event) => {setOpen(event.currentTarget.open); onToggle?.(event);}}><summary aria-disabled={disabled || undefined} tabIndex={disabled ? -1 : 0} onClick={(event) => {if (disabled) event.preventDefault();}}>{title}<ChevronDown aria-hidden="true" className="kz-accordion-icon" size={18} /></summary><div className="kz-accordion-content">{children}</div></details>;
}
