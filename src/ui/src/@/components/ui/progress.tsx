import React from "react";
import {cn} from "@/src/@/components/lib/utils";
import "./progress.css";
export function Progress({label, value = null, max = 100, size = "regular", tone = "verified", showValue = true, className, ...props}: Omit<React.ComponentProps<"div">, "children"> & {label: string; value?: number | null; max?: number; size?: "thin" | "regular" | "large"; tone?: "neutral" | "verified" | "action"; showValue?: boolean}) {
    const limit = max > 0 ? max : 100;
    const current = value === null ? null : Math.max(0, Math.min(limit, Number.isFinite(value) ? value : 0));
    return <div className={cn("kz-progress", className)} {...props}><div className="kz-progress-label"><span>{label}</span>{showValue && <span>{current === null ? "In progress" : `${Math.round(current / limit * 100)}%`}</span>}</div><div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={limit} aria-valuenow={current ?? undefined} aria-valuetext={current === null ? "In progress" : undefined} className={`kz-progress-track kz-progress-${size} kz-progress-${tone}`}><div className="kz-progress-fill" style={{width: current === null ? "25%" : `${current / limit * 100}%`}} /></div></div>;
}
