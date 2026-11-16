import React, {useState} from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";
import {expect, fn, userEvent, within} from "storybook/test";
import {OTPInput} from "@/src/@/components/ui/otp-input";
function Example(args: React.ComponentProps<typeof OTPInput>) {
    const [value, setValue] = useState(args.value);
    return <OTPInput {...args} value={value} onChange={(value) => {setValue(value); args.onChange(value);}} />;
}
const meta = {title: "Components/OTPInput", component: OTPInput, args: {value: "", onChange: fn(), onComplete: fn(), hint: "Enter the code from your SMS."}, render: (args) => <Example key={args.value} {...args} />} satisfies Meta<typeof OTPInput>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Partial: Story = {args: {value: "4827"}};
export const Complete: Story = {args: {value: "482719"}};
export const Error: Story = {args: {value: "482719", error: "That code could not be verified. Try again."}};
export const Expired: Story = {args: {hint: "This code has expired. Request another one.", disabled: true}};
export const Disabled: Story = {args: {disabled: true}};
export const Verifying: Story = {args: {value: "482719", isVerifying: true}};
export const Focus: Story = {parameters: {pseudo: {focusVisible: true}}};
export const TypeCode: Story = {async play({canvasElement, args}) {const input = within(canvasElement).getByRole("textbox", {name: "Six-digit code"}); await userEvent.type(input, "482719"); await expect(input).toHaveValue("482719"); await expect(args.onComplete).toHaveBeenCalledWith("482719");}};
export const PasteCode: Story = {async play({canvasElement}) {const input = within(canvasElement).getByRole("textbox", {name: "Six-digit code"}); await userEvent.click(input); await userEvent.paste("482 719"); await expect(input).toHaveValue("482719");}};
