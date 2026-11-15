import {useId} from "react";

export function nationalDigits(value: string) {
    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("254") && digits.length > 9) digits = digits.slice(3);
    if (digits.startsWith("0")) digits = digits.slice(1);
    return digits.slice(0, 9);
}

export function PhoneInput({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    const id = useId();
    return (
        <div>
            <label htmlFor={id}>{label}</label>
            <div className="da-phone-field">
                <span id={`${id}-prefix`}>+254</span>
                <input
                    id={id}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    aria-describedby={`${id}-prefix`}
                    value={value}
                    placeholder="712 345 678"
                    pattern="[0-9]{9}"
                    required
                    onChange={(event) => onChange(nationalDigits(event.target.value))}
                />
            </div>
        </div>
    );
}
