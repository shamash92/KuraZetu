import React from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";
import {Info, TriangleAlert} from "lucide-react";

import {Alert, AlertDescription, AlertTitle} from "@/src/@/components/ui/alert";
import {Button} from "@/src/@/components/ui/button";

const meta = {
    title: "Components/Alert",
    component: Alert,
    subcomponents: {AlertTitle, AlertDescription},
    args: {className: "max-w-xl"},
    argTypes: {variant: {control: "select", options: ["default", "destructive"]}},
    render: (args) => (
        <Alert {...args}>
            <Info aria-hidden="true" />
            <AlertTitle>Check the station details</AlertTitle>
            <AlertDescription>Confirm the station name before continuing.</AlertDescription>
        </Alert>
    ),
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Destructive: Story = {
    args: {variant: "destructive"},
    render: (args) => (
        <Alert {...args}>
            <TriangleAlert aria-hidden="true" />
            <AlertTitle>The record could not be loaded</AlertTitle>
            <AlertDescription>Check your connection and try again.</AlertDescription>
        </Alert>
    ),
};
export const WithoutIcon: Story = {
    render: (args) => <Alert {...args}><AlertTitle>Station details updated</AlertTitle><AlertDescription>Review the changes before continuing.</AlertDescription></Alert>,
};
export const DescriptionOnly: Story = {
    render: (args) => <Alert {...args}><AlertDescription>Station information will appear after you select a station.</AlertDescription></Alert>,
};
export const WithAction: Story = {
    render: (args) => (
        <Alert {...args}>
            <Info aria-hidden="true" />
            <AlertTitle>Review the station record</AlertTitle>
            <AlertDescription>
                <p>Check the station name and location before continuing.</p>
                <Button variant="secondary" size="sm" className="mt-2">View record</Button>
            </AlertDescription>
        </Alert>
    ),
};
export const LongContent: Story = {
    render: (args) => <Alert {...args}><Info aria-hidden="true" /><AlertTitle>A longer heading that may wrap on a narrow screen</AlertTitle><AlertDescription>This message includes additional context about the station record and what to check next. The description should wrap naturally and remain readable on a small screen.</AlertDescription></Alert>,
};
