import React from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";

import {Button} from "@/src/@/components/ui/button";
import {Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/src/@/components/ui/card";

const meta = {
    title: "Components/Card",
    component: Card,
    subcomponents: {CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter},
    parameters: {
        docs: {
            description: {
                component: "Compose a shared surface with optional header, content, and footer. Keep page-specific data and actions in the consuming screen.",
            },
        },
    },
    args: {className: "w-full max-w-md"},
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithContent: Story = {
    render: (args) => (
        <Card {...args}>
            <CardHeader>
                <CardTitle>Polling station</CardTitle>
                <CardDescription>Check the station details before continuing.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Station information appears here.</p>
            </CardContent>
            <CardFooter>
                <Button variant="secondary">View station</Button>
            </CardFooter>
        </Card>
    ),
};

export const Simple: Story = {
    render: (args) => (
        <Card {...args}>
            <CardContent>A surface for related information.</CardContent>
        </Card>
    ),
};

export const WithAction: Story = {
    render: (args) => (
        <Card {...args}>
            <CardHeader>
                <CardTitle>Station details</CardTitle>
                <CardDescription>Review the current station record.</CardDescription>
                <CardAction><Button variant="ghost" size="sm">Edit</Button></CardAction>
            </CardHeader>
            <CardContent>Additional station information appears here.</CardContent>
        </Card>
    ),
};
export const LongContent: Story = {
    render: (args) => (
        <Card {...args}>
            <CardHeader>
                <CardTitle>A station name that wraps across several lines on a narrow screen</CardTitle>
                <CardDescription>Check the full station name and location before continuing.</CardDescription>
            </CardHeader>
            <CardContent><p>Related information can grow without changing the shared card structure. This example checks wrapping and spacing with longer content.</p></CardContent>
        </Card>
    ),
};
