import React from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";
import {Check} from "lucide-react";

import {Badge} from "@/src/@/components/ui/badge";

const meta = {
    title: "Components/Badge",
    component: Badge,
    args: {children: "Verified"},
    argTypes: {
        variant: {control: "select", options: ["default", "secondary", "destructive", "outline"]},
        asChild: {control: false},
    },
    parameters: {docs: {description: {component: "A compact label for status or category. Pair color with a visible label. Use asChild to preserve link semantics when the badge navigates."}}},
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Secondary: Story = {args: {variant: "secondary", children: "Pending"}};
export const Destructive: Story = {args: {variant: "destructive", children: "Needs review"}};
export const Outline: Story = {args: {variant: "outline"}};
export const WithIcon: Story = {args: {children: <><Check aria-hidden="true" /> Verified</>}};
export const AsLink: Story = {args: {asChild: true, variant: "secondary", children: <a href="#station">View station</a>}};
export const LongLabel: Story = {args: {variant: "outline", children: "Awaiting community verification"}};

export const LinkHover: Story = {args: AsLink.args, parameters: {pseudo: {hover: true}}};
export const LinkFocus: Story = {args: AsLink.args, parameters: {pseudo: {focusVisible: true}}};
