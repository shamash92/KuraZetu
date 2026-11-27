import React from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";
import {expect, fn, userEvent, within} from "storybook/test";
import {useForm} from "react-hook-form";

import {Button} from "@/src/@/components/ui/button";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/src/@/components/ui/form";
import {Input} from "@/src/@/components/ui/input";

type StationValues = {stationName: string};

function StationForm({disabled = false, initialValue = "", onSubmit = () => {}}: {disabled?: boolean; initialValue?: string; onSubmit?: (values: StationValues) => void}) {
    const form = useForm<StationValues>({defaultValues: {stationName: initialValue}, disabled});
    return (
        <Form {...form}>
            <form className="grid w-full max-w-sm gap-4" noValidate onSubmit={form.handleSubmit((values) => onSubmit(values))}>
                <FormField control={form.control} name="stationName" rules={{required: "Enter a station name.", minLength: {value: 3, message: "Use at least three characters."}}} render={({field}) => (
                    <FormItem>
                        <FormLabel>Station name</FormLabel>
                        <FormControl><Input placeholder="Enter station name" {...field} /></FormControl>
                        <FormDescription>Use the name shown on the station record.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )} />
                <Button type="submit" disabled={disabled}>Save station</Button>
                {form.formState.isSubmitSuccessful && <p role="status">Station saved for this example.</p>}
            </form>
        </Form>
    );
}

const meta = {
    title: "Components/Form",
    component: Form,
    subcomponents: {FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage},
    render: () => <StationForm />,
    parameters: {controls: {disable: true}, docs: {description: {component: "React Hook Form composition using the shared field, label, description, control, and validation message. Validation and submission in these examples stay local."}}},
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Empty: Story = {};
export const Filled: Story = {render: () => <StationForm initialValue="Example polling station" />};
export const Disabled: Story = {render: () => <StationForm disabled />};
export const ValidationError: Story = {
    async play({canvasElement}) {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", {name: "Save station"}));
        await expect(canvas.getByText("Enter a station name.")).toBeVisible();
        await expect(canvas.getByRole("textbox", {name: "Station name"})).toHaveAttribute("aria-invalid", "true");
    },
};
export const Submitted: Story = {
    render: () => <StationForm onSubmit={fn()} />,
    async play({canvasElement}) {
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByRole("textbox", {name: "Station name"}), "Example polling station");
        await userEvent.click(canvas.getByRole("button", {name: "Save station"}));
        await expect(canvas.getByRole("status")).toHaveTextContent("Station saved for this example.");
    },
};
export const CorrectValidationError: Story = {
    async play({canvasElement}) {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", {name: "Save station"}));
        await expect(canvas.getByText("Enter a station name.")).toBeVisible();
        await userEvent.type(canvas.getByRole("textbox", {name: "Station name"}), "Example polling station");
        await userEvent.click(canvas.getByRole("button", {name: "Save station"}));
        await expect(canvas.getByRole("status")).toBeVisible();
        await expect(canvas.queryByText("Enter a station name.")).not.toBeInTheDocument();
    },
};
