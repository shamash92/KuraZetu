import React from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";
import {expect, userEvent, waitFor, within} from "storybook/test";

import {Button} from "@/src/@/components/ui/button";
import {Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerOverlay, DrawerPortal, DrawerTitle, DrawerTrigger} from "@/src/@/components/ui/drawer";

type Direction = "top" | "right" | "bottom" | "left";

function DrawerExample({direction = "bottom", startOpen = false, long = false}: {direction?: Direction; startOpen?: boolean; long?: boolean}) {
    return (
        <Drawer direction={direction} defaultOpen={startOpen}>
            <DrawerTrigger asChild><Button>Open drawer</Button></DrawerTrigger>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Choose a station</DrawerTitle>
                    <DrawerDescription>Review the selection before continuing.</DrawerDescription>
                </DrawerHeader>
                <div className="overflow-y-auto px-4" tabIndex={long ? 0 : undefined} aria-label={long ? "Station list" : undefined}>
                    {long ? Array.from({length: 20}, (_, index) => <p className="mb-4" key={index}>Example station {index + 1}</p>) : <p>Station information appears here.</p>}
                </div>
                <DrawerFooter><DrawerClose asChild><Button variant="secondary">Cancel</Button></DrawerClose></DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}

const meta = {
    title: "Components/Drawer",
    component: Drawer,
    subcomponents: {DrawerTrigger, DrawerPortal, DrawerOverlay, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter},
    args: {direction: "bottom"},
    argTypes: {direction: {control: "select", options: ["top", "right", "bottom", "left"]}},
    render: (args) => <DrawerExample direction={args.direction} />,
    parameters: {docs: {story: {inline: false}, description: {component: "A dismissible drawer powered by Vaul. Direction controls its edge. Include an accessible title, description, and close action."}}},
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};
export const Bottom: Story = {render: (args) => <DrawerExample direction={args.direction} startOpen />};
export const Top: Story = {args: {direction: "top"}, render: (args) => <DrawerExample direction={args.direction} startOpen />};
export const Left: Story = {args: {direction: "left"}, render: (args) => <DrawerExample direction={args.direction} startOpen />};
export const Right: Story = {args: {direction: "right"}, render: (args) => <DrawerExample direction={args.direction} startOpen />};
export const LongContent: Story = {render: () => <DrawerExample startOpen long />};
export const CloseAction: Story = {
    async play({canvasElement}) {
        const page = within(canvasElement.ownerDocument.body);
        await userEvent.click(within(canvasElement).getByRole("button", {name: "Open drawer"}));
        await expect(page.getByRole("dialog", {name: "Choose a station"})).toBeVisible();
        await userEvent.click(page.getByRole("button", {name: "Cancel"}));
        await waitFor(() => {
            const dialog = page.queryByRole("dialog");
            if (dialog) expect(dialog).not.toBeVisible();
        }, {timeout: 3000});
    },
};
export const DismissWithEscape: Story = {
    async play({canvasElement}) {
        const page = within(canvasElement.ownerDocument.body);
        await userEvent.click(within(canvasElement).getByRole("button", {name: "Open drawer"}));
        await userEvent.keyboard("{Escape}");
        await waitFor(() => {
            const dialog = page.queryByRole("dialog");
            if (dialog) expect(dialog).not.toBeVisible();
        }, {timeout: 3000});
    },
};
