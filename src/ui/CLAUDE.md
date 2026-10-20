# React web instructions

These instructions apply to the React web application under `src/ui/`.

## Read first

- Repository-wide agent rules: [`../../AGENTS.md`](../../AGENTS.md)
- JavaScript and TypeScript code style:
  [`../../.claude/code-style.md`](../../.claude/code-style.md)
- Testing principles:
  [`../../.claude/testing-principles.md`](../../.claude/testing-principles.md)
- Frontend setup: [`../../docs/tutorials/setup.md`](../../docs/tutorials/setup.md)

## Working rules

- Use `pnpm` and the scripts in `package.json`; do not substitute another
  package manager.
- If a code file under `src/ui/` changes, run `pnpm lint`. Run `pnpm test` when
  the change affects behavior covered by Jest tests.
- Visible UI changes require the repository's
  [Impeccable UI QA guidance](../../.claude/design/impeccable.md).
- Prefer the configured `@/...` alias for imports outside the current folder.

## Styles

These rules apply to Tailwind classes and to the CSS files alike. Where a
CSS skill or guide you have loaded says otherwise, these win.

Keep what the code already uses:

- Direction: write `mt-`, `pr-`, `top-`, `margin-top` and `left`. Do not
  write logical ones such as `mbs-`, `pe-` or `margin-block-start`, and do
  not convert existing ones.
- Color: use the custom properties the stylesheet already defines, and add a
  new one in the notation its neighbors use. Do not rewrite colors to
  `oklch()`.

Follow these in every style you add or edit:

- Put a `:hover` rule in a CSS file inside
  `@media (hover: hover) and (pointer: fine)`. A Tailwind `hover:` class
  already does this.
- Style focus with `:focus-visible` and `outline`. Never remove an outline
  without replacing it.
- Give every button and pressable link an `:active` state.
- Name the properties a transition changes; do not write `transition: all`
  or `transition-all`. Put one that moves or scales something inside
  `@media (prefers-reduced-motion: no-preference)`, or behind `motion-safe:`.
- Cut off overflow with `overflow: clip`. Keep `hidden` for an element that
  scrolls.

Do not restyle code you are not otherwise changing to meet these rules.
