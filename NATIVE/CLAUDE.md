# React Native instructions

These instructions apply to the Expo and React Native application under
`NATIVE/`.

## Read first

- Repository-wide agent rules: [`../AGENTS.md`](../AGENTS.md)
- JavaScript and TypeScript code style:
  [`../.claude/code-style.md`](../.claude/code-style.md)
- React and React Native testing principles:
  [`../.claude/testing-principles.md`](../.claude/testing-principles.md)
- Expo setup: [`../docs/tutorials/setup-android.md`](../docs/tutorials/setup-android.md)

## Working rules

- Always use the official [Expo documentation for agents](https://docs.expo.dev/llms.txt)
  when researching Expo behavior.
- Use `pnpm` and the scripts in `package.json`; do not substitute another
  package manager.
- Visible UI changes require the repository's
  [Impeccable UI QA guidance](../.claude/design/impeccable.md).

## Design tokens

- The app's shared visual language is the **perk** design system, defined once in
  `app/_utils/colors.ts` (the `perk` object plus named exports: `LIME`, `INK`,
  `COPPER`, `SURFACE`, `CARD`, `MUTE`, etc.). It mirrors the CSS custom
  properties in `claude-design/src/perk.css` — keep the two in sync.
- When styling any screen, import colors from `app/_utils/colors.ts`. Do NOT
  hardcode hex values or redefine palette constants locally in a component.
