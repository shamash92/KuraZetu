import React from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";
import {expect, userEvent, within} from "storybook/test";
import {List, Map} from "lucide-react";

import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/src/@/components/ui/tabs";

function ResultsTabs({orientation = "horizontal", activationMode = "automatic", disabled = false, icons = false, long = false}: {orientation?: "horizontal" | "vertical"; activationMode?: "automatic" | "manual"; disabled?: boolean; icons?: boolean; long?: boolean}) {
    return <Tabs defaultValue="results" orientation={orientation} activationMode={activationMode} className="max-w-xl">
        <TabsList aria-label="Station information">
            <TabsTrigger value="results">{icons && <List aria-hidden="true" className="size-4" />}{long ? "Station reporting progress" : "Results"}</TabsTrigger>
            <TabsTrigger value="map">{icons && <Map aria-hidden="true" className="size-4" />}{long ? "Polling station location" : "Map"}</TabsTrigger>
            <TabsTrigger value="activity" disabled={disabled}>Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="results">Station results appear here.</TabsContent>
        <TabsContent value="map">Station location appears here.</TabsContent>
        <TabsContent value="activity">Recent station activity appears here.</TabsContent>
    </Tabs>;
}

const meta = {
    title: "Components/Tabs",
    component: Tabs,
    subcomponents: {TabsList, TabsTrigger, TabsContent},
    render: () => <ResultsTabs />,
    parameters: {docs: {description: {component: "Tabs switch related panels with arrow-key navigation. Automatic activation is the default; manual activation waits for Enter or Space. Disabled tabs are skipped."}}},
} satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {};
export const Vertical: Story = {render: () => <ResultsTabs orientation="vertical" />};
export const DisabledTab: Story = {render: () => <ResultsTabs disabled />};
export const WithIcons: Story = {render: () => <ResultsTabs icons />};
export const LongLabels: Story = {render: () => <div className="max-w-xs"><ResultsTabs long /></div>};
export const ManualActivation: Story = {render: () => <ResultsTabs activationMode="manual" />};
export const Focus: Story = {parameters: {pseudo: {focusVisible: true}}};
export const SwitchPanel: Story = {async play({canvasElement}) {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("tab", {name: "Map"}));
    await expect(canvas.getByRole("tabpanel", {name: "Map"})).toHaveTextContent("Station location appears here.");
}};
export const KeyboardNavigation: Story = {async play({canvasElement}) {
    const canvas = within(canvasElement);
    canvas.getByRole("tab", {name: "Results"}).focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("tab", {name: "Map"})).toHaveFocus();
    await expect(canvas.getByRole("tabpanel", {name: "Map"})).toBeVisible();
}};
