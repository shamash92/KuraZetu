import React, {useId} from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";

import {Input} from "@/src/@/components/ui/input";
import {Label} from "@/src/@/components/ui/label";

function LabelExample({disabled = false, required = false, children}: React.PropsWithChildren<{disabled?: boolean; required?: boolean}>) {
    const id = useId();
    return (
        <div className="grid max-w-sm gap-2">
            <Input id={id} className="peer order-2" disabled={disabled} required={required} />
            <Label htmlFor={id} className="order-1">{children}{required && <span aria-hidden="true"> *</span>}</Label>
        </div>
    );
}

const meta = {
    title: "Components/Label",
    component: Label,
    args: {children: "Station name"},
    render: (args) => <LabelExample>{args.children}</LabelExample>,
    parameters: {docs: {description: {component: "Associate every field with its visible label using htmlFor and a matching input id. The disabled example uses the component's existing peer styling."}}},
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Required: Story = {render: (args) => <LabelExample required>{args.children}</LabelExample>};
export const Disabled: Story = {render: (args) => <LabelExample disabled>{args.children}</LabelExample>};
export const LongLabel: Story = {args: {children: "Full name of the polling station as shown on the station record"}};
