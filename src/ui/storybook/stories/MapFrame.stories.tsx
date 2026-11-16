import React from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";
import {expect, fn, userEvent, within} from "storybook/test";
import {CircleMarker, MapContainer, Polygon, Tooltip} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import {MapFrame} from "@/src/@/components/ui/map-frame";

function LocalMap() {
    return <MapContainer center={[0, 0]} zoom={7} scrollWheelZoom={false} attributionControl={false} style={{height: "100%", background: "var(--surface)"}}>
        <Polygon positions={[[1, -1], [1, 1], [-1, 1], [-1, -1]]} interactive={false} pathOptions={{color: "var(--ink)", fillColor: "var(--mint)", fillOpacity: 0.7}} />
        <CircleMarker center={[0, 0]} radius={8} pathOptions={{color: "var(--ink)", fillColor: "var(--lime)", fillOpacity: 1}}><Tooltip permanent>Example station</Tooltip></CircleMarker>
    </MapContainer>;
}

const meta = {
    title: "Components/MapFrame",
    component: MapFrame,
    args: {label: "Example station map", caption: "Illustrative geometry for component testing. No live map tiles or API requests.", onRetry: fn()},
    argTypes: {status: {control: "select", options: ["ready", "loading", "empty", "error"]}},
    render: (args) => <MapFrame {...args} className="max-w-2xl"><LocalMap /></MapFrame>,
    parameters: {docs: {story: {inline: false}, description: {component: "A consistent surface for maps with loading, empty, and retryable error states. Supply the map renderer as children. This example uses Leaflet with local geometry so the catalog works without a backend or external tile service."}}},
} satisfies Meta<typeof MapFrame>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
export const Loading: Story = {args: {status: "loading"}};
export const Empty: Story = {args: {status: "empty"}};
export const Error: Story = {args: {status: "error"}};
export const WithoutCaption: Story = {args: {caption: null}};
export const Narrow: Story = {render: (args) => <MapFrame {...args} className="max-w-xs"><LocalMap /></MapFrame>};
export const Retry: Story = {args: {status: "error"}, async play({canvasElement, args}) {
    await userEvent.click(within(canvasElement).getByRole("button", {name: "Try again"}));
    await expect(args.onRetry).toHaveBeenCalledOnce();
}};
