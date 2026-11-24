import React from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";

import {Marker} from "@/src/@/components/ui/marker";
import {Heading} from "@/src/@/components/ui/typography";

const meta = {
    title: "Components/Marker",
    component: Marker,
    args: {children: "honest", tone: "green"},
    argTypes: {tone: {control: "inline-radio", options: ["green", "lime", "red"]}},
    render: (args) => <Heading as="h1" size="display">Help keep the count <Marker {...args} />.</Heading>,
    parameters: {docs: {description: {component: "The hand-drawn stroke under the operative words of a display headline. Green is the default; the landing hero uses lime and the \"what it is not\" heading uses red."}}},
} satisfies Meta<typeof Marker>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Green: Story = {};
export const Lime: Story = {args: {tone: "lime", children: "you"}, render: (args) => <Heading as="h1" size="display">Election results, uploaded by <Marker {...args} />.</Heading>};
export const Red: Story = {args: {tone: "red", children: "not"}, render: (args) => <Heading as="h2" size="headline">And just as importantly, what it is <Marker {...args} />.</Heading>};
