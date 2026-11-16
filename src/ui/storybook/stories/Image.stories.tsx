import type {Meta, StoryObj} from "@storybook/react-vite";
import {expect, waitFor, within} from "storybook/test";

import {Image} from "@/src/@/components/ui/image";

const meta = {
    title: "Components/Image",
    component: Image,
    args: {src: "/images/social/social-site.svg", alt: "Kura Zetu social preview", className: "max-w-xl", aspectRatio: "1200 / 630"},
    argTypes: {
        fit: {control: "select", options: ["cover", "contain"]},
        status: {control: "select", options: [undefined, "loading", "error"]},
    },
    parameters: {docs: {description: {component: "An image frame with required alternative text, optional caption, aspect ratio, and loading/error feedback. Native image events update state automatically; status can hold a parent-managed loading or error state. className applies to the outer frame."}}},
} satisfies Meta<typeof Image>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {async play({canvasElement}) {
    await waitFor(() => expect(within(canvasElement).getByRole("img", {name: "Kura Zetu social preview"})).toBeVisible());
}};
export const WithCaption: Story = {args: {caption: "Kura Zetu brand artwork from the shared project assets."}};
export const Contain: Story = {args: {fit: "contain", src: "/images/logo/mark.svg", alt: "Kura Zetu tally mark"}};
export const Square: Story = {args: {aspectRatio: "1 / 1", fit: "contain", src: "/images/logo/mark.svg", alt: "Kura Zetu tally mark"}};
export const Widescreen: Story = {args: {aspectRatio: "16 / 9"}};
export const Loading: Story = {args: {status: "loading"}};
export const Error: Story = {args: {status: "error"}};
export const BrokenSource: Story = {args: {src: "/images/missing-preview.svg"}, async play({canvasElement}) {
    await expect(await within(canvasElement).findByRole("img", {name: "Kura Zetu social preview. Image unavailable."})).toBeVisible();
}};
export const Decorative: Story = {args: {alt: ""}};
export const LongCaption: Story = {args: {caption: "A longer description of the image, included to check how captions wrap when the component appears in a narrow column or on a small screen."}};

export const Cover: Story = {args: {aspectRatio: "4 / 3", fit: "cover"}};
