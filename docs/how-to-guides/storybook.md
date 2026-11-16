# Develop and publish the component catalog

Use Storybook to develop shared web components in isolation and publish a static catalog on Cloudflare Pages. Storybook imports the application components directly; it does not keep separate copies.

## Run the catalog locally

Use Node.js 24 and the pnpm version declared in `src/ui/package.json`. Install frontend dependencies using the [project setup guide](../tutorials/setup.md).

From the repository root, run:

```sh
cd src/ui
pnpm storybook
```

Open `http://localhost:3000`. Django and a database are not required. Configuration, preview styles, and stories live under `src/ui/storybook/`.

Select a component in the sidebar. Use Controls to change supported properties and the documentation view to compare its states. The catalog includes foundations and every existing shared UI module, plus navigation, links, breadcrumbs, typography, images, phone and OTP inputs, map containers, tabs, charts, progress bars, tables, sidebars, scrolling lists, accordions, admonitions, hero sections, and brand logos. Use the named stories to inspect variants and disabled, invalid, loading, error, open, focus, and long-content states where those states apply.

## Change a shared component

Edit the component under `src/ui/src/@/components/ui/`. Every application screen that imports it receives the change on the next application build and deployment.

Edit `src/ui/src/styles/tokens.css` to change shared colors, fonts, or component roles. The application and Storybook load this same stylesheet. The Tailwind configuration maps utility colors to these variables. Text accents use the shared dark-red `--text-accent` token. Button styles come from the existing landing-page CSS; logos, the brand sidebar, sign-up OTP field, and results chart now share their application implementations with the catalog.

For a recurring difference, add a named component variant. For a local layout adjustment, pass `className`, such as `mt-4 w-full sm:w-auto`. An explicit local override takes precedence over the shared property it replaces.

Raw HTML controls and separately styled page components remain independent until migrated to the shared components.

## Add a story

Create a `*.stories.tsx` file in `src/ui/storybook/stories/`. Import the application component using the configured `@/` alias and describe its useful states. For example:

```tsx
import type {Meta, StoryObj} from "@storybook/react-vite";

import {Button} from "@/src/@/components/ui/button";

const meta = {
    title: "Components/Button",
    component: Button,
    args: {children: "Continue"},
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Disabled: Story = {args: {disabled: true}};
```

Use the existing Button story as an example of an interaction check. Keep stories independent of authentication, live API calls, and production records.

## Check changes

From `src/ui`, install Chromium once:

```sh
pnpm exec playwright install chromium
```

To use an installed Google Chrome instead, run `STORYBOOK_BROWSER_CHANNEL=chrome pnpm test:storybook`.

On a Linux continuous integration runner that also needs browser system packages, use `pnpm exec playwright install --with-deps chromium`.

Run:

```sh
pnpm lint
pnpm typecheck:storybook
pnpm test:storybook
pnpm build:storybook
```

The Storybook tests render stories in Chromium, run their interaction checks, and fail on automated accessibility violations. Inspect keyboard focus, narrow layouts, and long content in the catalog as well. Screenshot comparison baselines are not configured. The toolbar can force pseudo states across all controls; turn that option off when checking normal focus behavior.

The UI checks workflow runs Storybook type checking, browser tests, and the static build on frontend changes.

The application keeps its existing Jest tests and Webpack build. Run `pnpm test` and `pnpm build` when shared changes affect the application.

## Publish on Cloudflare Pages

Create a Pages project with Git integration and select this repository. Use the following settings:

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Production branch | `main` |
| Root directory | `src/ui` |
| Build command | `pnpm build:storybook` |
| Build output directory | `storybook-static` |
| Environment variable | `NODE_VERSION=24` |
| Environment variable | `PNPM_VERSION=10.14.0` |

The output directory is relative to `src/ui`. Cloudflare installs the dependencies from the package manifest and dependency lock file before building. Browser binaries are needed for tests, not for publishing the catalog.

After deployment, open the assigned `https://<project>.pages.dev` address. Check both the documentation view and individual stories. Git integration rebuilds the catalog when changes land on the production branch.

To avoid builds for unrelated backend or native changes, configure build watch paths to include `src/ui/*` in the Pages project settings.

The build removes local checkout paths from generated metadata before publication.

For another static host, publish the contents of `src/ui/storybook-static/`.

## Attach a subdomain

In Cloudflare, open the Pages project, select **Custom domains**, and choose **Set up a domain**. Enter the desired hostname, such as `components.example.com`.

If Cloudflare manages the DNS zone in the same account, confirm the proposed DNS record. Otherwise, add a CNAME record at the DNS provider pointing the subdomain to `<project>.pages.dev`. Register the hostname in the Pages project before adding a CNAME manually.

Wait for the domain to become active, then open its HTTPS address and check a direct story link. The catalog is static and needs no application API or Django deployment.

See Cloudflare's [build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/), [build watch paths](https://developers.cloudflare.com/pages/configuration/build-watch-paths/), and [custom domain instructions](https://developers.cloudflare.com/pages/configuration/custom-domains/) for the dashboard settings.

## Connect an AI coding agent

The local Storybook server exposes the official MCP integration at `http://localhost:3000/mcp`. Add that URL as an HTTP MCP server in the coding agent's project settings. The tools let agents read component APIs and examples, find stories, and run browser tests. Test execution needs the local browser setup described above.

Component manifests are enabled in `storybook/main.ts` and published at `/manifests/components.json` in the static build. Cloudflare Pages can serve these files, but the static deployment does not run the local MCP server or browser tests.

Storybook marks these AI APIs as preview features. See the [AI integration guide](https://storybook.js.org/docs/ai) and [manifest documentation](https://storybook.js.org/docs/ai/manifests).
