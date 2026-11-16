import React, {useState} from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";
import {expect, userEvent, within} from "storybook/test";
import {ListView, ListViewItem} from "@/src/@/components/ui/list-view";
function Example({many = false, disabled = false}: {many?: boolean; disabled?: boolean}) {const [selected, setSelected] = useState(0);return <ListView label="Polling stations" className="max-w-lg" maxHeight={280}>{Array.from({length: many ? 30 : 4}, (_, index) => <ListViewItem key={index} selected={selected === index} disabled={disabled && index === 1} onSelect={() => setSelected(index)}><span>Station {String(index + 1).padStart(3, "0")}</span><span className="text-sm text-muted-foreground">View record</span></ListViewItem>)}</ListView>;}
const meta = {title: "Components/ListView", component: ListView, subcomponents: {ListViewItem}, args: {label: "Polling stations"}, render: () => <Example />} satisfies Meta<typeof ListView>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Populated: Story = {};
export const Scrollable: Story = {render: () => <Example many />};
export const DisabledItem: Story = {render: () => <Example disabled />};
export const Loading: Story = {render: (args) => <ListView {...args} status="loading" />};
export const Empty: Story = {render: (args) => <ListView {...args} />};
export const Error: Story = {render: (args) => <ListView {...args} status="error" />};
export const SelectItem: Story = {async play({canvasElement}) {const canvas = within(canvasElement); await userEvent.click(canvas.getByRole("button", {name: /Station 003/})); await expect(canvas.getByRole("button", {name: /Station 003/})).toHaveAttribute("aria-pressed", "true");}};
