




- always refer to https://docs.expo.dev/llms.txt when looking for anything expo related.

## Design tokens

- The app's shared visual language is the **perk** design system, defined once in
  `app/_utils/colors.ts` (the `perk` object plus named exports: `LIME`, `INK`,
  `COPPER`, `SURFACE`, `CARD`, `MUTE`, etc.). It mirrors the CSS custom
  properties in `claude-design/src/perk.css` — keep the two in sync.
- When styling any screen, import colors from `app/_utils/colors.ts`. Do NOT
  hardcode hex values or redefine palette constants locally in a component.