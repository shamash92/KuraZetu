import {fileURLToPath} from "node:url";
import type {StorybookConfig} from "@storybook/react-vite";

const config = {
    staticDirs: [{from: "../../assets/images", to: "/images"}],
    stories: ["./stories/**/*.stories.@(ts|tsx)", "./*.mdx"],
    addons: [
        "@storybook/addon-docs",
        "@storybook/addon-a11y",
        "@storybook/addon-vitest",
        "@storybook/addon-mcp",
        "storybook-addon-pseudo-states",
    ],
    framework: {
        name: "@storybook/react-vite",
        options: {
            builder: {
                viteConfigPath: fileURLToPath(new URL("./vite.config.ts", import.meta.url)),
            },
        },
    },
    features: {componentsManifest: true},
    typescript: {reactDocgen: "react-docgen-typescript"},
    core: {disableTelemetry: true},
} satisfies StorybookConfig;

export default config;
