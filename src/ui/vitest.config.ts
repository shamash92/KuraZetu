import {defineConfig} from "vitest/config";

import storybookTests from "./storybook/vitest.config";

export default defineConfig({test: {projects: [storybookTests]}});
