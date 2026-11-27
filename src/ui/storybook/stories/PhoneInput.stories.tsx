import React, {useState} from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";
import {expect, fn, userEvent, within} from "storybook/test";

import {PhoneInput} from "@/src/@/components/ui/phone-input";

function PhoneExample(args: React.ComponentProps<typeof PhoneInput>) {
    const [value, setValue] = useState(args.value);
    return <div className="max-w-sm"><PhoneInput {...args} value={value} onChange={(value) => {setValue(value); args.onChange(value);}} /></div>;
}
const meta = {
    title: "Components/PhoneInput",
    component: PhoneInput,
    args: {label: "Phone number", value: "", onChange: fn(), hint: "Enter the nine digits after +254."},
    render: (args) => <PhoneExample key={args.value} {...args} />,
    argTypes: {onChange: {control: false}, disabled: {control: "boolean"}, readOnly: {control: "boolean"}, required: {control: "boolean"}},
    parameters: {docs: {description: {component: "A Kenyan phone field with a fixed +254 prefix. Values use nine national digits; typing or pasting a local or international number normalizes it through the same input workflow."}}},
} satisfies Meta<typeof PhoneInput>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Filled: Story = {args: {value: "712345678"}};
export const Disabled: Story = {args: {disabled: true, value: "712345678"}};
export const ReadOnly: Story = {args: {readOnly: true, value: "712345678"}};
export const Invalid: Story = {args: {error: "Enter a complete nine-digit phone number.", value: "7123"}};
export const Optional: Story = {args: {required: false}};
export const Focus: Story = {parameters: {pseudo: {focusVisible: true}}};
export const LocalNumber: Story = {async play({canvasElement}) {
    const input = within(canvasElement).getByRole("textbox", {name: "Phone number"});
    await userEvent.type(input, "0712345678");
    await expect(input).toHaveValue("712345678");
}};
export const InternationalPaste: Story = {async play({canvasElement}) {
    const input = within(canvasElement).getByRole("textbox", {name: "Phone number"});
    await userEvent.click(input);
    await userEvent.paste("+254 712 345 678");
    await expect(input).toHaveValue("712345678");
}};

export const Login: Story = {args: {format: "international", value: "+254", hint: "Enter the phone number on your account."}};
export const LoginFilled: Story = {args: {format: "international", value: "+254712345678", hint: "Enter the phone number on your account."}};
export const LoginError: Story = {args: {format: "international", value: "+2547123", error: "Enter a complete phone number."}};
