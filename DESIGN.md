---
name: Kura Zetu
description: Citizen-led parallel tallying for Kenyan elections — warm paper, drawn survey mesh, one acid lime for action.
colors:
  lime: "#c4ff5e"
  lime-deep: "#a8e63a"
  lime-ink: "#0a0a0a"
  green: "#16a35a"
  green-deep: "#0f7a40"
  mint: "#d8f5dc"
  mint-2: "#b9eac1"
  coral: "#ffd0c0"
  coral-deep: "#a8442a"
  red: "#c44539"
  periwinkle: "#c8d4ff"
  periwinkle-deep: "#2532a8"
  copper: "#c97b3e"
  copper-deep: "#8a4a25"
  copper-soft: "#e9d4b8"
  paper: "#f7f6f3"
  paper-deep: "#efeeea"
  paper-vivid: "#e9e8e2"
  card: "#ffffff"
  surface: "#f1f0eb"
  ink: "#0d0d0d"
  ink-soft: "#1a1a1a"
  mute: "#6b6d72"
  mute-2: "#9a9da3"
  rule-08: "rgba(13,13,13,0.07)"
  rule-16: "rgba(13,13,13,0.14)"
  glass: "rgba(255,255,255,0.88)"
  mesh-ink: "rgba(40,50,60,0.14)"
  mesh-dot: "rgba(40,50,60,0.28)"
typography:
  display:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(48px, 6vw, 84px)"
    fontWeight: 900
    lineHeight: 0.94
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "30px"
    fontWeight: 900
    lineHeight: 1.27
    letterSpacing: "-0.023em"
  title:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.035em"
  lede:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "17.5px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  body:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.22em"
  meta:
    fontFamily: "IBM Plex Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "10.5px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.06em"
rounded:
  field: "14px"
  card: "18px"
  phone-screen: "36px"
  phone: "48px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "72px"
components:
  button-lime:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.lime-ink}"
    rounded: "{rounded.pill}"
    padding: "13px 22px"
    typography: "{typography.body}"
  button-lime-hover:
    backgroundColor: "{colors.lime-deep}"
    textColor: "{colors.lime-ink}"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "13px 22px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "13px 22px"
  button-ghost-hover:
    backgroundColor: "{colors.surface}"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "24px"
  field:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "16px 14px"
  eyebrow:
    textColor: "{colors.copper}"
    typography: "{typography.label}"
  disclaimer:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.copper-deep}"
    typography: "{typography.meta}"
    padding: "8px 32px"
  nav-pill:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
---

# Design System: Kura Zetu

## Overview

**Creative North Star: "The Field Ledger"**

This is the visual language of someone recording what they saw, accurately, in the field. Warm off-white paper carries a faint square-ruled grid and a hand-sketched mesh that draws itself in stroke by stroke. Micro-labels are set in uppercase monospace with wide tracking, the way a surveyor annotates a plate: `01 · DASHBOARD`, `FORM 34A · MOBILE ONLY`, `KENYA · 47 COUNTIES`, `STOP 9 / 12`. County boundaries on the atlas are drawn with the same sketched stroke fade rather than filled as data. Figures are tabular. The footer carries coordinates in its margin.

Against that quiet substrate, the display type is loud and physical: Public Sans at weight 900, tracked in hard to `-0.045em`, line-height under 1, with a hand-drawn marker stroke swiped under the words that matter. One acid lime does all the acting — it is the pill button, the underline, the live signal — and nothing else competes with it. Copper is reserved for labels and the standing disclaimer strip. The result reads as evidence first and interface second, which is the point: the product exists to make a photographed form on a wall traceable.

Surfaces are flat. Depth comes from hairline rules at 7% and 14% ink, tonal steps between paper, surface, and card, and a single frosted-glass bar that blurs what scrolls beneath it. The only real shadow in the system belongs to the phone frames on the prototype pages — a device rendered in a document, not a UI convention.

