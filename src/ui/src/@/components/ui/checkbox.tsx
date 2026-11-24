import React from "react";

import {cn} from "@/src/@/components/lib/utils";
import "./checkbox.css";

/** A labelled native checkbox; the whole row toggles it. */
export const Checkbox = React.forwardRef<HTMLInputElement, Omit<React.ComponentProps<"input">, "type"> & {label: React.ReactNode; hint?: React.ReactNode}>(function Checkbox({label, hint, className, disabled, ...props}, ref) {
    return (
        <label className={cn("kz-checkbox", disabled && "is-disabled", className)}>
            <input {...props} ref={ref} type="checkbox" disabled={disabled} />
            <span>{label}{hint && <span className="kz-checkbox-hint">{hint}</span>}</span>
        </label>
    );
});
