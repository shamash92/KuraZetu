import React from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";

import {Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator} from "@/src/@/components/ui/breadcrumb";

const meta = {
    title: "Components/Breadcrumb",
    component: Breadcrumb,
    subcomponents: {BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis},
    render: (args) => <Breadcrumb {...args}><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="#home">Home</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbLink href="#county">County</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Polling station</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>,
} satisfies Meta<typeof Breadcrumb>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const CurrentOnly: Story = {render: () => <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbPage>Results</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>};
export const Collapsed: Story = {render: () => <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="#home">Home</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbEllipsis /></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Polling station</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>};
export const CustomSeparator: Story = {render: () => <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="#home">Home</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator>/</BreadcrumbSeparator><BreadcrumbItem><BreadcrumbPage>Results</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>};
export const LongPath: Story = {render: () => <div className="max-w-sm"><Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="#county">A county with a longer name</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbLink href="#constituency">A constituency with a longer name</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>A polling station with a long name</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb></div>};
export const Focus: Story = {parameters: {pseudo: {focusVisible: true}}};