**Key Characteristics:**
- Warm paper substrate (`#f7f6f3`), never pure white as the page ground
- Drawn, animated survey mesh and square-ruled grid instead of decorative imagery
- Uppercase monospace micro-labels with `0.18em`–`0.22em` tracking
- Display type at weight 900, negative tracking, sub-1.0 line-height
- Exactly one acid accent (`#c4ff5e`) carrying action
- Flat surfaces, hairline rules, fully-round pills, 18px cards
- A permanent "Not an IEBC system" strip above the nav

## Colors

A warm, paper-toned neutral field holding one acid accent, with copper as the labelling voice and a small set of semantic hues that never take the lead.

### Primary
- **Acid Lime** (`#c4ff5e`): the only action colour. Primary pill buttons, the hand-drawn underline beneath display headlines, live indicators. It appears on a small fraction of any screen; that scarcity is what makes it read as "act here." Its hover is **Lime Deep** (`#a8e63a`), and text on lime is always **Lime Ink** (`#0a0a0a`), never white.

### Secondary
- **Copper** (`#c97b3e`): the labelling voice. Eyebrows, footer column titles, field labels — never body copy, never a button. **Copper Deep** (`#8a4a25`) carries the standing disclaimer strip and link hovers. **Copper Soft** (`#e9d4b8`) is a tint for warm fills.

### Tertiary
- **Verification Green** (`#16a35a`) and **Green Deep** (`#0f7a40`): confirmed, verified, reporting-complete states, plus the default marker underline stroke. **Mint** (`#d8f5dc`) and **Mint 2** (`#b9eac1`) are its tints.
- **Flag Red** (`#c44539`): the period after the wordmark, alert strokes, the alternate underline. **Coral** (`#ffd0c0`) and **Coral Deep** (`#a8442a`) sit beside it for softer warning surfaces.
- **Periwinkle** (`#c8d4ff`) / **Periwinkle Deep** (`#2532a8`): informational accents, used sparingly.

### Neutral
- **Paper** (`#f7f6f3`): the page ground. Warm, not Tailwind gray-50.
- **Paper Deep** (`#efeeea`) / **Paper Vivid** (`#e9e8e2`): the radial ground gradient steps.
- **Surface** (`#f1f0eb`): recessed panels, hover fills, input prefixes.
- **Card** (`#ffffff`): raised content only. White is a *card*, not a page.
- **Ink** (`#0d0d0d`) / **Ink Soft** (`#1a1a1a`): all primary text and the dark button fill.
- **Mute** (`#6b6d72`) / **Mute 2** (`#9a9da3`): secondary copy and placeholders.
- **Rule 08** (`rgba(13,13,13,0.07)`) / **Rule 16** (`rgba(13,13,13,0.14)`): every hairline in the system.
- **Glass** (`rgba(255,255,255,0.88)`): sticky nav and floating pills, always with `backdrop-filter: blur(20px)`.
- **Mesh Ink** (`rgba(40,50,60,0.14)`) / **Mesh Dot** (`rgba(40,50,60,0.28)`): the drawn grid strokes and their nodes.

### Named Rules
**The One Live Signal Rule.** Lime marks action and liveness, nothing else. A screen with lime in three roles has no action colour left.

**The Neutral Ballot Rule.** No party, candidate, or aspirant is ever assigned a distinguishing colour, order, or emphasis. Results are differentiated by figures and typographic weight alone. This is a product commitment, not a stylistic preference.

**The Warm Ground Rule.** Pure white is a card surface. The page ground is always paper.

## Typography

**Display Font:** Public Sans (with `system-ui`, `-apple-system`, "Segoe UI", sans-serif)
**Body Font:** Public Sans — same family, working at lower weights
**Label/Mono Font:** IBM Plex Mono (with `ui-monospace`, "SF Mono", Menlo, monospace)

**Character:** A single grotesque doing two very different jobs — set at 900 with negative tracking it is blunt and physical; at 400–500 it disappears and lets the content read. The monospace never carries prose. It exists to make labels and figures look measured: wide-tracked uppercase for annotations, tabular numerals for anything countable. Body copy runs `font-feature-settings: "ss01", "cv05", "cv11", "tnum" 1`.

