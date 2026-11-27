import React, {useState} from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";
import {expect, userEvent, within} from "storybook/test";
import {Button} from "@/src/@/components/ui/button";
import {Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow} from "@/src/@/components/ui/table";
const rows = [{name: "Station 001", reported: 3, total: 4}, {name: "Station 002", reported: 2, total: 3}, {name: "Station 003", reported: 0, total: 2}];
function Example({state = "ready", selectable = false, sortable = false, long = false}: {state?: "ready" | "loading" | "empty" | "error"; selectable?: boolean; sortable?: boolean; long?: boolean}) {
    const [selected, setSelected] = useState<string | null>(null);
    const [reverse, setReverse] = useState(false);
    const data = long ? Array.from({length: 40}, (_, index) => ({name: `Station ${index + 1}`, reported: index % 4, total: 4})) : reverse ? rows.slice().reverse() : rows;
    return <Table aria-label="Station reporting" containerClassName={long ? "max-h-80 overflow-y-auto" : undefined}><TableCaption>Example station reporting figures.</TableCaption><TableHeader><TableRow>{selectable && <TableHead>Select</TableHead>}<TableHead aria-sort={sortable ? reverse ? "descending" : "ascending" : undefined}>{sortable ? <Button variant="link" size="sm" onClick={() => setReverse((value) => !value)}>Station</Button> : "Station"}</TableHead><TableHead>Reported</TableHead><TableHead>Total</TableHead></TableRow></TableHeader><TableBody>{state === "ready" ? data.map((row) => <TableRow key={row.name} selected={selectable ? selected === row.name : undefined}>{selectable && <TableCell><input type="checkbox" aria-label={`Select ${row.name}`} checked={selected === row.name} onChange={() => setSelected(selected === row.name ? null : row.name)} /></TableCell>}<TableCell>{row.name}</TableCell><TableCell>{row.reported}</TableCell><TableCell>{row.total}</TableCell></TableRow>) : <TableRow><TableCell colSpan={3}><p role={state === "error" ? "alert" : "status"}>{state === "loading" ? "Loading station records…" : state === "error" ? "Station records could not be loaded." : "No station records are available."}</p></TableCell></TableRow>}</TableBody>{state === "ready" && <TableFooter><TableRow><TableCell colSpan={selectable ? 2 : 1}>Total</TableCell><TableCell>{data.reduce((sum, row) => sum + row.reported, 0)}</TableCell><TableCell>{data.reduce((sum, row) => sum + row.total, 0)}</TableCell></TableRow></TableFooter>}</Table>;
}
const meta = {title: "Components/Table", component: Table, subcomponents: {TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption}, render: () => <Example />} satisfies Meta<typeof Table>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Populated: Story = {};
export const Loading: Story = {render: () => <Example state="loading" />};
export const Empty: Story = {render: () => <Example state="empty" />};
export const Error: Story = {render: () => <Example state="error" />};
export const Scrollable: Story = {render: () => <Example long />};
export const Selectable: Story = {render: () => <Example selectable />, async play({canvasElement}) {const canvas = within(canvasElement); await userEvent.click(canvas.getByRole("checkbox", {name: "Select Station 002"})); await expect(canvas.getByRole("checkbox", {name: "Select Station 002"})).toBeChecked();}};
export const Sortable: Story = {render: () => <Example sortable />, async play({canvasElement}) {const canvas = within(canvasElement); await userEvent.click(canvas.getByRole("button", {name: "Station"})); await expect(canvas.getByRole("columnheader", {name: "Station"})).toHaveAttribute("aria-sort", "descending");}};
