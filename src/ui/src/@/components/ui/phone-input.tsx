import React, {useId} from "react";

import {cn} from "@/src/@/components/lib/utils";
import {Input} from "./input";
import {Label} from "./label";
import "./phone-input.css";

/**
 * Kenyan numbers get written as 0712 345 678, and browser autofill hands back
 * the full +254712345678. Both carry the same nine significant digits, so keep
 * only those rather than sending the server a number it cannot parse.
 */
export function nationalDigits(value: string) {
    const digits = value.replace(/\D/g, "");
    return (digits.startsWith("254") ? digits.slice(3) : digits)
        .replace(/^0+/, "")
        .slice(0, 9);
}

type PhoneInputProps = Omit<React.ComponentProps<"input">, "onChange" | "value" | "type"> & {
    /** Pass false when the screen renders its own label for this input's id. */
    label: string | false;
    value: string;
    onChange: (value: string) => void;
    format?: "national" | "international";
    hint?: string;
    error?: string;
};

/** A Kenyan national number; the value contains at most nine digits without +254. */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput({label, value, onChange, hint, error, id, required = true, format = "national", className, ...props}, ref) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const describedBy = [
        format === "national" && `${inputId}-prefix`,
        hint && `${inputId}-hint`,
        error && `${inputId}-error`,
        props["aria-describedby"],
    ].filter(Boolean).join(" ") || undefined;
    const invalid = error ? true : props["aria-invalid"];
    return (
        <div className="grid gap-2">
            {label && <Label htmlFor={inputId}>{label}</Label>}
            {format === "international" ? (
                <Input {...props} ref={ref} id={inputId} type="tel" inputMode="tel" autoComplete="tel" required={required} value={value} placeholder="+254712345678" aria-invalid={invalid} aria-describedby={describedBy} className={className} onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, "");
                    onChange(`+254${(digits.startsWith("254") ? digits.slice(3) : nationalDigits(digits)).slice(0, 9)}`);
                }} />
            ) : (
                <div className={cn("kz-phone-field", error && "is-invalid", props.disabled && "is-disabled")}>
                    <span id={`${inputId}-prefix`} className="kz-phone-prefix"><span className="kz-phone-flag" aria-hidden="true" />+254</span>
                    <input pattern="[0-9]{9}" placeholder="712 345 678" {...props} ref={ref} id={inputId} type="tel" inputMode="numeric" autoComplete="tel-national" aria-describedby={describedBy} aria-invalid={invalid} value={value} required={required} className={cn("kz-phone-input", className)} onChange={(event) => onChange(nationalDigits(event.target.value))} />
                </div>
            )}
            {hint && <p id={`${inputId}-hint`} className="text-sm text-muted-foreground">{hint}</p>}
            {error && <p id={`${inputId}-error`} className="text-sm text-destructive">{error}</p>}
        </div>
    );
});
