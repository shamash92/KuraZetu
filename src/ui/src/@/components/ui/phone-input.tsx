import React, {useId} from "react";

import {Input} from "./input";
import {Label} from "./label";
import "./phone-input.css";

export function nationalDigits(value: string) {
    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("254") && digits.length > 9) digits = digits.slice(3);
    if (digits.startsWith("0")) digits = digits.slice(1);
    return digits.slice(0, 9);
}

type PhoneInputProps = Omit<React.ComponentProps<"input">, "onChange" | "value" | "type"> & {
    label: string;
    value: string;
    onChange: (value: string) => void;
    format?: "national" | "international";
    hint?: string;
    error?: string;
};

/** A Kenyan national number; the value contains at most nine digits without +254. */
export function PhoneInput({label, value, onChange, hint, error, id, required = true, format = "national", ...props}: PhoneInputProps) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const describedBy = [
        `${inputId}-prefix`,
        hint && `${inputId}-hint`,
        error && `${inputId}-error`,
        props["aria-describedby"],
    ].filter(Boolean).join(" ");
    if (format === "international") {
        return <div className="grid gap-2">
            <Label htmlFor={inputId}>{label}</Label>
            <Input {...props} id={inputId} type="tel" inputMode="tel" autoComplete="tel" required={required} value={value} placeholder="+254712345678" aria-invalid={error ? true : props["aria-invalid"]} aria-describedby={[hint && `${inputId}-hint`, error && `${inputId}-error`, props["aria-describedby"]].filter(Boolean).join(" ")} onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, "");
                onChange(`+254${(digits.startsWith("254") ? digits.slice(3) : nationalDigits(digits)).slice(0, 9)}`);
            }} />
            {hint && <p id={`${inputId}-hint`} className="text-sm text-muted-foreground">{hint}</p>}
            {error && <p id={`${inputId}-error`} className="text-sm text-destructive">{error}</p>}
        </div>;
    }
    return (
        <div className="grid gap-2">
            <Label htmlFor={inputId}>{label}</Label>
            <div className={`kz-phone-field ${error ? "is-invalid" : ""}`}>
                <span id={`${inputId}-prefix`} className="flex items-center rounded-l-[13px] border-r border-border bg-secondary px-4 text-base font-semibold">+254</span>
                <Input {...props} id={inputId} type="tel" inputMode="numeric" autoComplete="tel-national" aria-describedby={describedBy} aria-invalid={error ? true : props["aria-invalid"]} value={value} placeholder={props.placeholder ?? "712 345 678"} pattern="[0-9]{9}" required={required} className={`kz-phone-input focus-visible:outline-none flex-1 border-0 bg-transparent text-base shadow-none ${props.className ?? ""}`} onChange={(event) => onChange(nationalDigits(event.target.value))} />
            </div>
            {hint && <p id={`${inputId}-hint`} className="text-sm text-muted-foreground">{hint}</p>}
            {error && <p id={`${inputId}-error`} className="text-sm text-destructive">{error}</p>}
        </div>
    );
}
