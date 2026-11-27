import React from "react";
import {Cell, Pie, PieChart, ResponsiveContainer, Tooltip} from "recharts";
import {cn} from "@/src/@/components/lib/utils";
import "./results-chart.css";
export type ChartDatum = {name: string; value: number; color?: string};
export function ResultsChart({label, data, kind = "bar", valueLabel = "votes", status = "ready", className, ...props}: React.ComponentProps<"figure"> & {label: string; data: ReadonlyArray<ChartDatum>; kind?: "bar" | "donut"; valueLabel?: string; status?: "ready" | "loading" | "error"}) {
    const valid = data.every((entry) => Number.isFinite(entry.value) && entry.value >= 0);
    const total = data.reduce((sum, entry) => sum + entry.value, 0);
    const maximum = Math.max(1, ...data.map((entry) => entry.value));
    return <figure className={cn("kz-results-chart", className)} aria-busy={status === "loading"} {...props}><figcaption>{label}</figcaption>{status === "loading" ? <p role="status" className="kz-results-chart-state">Loading results…</p> : status === "error" || !valid ? <p role="alert" className="kz-results-chart-state">The chart could not be displayed.</p> : total === 0 ? <p role="status" className="kz-results-chart-state">No results are available yet.</p> : <>
        {kind === "donut" && <div aria-hidden="true"><ResponsiveContainer width="100%" height={300}><PieChart accessibilityLayer={false}><Pie rootTabIndex={-1} data={data.slice()} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} isAnimationActive={false}>{data.map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={entry.color ?? "var(--mute-2)"} />)}</Pie><Tooltip formatter={(value) => `${Number(value).toLocaleString()} ${valueLabel}`} contentStyle={{background: "var(--card)", border: "1px solid var(--rule-16)", borderRadius: 12}} /></PieChart></ResponsiveContainer></div>}
        <ul className={kind === "bar" ? "kz-result-bars" : "kz-result-legend"}>{data.map((entry, index) => <li key={`${entry.name}-${index}`}><span className="kz-result-name">{kind === "donut" && <i aria-hidden="true" style={{background: entry.color ?? "var(--mute-2)"}} />}{entry.name}</span>{kind === "bar" && <span className="kz-result-track" aria-hidden="true"><i style={{width: `${entry.value / maximum * 100}%`, background: entry.color ?? "var(--mute-2)"}} /></span>}<span className="kz-result-value">{entry.value.toLocaleString()} <small>{valueLabel}</small></span></li>)}</ul>
    </>}</figure>;
}
