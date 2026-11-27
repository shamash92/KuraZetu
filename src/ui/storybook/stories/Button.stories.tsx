import React from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";
import {expect, fn, userEvent, within} from "storybook/test";
import {ArrowRight, LoaderCircle} from "lucide-react";

import {Button} from "@/src/@/components/ui/button";

const meta = {
    title: "Components/Button",
    component: Button,
    parameters: {
        docs: {
            description: {
                component: "The shared application button. Use variants for recurring differences and className for local layout adjustments. Edit the source component to update every importing screen.",
            },
        },
    },
    args: {children: "Save changes", onClick: fn()},
    argTypes: {
        variant: {
            control: "select",
            options: ["default", "secondary", "outline", "destructive", "ghost", "link"],
        },
        size: {control: "select", options: ["default", "sm", "lg", "icon"]},
        disabled: {control: "boolean"},
        asChild: {control: false},
    },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
    async play({canvasElement, args}) {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", {name: "Save changes"}));
        await expect(args.onClick).toHaveBeenCalledOnce();
    },
};

export const Secondary: Story = {args: {variant: "secondary", children: "Cancel"}};
export const Outline: Story = {args: {variant: "outline"}};
export const Destructive: Story = {args: {variant: "destructive", children: "Delete draft"}};
export const Ghost: Story = {args: {variant: "ghost"}};
export const Text: Story = {args: {variant: "link", children: "View details"}};
export const Small: Story = {args: {size: "sm"}};
export const Large: Story = {args: {size: "lg"}};
export const Disabled: Story = {args: {disabled: true}};
export const WithIcon: Story = {
    args: {children: <>Continue <ArrowRight aria-hidden="true" /></>},
};
export const LocalLayout: Story = {
    args: {className: "mt-4 w-full sm:w-auto"},
};
export const AsLink: Story = {
    args: {
        asChild: true,
        variant: "secondary",
        children: <a href="#details">View details</a>,
    },
};

export const IconOnly: Story = {
    args: {size: "icon", "aria-label": "Continue", children: <ArrowRight aria-hidden="true" />},
};
export const Loading: Story = {
    args: {
        disabled: true,
        "aria-busy": true,
        children: <><LoaderCircle aria-hidden="true" className="motion-safe:animate-spin" /> Saving changes</>,
    },
};
export const Invalid: Story = {args: {"aria-invalid": true}};
export const Hover: Story = {parameters: {pseudo: {hover: true}}};
export const Focus: Story = {parameters: {pseudo: {focusVisible: true}}};
export const Pressed: Story = {parameters: {pseudo: {active: true}}};
