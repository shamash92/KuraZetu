import React from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";

import {Heading, Text} from "@/src/@/components/ui/typography";

const meta = {
    title: "Components/Typography",
    component: Heading,
    subcomponents: {Text},
    args: {children: "Every figure starts at a station.", as: "h1", size: "title"},
    argTypes: {
        as: {control: "select", options: ["h1", "h2", "h3", "h4", "h5", "h6"]},
        size: {control: "select", options: ["display", "headline", "title"]},
    },
    parameters: {docs: {description: {component: "Shared typography from DESIGN.md. Heading levels remain semantic independently of visual size. Public Sans carries prose; IBM Plex Mono carries labels, metadata, and figures."}}},
} satisfies Meta<typeof Heading>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Title: Story = {};
export const Headline: Story = {args: {size: "headline"}};
export const Display: Story = {args: {size: "display"}};
export const Body: Story = {render: () => <Text>Check the station name and location before continuing.</Text>};
export const Lede: Story = {render: () => <Text size="lede" className="max-w-xl">Every figure starts at a polling station. Review the record before continuing.</Text>};
export const Label: Story = {render: () => <Text size="label">Polling station</Text>};
export const Metadata: Story = {render: () => <Text size="meta">Station 001 · Form 34A</Text>};
export const Muted: Story = {render: () => <Text className="text-muted-foreground">Additional information about the station.</Text>};
export const LongHeading: Story = {args: {children: "A longer station heading that wraps naturally in a narrow column"}, render: (args) => <div className="max-w-xs"><Heading {...args} /></div>};
