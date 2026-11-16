import React from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";
import {expect, userEvent, waitFor, within} from "storybook/test";

import {Button} from "@/src/@/components/ui/button";
import {Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger} from "@/src/@/components/ui/sheet";

function SheetExample({side = "right", startOpen = false, long = false}: {side?: "top" | "right" | "bottom" | "left"; startOpen?: boolean; long?: boolean}) {
    return (
        <Sheet defaultOpen={startOpen}>
            <SheetTrigger asChild><Button>Open sheet</Button></SheetTrigger>
            <SheetContent side={side} className="max-h-screen overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Station details</SheetTitle>
                    <SheetDescription>Review the station record before continuing.</SheetDescription>
                </SheetHeader>
                <div className="px-4">
                    {long ? Array.from({length: 20}, (_, index) => <p className="mb-4" key={index}>Station detail {index + 1}. Long content remains reachable by scrolling.</p>) : <p>Station information appears here.</p>}
                </div>
                <SheetFooter><SheetClose asChild><Button variant="secondary">Done</Button></SheetClose></SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

const meta = {
    title: "Components/Sheet",
    component: SheetContent,
    subcomponents: {Sheet, SheetTrigger, SheetClose, SheetHeader, SheetTitle, SheetDescription, SheetFooter},
    args: {side: "right"},
    argTypes: {side: {control: "select", options: ["top", "right", "bottom", "left"]}},
    render: (args) => <SheetExample side={args.side} />,
    parameters: {docs: {story: {inline: false}, description: {component: "A modal side panel. Include a title, a description, and a clear close action. Escape closes the panel and returns focus to its trigger."}}},
} satisfies Meta<typeof SheetContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};
export const Right: Story = {render: (args) => <SheetExample side={args.side} startOpen />};
export const Left: Story = {args: {side: "left"}, render: (args) => <SheetExample side={args.side} startOpen />};
export const Top: Story = {args: {side: "top"}, render: (args) => <SheetExample side={args.side} startOpen />};
export const Bottom: Story = {args: {side: "bottom"}, render: (args) => <SheetExample side={args.side} startOpen />};
export const LongContent: Story = {render: (args) => <SheetExample side={args.side} startOpen long />};
export const DismissWithEscape: Story = {
    async play({canvasElement}) {
        const trigger = within(canvasElement).getByRole("button", {name: "Open sheet"});
        const page = within(canvasElement.ownerDocument.body);
        await userEvent.click(trigger);
        await expect(page.getByRole("dialog", {name: "Station details"})).toBeVisible();
        await userEvent.keyboard("{Escape}");
        await waitFor(() => {
            const dialog = page.queryByRole("dialog");
            if (dialog) expect(dialog).not.toBeVisible();
        }, {timeout: 3000});
        await expect(trigger).toHaveFocus();
    },
};
export const CloseAction: Story = {
    async play({canvasElement}) {
        const page = within(canvasElement.ownerDocument.body);
        await userEvent.click(within(canvasElement).getByRole("button", {name: "Open sheet"}));
        await userEvent.click(page.getByRole("button", {name: "Done"}));
        await waitFor(() => {
            const dialog = page.queryByRole("dialog");
            if (dialog) expect(dialog).not.toBeVisible();
        }, {timeout: 3000});
    },
};
