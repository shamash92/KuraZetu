const {defineConfig, globalIgnores} = require("eslint/config");
const tseslint = require("typescript-eslint");
const pluginQuery = require("@tanstack/eslint-plugin-query");
const reactHooks = require("eslint-plugin-react-hooks");

module.exports = defineConfig([
    globalIgnores(["staticfiles/*", "static/*", "dist/*"]),
    tseslint.configs.recommended,
    reactHooks.configs.flat.recommended,
    // Recommended, not recommended-strict: the strict set requires
    // `queryOptions` factories, and this project keeps every TanStack
    // configuration inline in the component that consumes it. These stay
    // errors — a missing query-key dependency serves stale data to the wrong
    // person.
    pluginQuery.configs["flat/recommended"],
    {
        rules: {
            // This config is new, and the codebase predates it by ~80 files.
            // These five rules currently report 117 findings that have nothing
            // to do with data fetching, so they warn rather than block while
            // the backlog is worked down. Raise each back to "error" as it
            // reaches zero; do not add new violations.
            "prefer-const": "warn",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": "warn",
            "react-hooks/exhaustive-deps": "warn",
            "react-hooks/set-state-in-effect": "warn",
            "react-hooks/incompatible-library": "warn",
        },
    },
]);
