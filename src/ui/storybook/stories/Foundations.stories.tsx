import React from "react";
import type {Meta, StoryObj} from "@storybook/react-vite";

const palette = [
    {name: "Paper", token: "--paper"},
    {name: "Surface", token: "--surface"},
    {name: "Card", token: "--card"},
    {name: "Ink", token: "--ink"},
    {name: "Action", token: "--lime"},
    {name: "Verified", token: "--green"},
    {name: "Alert", token: "--red"},
    {name: "Copper", token: "--copper"},
];

function Palette() {
    return (
        <section className="catalogue" aria-label="Shared color palette">
            <h1>Color</h1>
            <p>These swatches read the same CSS variables as the application. Change the shared tokens to update both.</p>
            <ul className="catalogue-palette">
                {palette.map(({name, token}) => (
                    <li key={token}>
                        <div className="catalogue-swatch" style={{background: `var(${token})`}} />
                        <strong>{name}</strong>
                        <code className="catalogue-token">{token}</code>
                    </li>
                ))}
            </ul>
        </section>
    );
}

const meta = {
    title: "Foundations/Brand",
    tags: ["!manifest"],
    component: Palette,
    parameters: {
        controls: {disable: true},
        docs: {
            description: {
                component: "Shared colors and font families from src/styles/tokens.css. The written design guidance lives in DESIGN.md at the repository root.",
            },
        },
    },
} satisfies Meta<typeof Palette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Colors: Story = {};
export const Typography: Story = {
    render: () => (
        <section className="catalogue" aria-label="Shared font families">
            <h1>Every figure starts at a station.</h1>
            <p>Public Sans carries headings and running text. Change the shared font token to update the application and these examples together.</p>
            <p className="catalogue-type">IBM Plex Mono · Station 001 · Form 34A</p>
        </section>
    ),
};
