import React, {useId} from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";

import {Label} from "@/src/@/components/ui/label";
import {Textarea} from "@/src/@/components/ui/textarea";

function LabelledTextarea(args: React.ComponentProps<typeof Textarea>) {
    const id = useId();
    return (
        <div className="grid w-full max-w-md gap-2">
            <Label htmlFor={id}>Notes</Label>
            <Textarea {...args} id={id} aria-describedby={`${id}-help`} />
            <p id={`${id}-help`} className="text-sm text-muted-foreground">{args["aria-invalid"] ? "Add a note before saving." : "Describe what you saw at the station."}</p>
        </div>
    );
}

const meta = {
    title: "Components/Textarea",
    component: Textarea,
    render: (args) => <LabelledTextarea {...args} />,
    args: {placeholder: "The form was posted on the classroom door."},
    argTypes: {disabled: {control: "boolean"}, "aria-invalid": {control: "boolean"}},
    parameters: {docs: {description: {component: "The multi-line counterpart of Input, with the same border, fill, radius, and focus ring."}}},
} satisfies Meta<typeof Textarea>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Filled: Story = {args: {defaultValue: "Form 34A was posted on the classroom door at 6:40 pm. Two agents signed it."}};
export const Disabled: Story = {args: {disabled: true, defaultValue: "Locked after submission."}};
export const Invalid: Story = {args: {"aria-invalid": true}};
export const Focus: Story = {parameters: {pseudo: {focusVisible: true}}};
