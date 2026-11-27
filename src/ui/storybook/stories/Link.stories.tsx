import React from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";
import {ExternalLink} from "lucide-react";

import {Link} from "@/src/@/components/ui/link";

const meta = {
    title: "Components/Link",
    component: Link,
    args: {href: "#details", children: "View station details"},
    argTypes: {asChild: {control: false}},
    parameters: {docs: {description: {component: "A navigation link with ink text and a simple underline. Use Button with asChild for a button-shaped link. asChild also supports composing with the application's router link."}}},
} satisfies Meta<typeof Link>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const External: Story = {args: {target: "_blank", href: "https://kurazetu.readthedocs.io/", children: <>Read the documentation <ExternalLink aria-hidden="true" className="inline size-3.5" /></>}};
export const InText: Story = {render: (args) => <p className="max-w-lg leading-relaxed">Check the station name before continuing. <Link {...args} /> to confirm the current selection.</p>};
export const Muted: Story = {args: {className: "text-muted-foreground"}};
export const LongLabel: Story = {args: {children: "Review the complete polling station record and its supporting information"}, render: (args) => <div className="max-w-xs"><Link {...args} /></div>};
export const Hover: Story = {parameters: {pseudo: {hover: true}}};
export const Focus: Story = {parameters: {pseudo: {focusVisible: true}}};
export const Pressed: Story = {parameters: {pseudo: {active: true}}};
