import type {Preview} from "@storybook/react-vite";

import "@/src/input.css";
import "./preview.css";

const preview = {
    parameters: {
        layout: "padded",
        controls: {
            matchers: {color: /(background|color)$/i, date: /Date$/i},
        },
        a11y: {test: "error"},
    },
    tags: ["autodocs"],
} satisfies Preview;

export default preview;
