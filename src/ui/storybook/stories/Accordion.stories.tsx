import React from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";
import {expect, userEvent, within} from "storybook/test";
import {Accordion, AccordionItem} from "@/src/@/components/ui/accordion";
function Example({multiple = false, open = false, disabled = false}: {multiple?: boolean; open?: boolean; disabled?: boolean}) {return <Accordion multiple={multiple} className="max-w-xl"><AccordionItem title="What should I check?" defaultOpen={open}>Confirm the station name and the figures on the posted form.</AccordionItem><AccordionItem title="Where does the record come from?" disabled={disabled}>The station record is tied to its supporting form.</AccordionItem></Accordion>;}
const meta = {title: "Components/Accordion", component: Accordion, subcomponents: {AccordionItem}, render: () => <Example />} satisfies Meta<typeof Accordion>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Closed: Story = {};
export const Open: Story = {render: () => <Example open />};
export const Multiple: Story = {render: () => <Accordion multiple><AccordionItem title="Station name" defaultOpen>Check the name on the record.</AccordionItem><AccordionItem title="Figures" defaultOpen>Check every figure.</AccordionItem></Accordion>};
export const DisabledItem: Story = {render: () => <Example disabled />};
export const Toggle: Story = {async play({canvasElement}) {const canvas = within(canvasElement); await userEvent.click(canvas.getByText("What should I check?")); await expect(canvas.getByText("Confirm the station name and the figures on the posted form.")).toBeVisible(); await userEvent.click(canvas.getByText("What should I check?")); await expect(canvas.getByText("Confirm the station name and the figures on the posted form.")).not.toBeVisible();}};
export const Focus: Story = {parameters: {pseudo: {focusVisible: true}}};
export const ExclusiveOpen: Story = {async play({canvasElement}) {const canvas = within(canvasElement); await userEvent.click(canvas.getByText("What should I check?")); await userEvent.click(canvas.getByText("Where does the record come from?")); await expect(canvas.getByText("The station record is tied to its supporting form.")).toBeVisible(); await expect(canvas.getByText("Confirm the station name and the figures on the posted form.")).not.toBeVisible();}};
export const DisabledInteraction: Story = {render: () => <Example disabled />, async play({canvasElement}) {const canvas = within(canvasElement); await userEvent.click(canvas.getByText("Where does the record come from?")); await expect(canvas.getByText("The station record is tied to its supporting form.")).not.toBeVisible();}};
