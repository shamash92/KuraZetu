import React, {useId} from "react";
import {cn} from "@/src/@/components/lib/utils";
import {Label} from "./label";
import "./otp-input.css";

type OTPInputProps = Omit<React.ComponentPropsWithoutRef<"input">, "value" | "onChange" | "maxLength" | "type"> & {
    value: string;
    onChange: (value: string) => void;
    length?: number;
    label?: string | false;
    hint?: React.ReactNode;
    error?: string;
    isVerifying?: boolean;
    onComplete?: (value: string) => void;
};

/** One real input preserves native editing, paste, and SMS autofill behind the existing visual cells. */
export const OTPInput = React.forwardRef<HTMLInputElement, OTPInputProps>(function OTPInput({value, onChange, length = 6, label = "Six-digit code", hint, error, isVerifying, onComplete, id, className, ...props}, ref) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    function update(raw: string) {
        const next = raw.replace(/\D/g, "").slice(0, length);
        onChange(next);
        if (next.length === length && next !== value) onComplete?.(next);
    }
    return <div className={cn("kz-otp", className)} aria-busy={isVerifying}>
        {label && <Label htmlFor={inputId}>{label}</Label>}
        <div className="kz-otp-control" data-disabled={props.disabled || undefined}>
            <input {...props} ref={ref} id={inputId} className="kz-otp-input" type="text" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]*" maxLength={length} value={value} readOnly={isVerifying || props.readOnly} aria-invalid={error ? true : props["aria-invalid"]} aria-describedby={[hint && `${inputId}-hint`, error && `${inputId}-error`, props["aria-describedby"]].filter(Boolean).join(" ")} onChange={(event) => update(event.target.value)} onPaste={(event) => {event.preventDefault(); update(event.clipboardData.getData("text"));}} />
            <div className="kz-otp-cells" aria-hidden="true" style={{gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))`}}>{Array.from({length}, (_, index) => <span key={index} className={cn("kz-otp-cell", value[index] && "is-filled", index === value.length && "is-cursor", error && "is-invalid")}>{value[index] ?? ""}</span>)}</div>
        </div>
        {hint && <p id={`${inputId}-hint`} className="text-sm text-muted-foreground">{hint}</p>}
        {error && <p id={`${inputId}-error`} className="text-sm text-destructive">{error}</p>}
        {isVerifying && <p role="status" className="text-sm text-muted-foreground">Verifying code…</p>}
    </div>;
});