### Hierarchy
- **Display** (900, `clamp(48px, 6vw, 84px)`, line-height 0.94, tracking `-0.045em`): page headlines only, capped at ~1000px measure. Takes the hand-drawn accent underline.
- **Headline** (900, 30px, line-height 38px, tracking `-0.7px`): native screen headings.
- **Title** (800, 24px, line-height 1, tracking `-0.035em`): the wordmark and section titles.
- **Lede** (400, 17.5px, line-height 1.6, colour Mute): the sentence under a display headline, capped at 640px.
- **Body** (500, 14px, line-height 1.65): running copy, nav links, buttons.
- **Label** (mono, 600, 11px, tracking `0.22em`, uppercase, colour Copper): eyebrows and column titles.
- **Meta** (mono, 500, 10.5px, tracking `0.06em`–`0.18em`, uppercase, colour Mute): disclaimer strip, phone captions, footer coordinates, status chips.

### Named Rules
**The Mono-Is-Not-Prose Rule.** IBM Plex Mono is for labels, figures, coordinates, and status — never a sentence.

**The Tight Display Rule.** Display type is always negative-tracked and set below 1.0 line-height. Loose display type is off-system.

**The Tabular Figure Rule.** Any number a reader might compare — vote counts, percentages, station IDs, times — is tabular.

> **Implementation note.** The type system of record is Public Sans + IBM Plex Mono, as defined in `claude-design/src/perk.css` and mirrored in `src/ui`. The Expo app currently ships `SpaceMono-Regular`, `Inter-Medium`, and platform defaults instead; those are drift from this record, not an alternative branch of it.

## Layout

A centred 1280px maximum content width with 32px gutters, opening on 72px of top padding for page headers and settling to 40px grid gaps. The footer runs a `1.5fr 1fr 1fr 1fr` column grid. Prototype pages present mobile work inside 320×660 phone frames laid out in wrapping rows with 28px gaps and a mono caption beneath each — mobile screens are displayed *as artifacts on the page*, not as a separate site.

The page shell isolates a stacking context: a `paper-bg` layer paints the ruled grid and radial ground gradient, a `mesh-layer` holds the drawn patches, and all content sits above both. Density is generous vertically and disciplined horizontally; text measures are capped (1000px display, 640px lede, 320px footer blurb) rather than filling the container.

## Elevation & Depth

The system is flat by conviction. Depth is carried by tonal steps (paper → surface → card), hairline rules, and blur — not by shadow. Cards are white with a 1px `rule-08` border and no shadow at all. The sticky nav and floating pills use `glass` with `backdrop-filter: blur(20px)`, so depth reads as *translucency over drawn paper* rather than as a lifted plane.

### Shadow Vocabulary
- **Device frame** (`0 0 0 1px rgba(0,0,0,0.08), 0 24px 60px rgba(13,13,13,0.16), 0 8px 24px rgba(13,13,13,0.08)`): the phone mockups on prototype pages. This is the *only* place a real shadow appears.

### Named Rules
**The No-Shadow-On-Surface Rule.** Product surfaces get borders and tone, never shadows. If something needs separating, use a hairline or a tonal step.

## Shapes

Two radii do nearly all the work: fully-round pills (`999px`) for anything actionable or status-bearing — buttons, nav links, chips, the screen switcher — and an 18px radius for card surfaces. Native input fields use 14px with a 1.5px ink border, which reads heavier and more deliberate than the web's hairline. Phone frames use 48px outer / 36px screen.

Borders are the primary separator: 1px `rule-08` for structure, `rule-16` for interactive outlines, and a full-weight ink border when a field or button is emphasised. Nothing is clipped or angled; the only irregular geometry in the system is drawn, not cut — the mesh patches, the county boundaries, and the marker underline.

## Components

