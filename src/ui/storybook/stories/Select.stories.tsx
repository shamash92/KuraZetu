import React, {useId} from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";
import {expect, userEvent, waitFor, within} from "storybook/test";

import {Label} from "@/src/@/components/ui/label";
import {Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue} from "@/src/@/components/ui/select";

function StationSelect({disabled = false, defaultValue, size = "default", invalid = false, many = false}: {disabled?: boolean; defaultValue?: string; size?: "sm" | "default"; invalid?: boolean; many?: boolean}) {
    const id = useId();
    return (
        <div className="grid max-w-sm gap-2">
            <Label htmlFor={id}>Polling station</Label>
            <Select disabled={disabled} defaultValue={defaultValue}>
                <SelectTrigger id={id} size={size} aria-invalid={invalid} className="w-full">
                    <SelectValue placeholder="Select a station" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Available stations</SelectLabel>
                        <SelectItem value="one">Example station one</SelectItem>
                        <SelectItem value="two">Example station two</SelectItem>
                        <SelectItem value="unavailable" disabled>Unavailable station</SelectItem>
                        {many && Array.from({length: 24}, (_, index) => <SelectItem key={index} value={`station-${index + 3}`}>Example station {index + 3}</SelectItem>)}
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectItem value="other">Another station</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}

const meta = {
    title: "Components/Select",
    component: SelectTrigger,
    subcomponents: {Select, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton},
    parameters: {docs: {story: {inline: false}, description: {component: "A labelled select with keyboard navigation, grouped options, a disabled item, and a portal menu. The open example demonstrates selecting an option and returning to the trigger."}}},
    args: {disabled: false, size: "default"},
    render: (args) => <StationSelect disabled={args.disabled} size={args.size} />,
} satisfies Meta<typeof SelectTrigger>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {};
export const Selected: Story = {render: () => <StationSelect defaultValue="one" />};
export const Disabled: Story = {render: () => <StationSelect disabled />};
export const Invalid: Story = {render: () => <StationSelect invalid />};
export const Small: Story = {render: () => <StationSelect size="sm" />};
export const Open: Story = {
    // Audit the active portal; closed stories cover the trigger hidden by Radix.
    parameters: {a11y: {context: {include: [["[data-slot=select-content]"]]}}},
    async play({canvasElement}) {
        await userEvent.click(within(canvasElement).getByRole("combobox"));
        const page = within(canvasElement.ownerDocument.body);
        await waitFor(() => expect(page.getByRole("option", {name: "Example station one"})).toHaveFocus());
        await userEvent.keyboard("{ArrowDown}");
        await expect(page.getByRole("option", {name: "Example station two"})).toHaveFocus();
        await userEvent.tab();
        await expect(page.getByRole("listbox").contains(canvasElement.ownerDocument.activeElement)).toBe(true);
    },
};
export const ChooseOption: Story = {
    async play({canvasElement}) {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole("combobox");
        await userEvent.click(trigger);
        await userEvent.click(await within(canvasElement.ownerDocument.body).findByRole("option", {name: "Example station two"}));
        await waitFor(() => expect(trigger).toHaveTextContent("Example station two"));
        await waitFor(() => expect(trigger).toHaveFocus(), {timeout: 3000});
    },
};
export const Scrollable: Story = {
    parameters: {a11y: {context: {include: [["[data-slot=select-content]"]]}}},
    render: () => <StationSelect many />,
    async play({canvasElement}) {
        await userEvent.click(within(canvasElement).getByRole("combobox"));
    },
};
