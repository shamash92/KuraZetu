import React from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";
import {expect, userEvent, within} from "storybook/test";

import {ArrowRight} from "lucide-react";
import {siteNavigationItems} from "@/src/landing-pages/site-navigation";
import {Button} from "@/src/@/components/ui/button";
import {Navbar, type NavbarItem} from "@/src/@/components/ui/navbar";

const items: ReadonlyArray<NavbarItem> = siteNavigationItems();
const actions = <><Button asChild variant="outline"><a href="#signin">Sign in</a></Button><Button asChild><a href="#signup">Get started <ArrowRight aria-hidden="true" size={15} /></a></Button></>;

const meta = {
    title: "Components/Navbar",
    component: Navbar,
    args: {items, actions},
    parameters: {layout: "fullscreen", docs: {description: {component: "A responsive navigation bar with the permanent civic disclaimer, grouped links, current-page states, and a mobile menu. It responds to its container width. The application and these examples share the same navbar and navigation items. Action links in examples use hash targets."}}},
} satisfies Meta<typeof Navbar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOut: Story = {
    async play({canvasElement}) {
        const canvas = within(canvasElement);
        const desktop = canvas.queryByRole("navigation", {name: "Main navigation"});
        const toggle = canvas.queryByRole("button", {name: "Open navigation"});
        await expect(Boolean(desktop) !== Boolean(toggle)).toBe(true);
    },
};
export const SignedIn: Story = {args: {actions: <Button asChild variant="outline"><a href="#logout">Log out</a></Button>}};
export const CurrentPage: Story = {args: {items: items.map((item) => item.label === "Brand" ? {...item, current: true} : item)}};
export const WithoutActions: Story = {args: {actions: null}};
export const MobileClosed: Story = {render: (args) => <div className="min-h-[600px] w-full max-w-[375px]"><Navbar {...args} /></div>};
export const MobileOpen: Story = {args: {defaultMenuOpen: true}, render: (args) => <div className="min-h-[600px] w-full max-w-[375px]"><Navbar {...args} /></div>};
export const MobileMenuInteraction: Story = {
    render: (args) => <div className="min-h-[600px] w-full max-w-[375px]"><Navbar {...args} /></div>,
    async play({canvasElement}) {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", {name: "Open navigation"}));
        await expect(canvas.getByRole("navigation", {name: "Mobile navigation"})).toBeVisible();
        await userEvent.keyboard("{Escape}");
        await expect(canvas.queryByRole("navigation", {name: "Mobile navigation"})).not.toBeInTheDocument();
        await expect(canvas.getByRole("button", {name: "Open navigation"})).toHaveFocus();
    },
};
export const DevelopersMenu: Story = {
    args: {defaultMenuOpen: true},
    render: (args) => <div className="min-h-[600px] w-full max-w-[375px]"><Navbar {...args} /></div>,
    async play({canvasElement}) {
        const canvas = within(canvasElement);
        const mobile = within(canvas.getByRole("navigation", {name: "Mobile navigation"}));
        await userEvent.click(mobile.getByText("Developers"));
        await expect(mobile.getByRole("link", {name: "Specs"})).toBeVisible();
    },
};
export const Focus: Story = {parameters: {pseudo: {focusVisible: true}}};
