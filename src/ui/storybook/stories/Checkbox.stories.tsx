import React from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";
import {expect, userEvent, within} from "storybook/test";

import {Checkbox} from "@/src/@/components/ui/checkbox";

const meta = {
    title: "Components/Checkbox",
    component: Checkbox,
    args: {label: "Make this dashboard active"},
    argTypes: {disabled: {control: "boolean"}, defaultChecked: {control: "boolean"}},
    parameters: {docs: {description: {component: "A labelled native checkbox with an ink accent, matching the sign-up terms and dashboard settings. The whole row toggles it."}}},
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};
export const Checked: Story = {args: {defaultChecked: true}};
export const WithHint: Story = {args: {hint: "Viewers can open results only while the dashboard is active."}};
export const Disabled: Story = {args: {disabled: true, defaultChecked: true}};
export const Invalid: Story = {args: {"aria-invalid": true, label: "I agree to the terms of use"}};
export const LongLabel: Story = {args: {label: "I confirm that the figures I upload come from the Form 34A posted at my polling station"}, render: (args) => <div className="max-w-xs"><Checkbox {...args} /></div>};
export const Toggle: Story = {
    async play({canvasElement}) {
        const box = within(canvasElement).getByRole("checkbox", {name: "Make this dashboard active"});
        await userEvent.click(box);
        await expect(box).toBeChecked();
    },
};
export const Focus: Story = {parameters: {pseudo: {focusVisible: true}}};
