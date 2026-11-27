import React, {useId} from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";

import {Input} from "@/src/@/components/ui/input";
import {Label} from "@/src/@/components/ui/label";

function LabelledInput(args: React.ComponentProps<typeof Input>) {
    const id = useId();
    const labels: Record<string, string> = {password: "Password", email: "Email address", number: "Reported stations", file: "Station photograph"};
    const hints: Record<string, string> = {password: "Use a strong password.", email: "Use an example.com address for this example.", number: "Enter the number of reporting stations.", file: "Choose a station image from your device."};
    return (
        <div className="grid w-full max-w-sm gap-2">
            <Label htmlFor={id}>{labels[args.type ?? "text"] ?? "Station name"}</Label>
            <Input {...args} id={id} aria-describedby={`${id}-help`} />
            <p id={`${id}-help`} className="text-sm text-muted-foreground">
                {args["aria-invalid"] ? "Enter the station name to continue." : (hints[args.type ?? "text"] ?? "Use the name shown on the station record.")}
            </p>
        </div>
    );
}

const meta = {
    title: "Components/Input",
    component: Input,
    render: (args) => <LabelledInput {...args} />,
    args: {placeholder: "Enter station name"},
    argTypes: {
        disabled: {control: "boolean"},
        "aria-invalid": {control: "boolean"},
    },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Filled: Story = {args: {defaultValue: "Example polling station"}};
export const Disabled: Story = {args: {disabled: true}};
export const Invalid: Story = {args: {"aria-invalid": true}};

export const ReadOnly: Story = {args: {readOnly: true, defaultValue: "Example polling station"}};
export const Password: Story = {args: {type: "password", defaultValue: "example-password", autoComplete: "new-password"}};
export const LongValue: Story = {args: {defaultValue: "A polling station name that exceeds the width of the input"}};
export const Focus: Story = {parameters: {pseudo: {focusVisible: true}}};

export const Email: Story = {args: {type: "email", placeholder: "example@example.com"}};
export const Number: Story = {args: {type: "number", placeholder: "0", min: 0}};
export const File: Story = {args: {type: "file", accept: "image/*", placeholder: undefined}};
