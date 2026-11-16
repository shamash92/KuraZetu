import {fileURLToPath} from "node:url";
import {storybookTest} from "@storybook/addon-vitest/vitest-plugin";
import {playwright} from "@vitest/browser-playwright";
import {defineConfig, mergeConfig} from "vitest/config";

import viteConfig from "./vite.config";

export default mergeConfig(viteConfig, defineConfig({
    plugins: [
        storybookTest({
            configDir: fileURLToPath(new URL("./", import.meta.url)),
            storybookScript: "pnpm storybook --ci",
            storybookUrl: "http://localhost:3000",
        }),
    ],
    test: {
        name: "storybook",
        browser: {
            enabled: true,
            headless: true,
            provider: playwright({
                launchOptions: process.env.STORYBOOK_BROWSER_CHANNEL
                    ? {channel: process.env.STORYBOOK_BROWSER_CHANNEL}
                    : {},
            }),
            instances: [{browser: "chromium"}],
        },
    },
}));
