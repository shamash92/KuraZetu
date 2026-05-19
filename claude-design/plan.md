# Kura Zetu — Review-driven P0 plan

After synthesising the three model reviews (Claude / DeepSeek / Codex), 10 items.
Updated as work proceeds. Tick boxes are honest. If a credit-out leaves the doc
inconsistent, restart from the first un-ticked item.

## Phase 1 · Quick global fixes (fastest trust gains)
- [x] **#2  Neutral candidate palette.** Done — `--kz-cand-1/2/3` are now a slate
  monochrome ramp in `src/tokens.css`. Hex labels still carry county text; the
  legend disambiguates candidates by name.
- [x] **#3  Copy renames.** Done — "Suspected fraud" → "Possible irregularity"
  (mobile + web + system), "Vote without IEBC?" → "See your station", and the
  designer-note "Same game, dressed as civic infrastructure" → "Same goal,
  dressed as civic infrastructure."
- [x] **#5  Anonymise public usernames.** Done — bulk-replaced via run_script.
  All public surfaces show `@n   m`-style partial handles (thin-space mask).
  Only the "You · @njokim" badge in web nav stays full to mark the current user.

## Phase 2 · Strip the clout economy
- [x] **#1  Public leaderboards + point chips removed.** Done.
  - Web PinVerify "Top verifiers · this week" leaderboard replaced with
    "Recent contributors" — same handles + locations + timestamps, NO scores,
    NO ranks, plus an explainer "No rankings. No scores. Everyone's
    contribution counts the same."
  - "+84 pts" header chip on the mobile PinVerify A task hub replaced with
    a private contribution counter ("12 helped").
  - Web PinVerify nav badge "184 PTS" → "12 HELPED."
  - "+10 / +15 / +25 / +2" point suffixes on every public chip and button
    label removed across PinVerify A + B + Web PinVerify.
  - Receipt headers "+15 points / +10 points" → "Asante."
  - Web PinVerify points legend ("+10 if pin is right…") renumbered as a
    numbered explainer (01 / 02 / 03) with no scores.
  - Section post-it updated to reflect the removal.

## Phase 3 · Screenshot-resilient disclaimers
- [x] **#4  Inline disclaimer watermark.** Done. Added `.kz-watermark` (sand
  ink on dark) + `.kz-watermark--light` (forest ink on sand) classes in
  `tokens.css`. Tiles a diagonal repeating SVG-text watermark inside each
  results panel. Applied to:
  - Mobile R1National hex map area
  - Web hero leader callout, hex map panel, candidate leaderboard table,
    station detail vote rows table.
  Crop the chrome strip out of a screenshot and the inline watermark still
  appears in the data.

## Phase 4 · PinVerify A softening
- [x] **#8  Soften the walk-to-confirm gate.** Done.
  - 20 m → 40 m radius (compound-friendly).
  - Hold-to-commit (2 s) replaced with tap + explicit "Yes, save the pin" /
    "Wait — not yet" two-button confirm. Discoverable, undo-able.
  - Copy updated on PVAWalk and PVAConfirm; section subtitle and post-it
    updated to reflect the softer gate + landmark fallback.

## Phase 5 · Missing states (done — dedicated section)
New section: `src/section-edge-states.jsx` → 8 artboards registered in
`redesign.html` as section 11 ("Edge states · what was missing").
- [x] **S1 Location denied** — two-path explainer (open settings / pick station
  manually, flagged as NO-GPS).
- [x] **S2 Camera denied** — visual + three-step settings instructions.
- [x] **S3 GPS poor → landmark mode** — three structured questions (entrance
  faces / closest landmark / roof color) so we can triangulate without GPS.
- [x] **S4 OTP send-fail / wrong number** — "things to try" panel + Change
  number button + Send code again.
- [x] **S5 No nearby stations / no matches** — search empty state with "search
  by code" / "browse all in ward" / "report a missing station" recovery.
- [x] **S6 No Community Notes yet** — calm empty state with "add the first
  note" CTA + "what counts as a note" explainer link.
- [x] **S7 Discard draft confirm** — modal sheet over dimmed review screen,
  with destructive Yes/No.
- [x] **S8 Account recovery** — 12-word Kiswahili BIP-39 phrase grid on paper,
  copy-disabled, with "I've written it down" gate.

## Phase 6 · Light/outdoor mode
- [x] **#7  Outdoor mode — done.** Added `[data-brand="ramani"][data-mode="outdoor"]`
  overrides to `tokens.css`. Flips surfaces (forest → sand), ink (sand → forest),
  darkens accent + territory palette for AA on sand. Activates by setting
  `data-mode="outdoor"` on `<html>` or any subtree. Wire the toggle into the
  Settings screen when that's added.

## Phase 7 · Engineer-buildable tokens
- [x] **#10  `tokens.css` expanded.** Added motion durations + easings,
  focus-ring tokens + global `:focus-visible` style, breakpoint variables
  for the Tailwind bridge, four named line-heights, and a global
  `prefers-reduced-motion` override that collapses durations to 0 ms.
  Spacing / radius / elevation were already present; now documented as
  the ladder an engineer should generate Tailwind config from.

## Phase 8 · Spec only (audit doc edits)
- [x] **#9  Image compression spec — added to `audit.html`.** New ADD row in
  the stack section: `expo-image-manipulator`, resize captures to 1024 px
  wide / JPEG q=0.85 (~400 KB) before queue. KES 1.20 estimate stays as the
  user-facing copy; bytes drop ~6×. Original retained on-device 14 d for
  reverification appeals.

## Resumption notes for future me
- Brand archive PDF (v1 directions: Karatasi / Mwanga / Sauti) lives at
  `brand-archive-v1.html` — DO NOT re-explore brand directions.
- `redesign-print.html` is the print export script. If artboard sizes change,
  the scale-to-fit math will keep working; no edits needed.
- `audit.html` is the companion long-form doc. Phase-8 edits land there.