### Buttons
- **Shape:** fully round (`999px`), 13px × 22px padding; large variant 16px × 26px at 15px type.
- **Lime (primary):** lime fill, lime-ink text, weight 700, arrow glyph at 16px. Hover swaps to Lime Deep.
- **Ink:** ink fill, paper text — the dark counterpart used where lime would be too loud.
- **Ghost (default):** transparent with a `rule-16` border and ink text; hover fills Surface and darkens the border to Ink.
- **Transition:** `background 140ms ease, border-color 140ms ease`.

### Chips & Status Pills
- Glass or Surface fill, fully round, mono uppercase at 10.5px with `0.16em` tracking, Mute text. Used for map annotations (`KENYA · 47 COUNTIES`), step counters (`STOP 9 / 12`), and the screen switcher, whose current item inverts to ink-on-paper.

### Cards / Containers
- White (`card`) on paper ground, 18px radius, 1px `rule-08` border, no shadow, 24px internal padding.

### Inputs / Fields
- Card fill with a full-weight border and 14px radius; a Surface-filled prefix cell (country code, icon) divided by a `rule-16` hairline; 16px vertical padding, 16px value type at weight 600. The label above is always mono, uppercase, copper.

### Navigation
- Sticky glass bar with `blur(20px)` and a `rule-08` bottom border, 20px × 32px padding, 32px gap. The wordmark sets at 24px/800 with a red period appended via `::after`, and a mono tagline beneath at 9.5px / `0.18em`. Links are pill-shaped, 14px/500, hover-filling Surface.

### Disclaimer Strip
The signature component. A full-width bar *above* the nav, mono uppercase at 10.5px in Copper Deep on translucent paper, with a bottom hairline: `● CITIZEN TALLY · NOT AN IEBC SYSTEM` on the left, provenance (`OPEN SOURCE · MIT · github.com/…`) on the right. It is permanent chrome, not a dismissible banner.

### Drawn Mesh & Atlas
SVG patches stroked in `mesh-ink` at 1px with round joins and `mesh-dot` nodes, revealed by animating `stroke-dashoffset` from `var(--len)` to 0 over 1100ms on `cubic-bezier(0.22, 0.61, 0.36, 1)` with per-patch `--delay`, opacity easing in over 600ms. The county atlas draws all 47 boundaries with the same sketched fade and zooms county to county — the same motion the results map uses when a region finishes reporting. Every drawn element has a `prefers-reduced-motion: reduce` branch that snaps to the drawn state.

### Marker Underline
An inline-block accent span with an SVG stroke in the `::after`, 0.22em tall, bleeding 0.04em past each edge — a hand-swiped highlighter under the operative words of a display headline. Green by default, red via `.accent--red`.

## Do's and Don'ts

### Do:
- **Do** ground pages in Paper (`#f7f6f3`) and reserve white for cards.
- **Do** keep lime to a single role per screen — the primary action.
- **Do** set every eyebrow and micro-label in IBM Plex Mono, uppercase, `0.18em`–`0.22em` tracking, in Copper.
- **Do** track display type in to `-0.045em` at weight 900 and let it sit below 1.0 line-height.
- **Do** separate surfaces with hairlines (`rule-08`, `rule-16`) and tonal steps.
- **Do** give every drawn or animated element a `prefers-reduced-motion: reduce` branch.
- **Do** keep the "Not an IEBC system" strip present as permanent chrome.
- **Do** use tabular numerals for anything a reader might compare.
- **Do** use `140ms ease` for hover states and `cubic-bezier(0.22, 0.61, 0.36, 1)` for drawn reveals.

### Don't:
- **Don't** give any party or aspirant its own colour, its own position in a list, or extra visual weight. Colour that identifies a party makes the eye rank candidates before it reads the figures. There is deliberately no party-colour map in the codebase.
- **Don't** put shadows on product surfaces; the phone frame is the sole exception.
- **Don't** set prose in the monospace, or labels in the sans.
- **Don't** introduce a second accent hue to compete with lime.
- **Don't** use pure white as a page background.
- **Don't** substitute another typeface for Public Sans or IBM Plex Mono.
- **Don't** render the mesh as flat decoration — it draws itself in, or it is not the mesh.
