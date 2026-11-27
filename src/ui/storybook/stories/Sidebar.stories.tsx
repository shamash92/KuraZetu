import React from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";
import {expect, userEvent, waitFor, within} from "storybook/test";
import {Download, Palette, Shapes, Type} from "lucide-react";
import {Sidebar, SidebarGroup, SidebarLink, SidebarToggle} from "@/src/@/components/ui/sidebar";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger} from "@/src/@/components/ui/sheet";
import {Button} from "@/src/@/components/ui/button";
function Example(args: React.ComponentProps<typeof Sidebar>) {return <Sidebar {...args}><SidebarToggle /><SidebarGroup label="Identity"><SidebarLink label="Logo" href="#logo" icon={<Shapes aria-hidden="true" />} active /><SidebarLink label="Colour" href="#colour" icon={<Palette aria-hidden="true" />} /><SidebarLink label="Type" href="#type" icon={<Type aria-hidden="true" />} /></SidebarGroup><SidebarGroup label="Resources"><SidebarLink label="Downloads" href="#downloads" icon={<Download aria-hidden="true" />} /></SidebarGroup></Sidebar>;}
const meta = {title: "Components/Sidebar", component: Sidebar, subcomponents: {SidebarGroup, SidebarLink, SidebarToggle}, args: {label: "Brand navigation"}, render: (args) => <Example {...args} />, parameters: {docs: {description: {component: "The left navigation treatment from the brand guidelines, now shared with those pages. Links preserve normal navigation semantics and current-page labels. Compose it inside a Sheet for a mobile menu."}}}} satisfies Meta<typeof Sidebar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Expanded: Story = {};
export const Collapsed: Story = {args: {defaultCollapsed: true}};
export const WithoutToggle: Story = {render: (args) => <Sidebar {...args}><SidebarGroup><SidebarLink label="Logo" href="#logo" active /><SidebarLink label="Colour" href="#colour" /><SidebarLink label="Type" href="#type" /></SidebarGroup></Sidebar>};
export const LongLabels: Story = {render: (args) => <Sidebar {...args}><SidebarGroup><SidebarLink label="Detailed station verification guidelines" href="#guidelines" active /><SidebarLink label="Supporting documentation and downloads" href="#downloads" /></SidebarGroup></Sidebar>};
export const Toggle: Story = {async play({canvasElement}) {const canvas = within(canvasElement); await userEvent.click(canvas.getByRole("button", {name: "Collapse sidebar"})); await expect(canvas.getByRole("button", {name: "Expand sidebar"})).toBeVisible(); await expect(canvas.getByRole("link", {name: "Logo"})).toHaveAttribute("aria-current", "page");}};
export const MobileSheet: Story = {parameters: {docs: {story: {inline: false, height: 640}}}, render: (args) => <Sheet><SheetTrigger asChild><Button>Open sidebar</Button></SheetTrigger><SheetContent side="left"><SheetHeader><SheetTitle>Brand navigation</SheetTitle><SheetDescription>Choose a guidelines page.</SheetDescription></SheetHeader><div className="px-4"><Example {...args} /></div></SheetContent></Sheet>, async play({canvasElement}) {await userEvent.click(within(canvasElement).getByRole("button", {name: "Open sidebar"})); await waitFor(() => expect(within(canvasElement.ownerDocument.body).getByRole("dialog", {name: "Brand navigation"})).toBeVisible());}};
