import React from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";
import {expect, userEvent, waitFor, within} from "storybook/test";
import {toast} from "sonner";

import {Button} from "@/src/@/components/ui/button";
import {Toaster} from "@/src/@/components/ui/sonner";

function ToastExample({notify = () => toast("Changes saved"), ...props}: React.ComponentProps<typeof Toaster> & {notify?: () => void}) {
    return (
        <>
            <Button onClick={notify}>Show notification</Button>
            <Toaster {...props} />
        </>
    );
}

const meta = {
    title: "Components/Toaster",
    component: Toaster,
    args: {theme: "light", position: "bottom-right", closeButton: true, duration: Infinity},
    argTypes: {
        theme: {control: "select", options: ["light", "dark", "system"]},
        position: {control: "select", options: ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"]},
        richColors: {control: "boolean"},
        closeButton: {control: "boolean"},
        expand: {control: "boolean"},
    },
    render: (args) => <ToastExample {...args} />,
    beforeEach() {
        toast.dismiss();
        return () => {toast.dismiss();};
    },
    async play({canvasElement}) {
        await userEvent.click(within(canvasElement).getByRole("button", {name: "Show notification"}));
        await waitFor(() => expect(within(canvasElement.ownerDocument.body).getByText("Changes saved", {exact: true})).toBeVisible(), {timeout: 3000});
    },
    parameters: {docs: {story: {inline: false}, description: {component: "Mount one Toaster at the application root and call toast() from event handlers. Each story has an isolated preview and clears its notifications afterwards. The examples persist so their current state can be inspected."}}},
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Success: Story = {render: (args) => <ToastExample {...args} notify={() => {toast.success("Changes saved");}} />};
export const Error: Story = {render: (args) => <ToastExample {...args} notify={() => {toast.error("Could not save changes", {description: "Check your connection and retry."});}} />, async play({canvasElement}) {
    await userEvent.click(within(canvasElement).getByRole("button", {name: "Show notification"}));
    await waitFor(() => expect(within(canvasElement.ownerDocument.body).getByText("Could not save changes", {exact: true})).toBeVisible(), {timeout: 3000});
}};
export const Info: Story = {render: (args) => <ToastExample {...args} notify={() => {toast.info("Station selected");}} />, async play({canvasElement}) {
    await userEvent.click(within(canvasElement).getByRole("button", {name: "Show notification"}));
    await waitFor(() => expect(within(canvasElement.ownerDocument.body).getByText("Station selected", {exact: true})).toBeVisible(), {timeout: 3000});
}};
export const Warning: Story = {render: (args) => <ToastExample {...args} notify={() => {toast.warning("Review station details", {description: "Check the station name before continuing."});}} />, async play({canvasElement}) {
    await userEvent.click(within(canvasElement).getByRole("button", {name: "Show notification"}));
    await waitFor(() => expect(within(canvasElement.ownerDocument.body).getByText("Review station details", {exact: true})).toBeVisible(), {timeout: 3000});
}};
export const Loading: Story = {render: (args) => <ToastExample {...args} notify={() => {toast.loading("Saving changes", {description: "Example loading state; stays visible for inspection."});}} />, async play({canvasElement}) {
    await userEvent.click(within(canvasElement).getByRole("button", {name: "Show notification"}));
    await waitFor(() => expect(within(canvasElement.ownerDocument.body).getByText("Saving changes", {exact: true})).toBeVisible(), {timeout: 3000});
}};
export const WithDescription: Story = {render: (args) => <ToastExample {...args} notify={() => {toast("Changes saved", {description: "The example station record is ready to review. This longer description should wrap naturally on a narrow screen."});}} />};
export const WithAction: Story = {render: (args) => <ToastExample {...args} notify={() => {toast("Changes saved", {action: {label: "Undo", onClick() {toast.info("Changes restored");}}});}} />};
export const RichColors: Story = {args: {richColors: true}, render: (args) => <ToastExample {...args} notify={() => {toast.success("Changes saved");}} />};
export const Dark: Story = {args: {theme: "dark"}};
export const System: Story = {args: {theme: "system"}};
export const WithoutCloseButton: Story = {args: {closeButton: false}};
export const TopLeft: Story = {args: {position: "top-left"}};
export const TopCenter: Story = {args: {position: "top-center"}};
export const TopRight: Story = {args: {position: "top-right"}};
export const BottomLeft: Story = {args: {position: "bottom-left"}};
export const BottomCenter: Story = {args: {position: "bottom-center"}};
export const Stacked: Story = {
    args: {expand: true},
    render: (args) => <ToastExample {...args} notify={() => {
        toast("Station selected");
        toast("Record reviewed");
        toast("Changes saved");
    }} />,
};
