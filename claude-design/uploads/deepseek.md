# Kura Zetu — Design Evaluation

**Document reviewed:** *KuraZetu — Redesign Canvas (print).pdf*, 52 pages, A3 landscape.  
**Date:** May 2026  
**Design direction:** "Ramani" — map-first, forest-on-sand palette, two PinVerify variants offered (A: snap-to-known / B: consensus-first).

---

## 1. Per-Screen Critique

### Brand / Ramani (pp. 1–5)

**What works:** The core metaphor — "the country IS the dashboard" — is the right instinct for a civic-tally tool. The IS/IS NOT table on the country map page (slide 4) is the most honest and trust-building artifact in the deck. Showing "No data 10" counties alongside leading counties is truthful and resists the temptation to decorate.

**What fails:**
- **47-hex county abstraction.** Treating every county as an equal hex is electorally misleading. Nairobi (~3 million voters) and Lamu (~140,000 voters) are visually equivalent. This will be used in newsrooms and shared on WhatsApp; someone WILL read the hex map as "who's winning geographically" and draw false conclusions. This is a partisan-risk vector.
- **"Curious, exploratory" as voice direction.** This is the wrong register for a tool used by people who may fear reprisal for photographing a public document. "Calm, factual, transparent" should replace it.
- **Forest background.** A dark, moody app background signals "hidden" or "opaque," the opposite of what transparency infrastructure should project. On a low-tier Android LCD screen under Kenyan noon sun, dark backgrounds wash to grey mud. Light-background-with-dark-text is the safer outdoor default. If dark mode is offered, it should be a secondary mode, not the primary identity.
- **Candidate names in mockups** (Longoggy, Uhuru, Raila). These map transparently to real Kenyan political figures. That the same candidate "wins" in every mockup slide looks like editorializing even if unintentional. Use fully fictional names (e.g., "Mwangi K." / "Achieng P." / "Hassan A.") and vary the leader across slides.

### Design System (pp. 6–10)

**Works:** Public Sans + IBM Plex Mono pairing is the single best decision in the deck — free for commercial use, Latin Extended coverage, strong tabular figures. The four verification states with "color + glyph, never color alone" commitment is correct.

**Fails:**
- **Only 2 candidate tokens defined** (`--kz-cand-1`, `--kz-cand-2`) but mockups show 5 candidates. Token set is incomplete.
- **13px caption and code text.** This is a WCAG 2.2 AA fail on mobile. Minimum readable body-adjacent text for low-DPI screens in outdoor use is 14–15px. At 13px, polling station codes will be illegible on a Tecno POP or itel under direct light.
- **No line-heights.** "17px Subhead" means nothing without a line-height. Same for all sizes. An engineer cannot implement this.
- **No spacing scale, no radius tokens, no elevation tokens, no motion tokens.** The spec claims "Tokens implemented in src/tokens.css — apply to Tailwind" but without spacing and radius scales, a Tailwind config can't be generated. This is architecture fiction, not a handoff.
- **No semantic color tokens for states.** "Verification states" defines four states conceptually but no hex values, contrast ratios, or light/dark variants.

### Onboarding + Signup (pp. 11–17)

**Works:** Language pick is first — correct. IS/IS NOT disclaimer is structured, scannable, and uses a two-column comparator rather than a wall of text. "Skip — browse tallies" on the phone screen lets lurkers observe without committing — this is functionally essential and politically smart. OTP + optional biometric avoids password burden.

**Fails:**
- **"Your phone. Your polling station. Your verified Form 34A."** (Slide "One Promise"). This reads like a Kickstarter pitch. Replace with something closer to the plainspoken "Why we ask" copy used in the Form 34A location screen — that copy is excellent.
- **"✓ IS" and "× IS NOT"** in the disclaimer. The × symbol is the universal "error/wrong/cancel" glyph. Using it as a section header conflates "what the product isn't" with "this thing is broken." Use a neutral separation like "IS" / "IS NOT" without symbols, or a simple rule.
- **"Hashed. Never shared."** (Data & Privacy). "Hashed" is jargon. Say "Encrypted so only you can access it" or similar.
- **No fallback for missing fingerprint hardware.** Many low-tier Androids lack fingerprint sensors. What replaces the biometric opt-in on those devices?
- **No offline signup flow.** A user in a rural area with no connectivity at the moment of download cannot sign up. This is the first interaction for many users — it must tolerate zero connectivity.
- **Account recovery not shown.** Phone-number-only auth means: lose your SIM, lose your account. Is there a recovery code? Backup phrase? Trusted contact? Nothing in the deck.

### PinVerify — Direction A (pp. 18–22)

**What works:** Search-by-name without requiring station codes is correct — most Kenyans know their polling station as "Likii Primary," not as "031164082006901." The "wrong place? let us know" escape hatch is well placed.

**What fails, and fails dangerously:**
- **"MAMBO WANJIKU! +84 pts."** Gamification of election infrastructure is a design error. Points create speed-over-accuracy incentives. Leaderboards (shown on web, p. 44, "TOP VERIFIERS") create competition where the product needs deliberation. This is the single most dangerous choice in the deck. A user chasing points will confirm pins without visiting the station. The integrity cost is enormous.
- **Walk-to-entrance gating (20m).** GPS accuracy on a Tecno Spark or itel A-series in rural Laikipia is routinely 10–30m CEP. A 20m gate will lock out legitimate verifiers. Worse: approaching a polling station entrance on the day after voting — when party agents, security, or crowds may still be present — could be physically unsafe. The design forces a person toward a potentially tense location.
- **Hold-to-confirm (2 seconds).** This is a discoverability failure. Nothing in the preceding screens teaches the long-press pattern. A user arriving at this screen under stress will tap, get no response, and abandon. The "Holding · 1.2s" progress indicator helps only if they discover the gesture first.

**Verdict:** Ship Direction B. Archive Direction A entirely. Do not hybridize them. A's gamification and physical-gating patterns are incompatible with the use context.

### PinVerify — Direction B (pp. 23–26)

**Works:** Consensus-first is the honest approach. "11 verifiers, ±18m spread, 98% agree" is scannable and lets the community data speak. Drag-to-disagree with structured reasons (Wrong building, Wrong school, Different stream, Renamed station) is the best UX in the entire deck — fast, specific, easy to analyze in aggregate. Two-cluster dispute visualization (p. 26) correctly models the "two streams share a compound" problem that is common in Kenya.

**Fails:**
- **"Drag the green pin."** Which Kenyan political party uses green? If the pin color overlaps with a party identity, this undermines non-partisan credibility. Use a neutral marker color (grey, dark blue, monochrome) — not a color that appears on any party's branding.
- **50m dispute threshold.** Is this the right number? A large school compound (e.g., a secondary school hosting multiple streams) can span 100m+. Premature dispute creation wastes verifier effort.
- **Relies on satellite literacy.** The web version shows a satellite/map toggle. On mobile (small screen), interpreting satellite imagery of a rural school requires visual literacy the design assumes. Offer a "what am I looking at?" orientation overlay for first-time satellite viewers.
- **"+10 pts" and "+25" persist here too.** Same gamification concern, though less central than in A.

### Form 34A Capture (pp. 27–33)

**Works:** Location-before-camera is enforced (Step 1 of 4). The "Why we ask" rationale screen is calm, transparent, and builds trust — best copy in the deck. Blur detection with "Use it anyway" escape respects user agency. OCR confidence display with "OCR unsure · please check" on low-confidence fields is exactly right. Data cost estimate (KES 1.20) is brilliant, practical, and specific to the Kenyan context. Offline queue screen with "Tip: walk a few metres toward a road or window" shows genuine local knowledge. Receipt hash and "THIS IS NOT IEBC" footer are solid.

**Fails:**
- **2.6 MB upload** on a 2G connection is 3–4 minutes of transmission time, costing data. Is image compression/resizing applied before queueing? The design doesn't specify. At minimum, offer a "compress before upload" toggle or reduce resolution to ~1024px wide before queueing.
- **"Don't close the app"** instruction (offline screen) acknowledges a real limitation: Android kills background processes aggressively on low-RAM devices. But it's also a UX promise you can't keep. The copy should say "If you close the app, your submission stays saved — reopen when you have signal."
- **Multi-page forms beyond 2 pages.** Form 34A can have 3+ pages for stations with many candidates. The "+ Add page" button exists but the capture flow always says "Page 1 of 2." What happens when a user needs to capture 3, 4, 5 pages?
- **No double-confirm on submit.** Submitting a Form 34A is a permanent, public, irreversible action. A single "Submit" tap — even after review — is insufficient. Require a secondary confirm (checkbox + button, or hold-to-submit, or "type YES to publish").
- **QR code** mentioned in requirements, absent from receipt mockup.
- **"OCR · 0.94"** — a confidence score as decimal is meaningless to most users. Show "High confidence ✓" / "Low confidence — double-check" in plain language, with the decimal as optional detail.

### Results — Mobile (pp. 34–38)

**Works:** Race-type tabs (President/Governor/Senator/Woman Rep/MP/MCA) cover Kenya's multi-race ballot. "Showing stale data" with "No spinner — we'll just refresh" is the right philosophy for intermittent connectivity. Community Notes with weighted ranking, reason categories, and hidden low-weight notes is well-structured against harassment.

**Fails:**
- **Unofficial-data disclaimer is NOT screenshot-resilient.** "CITIZEN TALLY · NOT IEBC" lives in the status bar chrome. Every phone screenshot crops easily. The requirement says "designed so it cannot be cropped from a screenshot." The current approach fails this. The disclaimer must appear as a watermark or inline element within the data area itself — embedded in the scrollable content, repeated at intervals, so cropping one instance leaves others visible.
- **47-hex map** on a small mobile screen: tap targets will be sub-20px on a 360dp-wide Android screen. Impossible to tap accurately. Needs a list-based county selector as primary navigation with the hex map as a visual overview, not the primary interaction surface.
- **"Live · 4 min ago"** — "Live" is misleading when data refreshes intermittently. Say "Updated 4 min ago" or "Latest tally."
- **No "no data" station view.** A station with zero submissions — what does the user see? Empty state not shown.

### Results — Web (pp. 39–41)

**Works:** Richer layout with activity feed, verification trail, trending notes sidebar is appropriate for desktop. The station detail page (p. 41) is information-dense but well-organized.

**Fails:**
- **No web offline/stale state.** The mobile version has detailed offline handling; the web version has none. A user on a flaky Kenyan broadband connection loading the dashboard should see the same stale-data treatment.
- **"Powered by Kiongozi."** What is Kiongozi? If it's an internal codename, don't expose it publicly without explanation. If it's a third-party dependency, users need to know what they're trusting.

### Landing Page (pp. 42–43)

**Works:** IS/IS NOT table expanded to 5 aspects is thorough. "How it works" 4-step is clear. Trust section (open source, hashed receipts, community-verified, independent audit, no partisan ties) addresses every trust objection a skeptical user might have.

**Fails:**
- **Embedded live map on landing page.** A live-updating hex map on the homepage will be the heaviest element on the page. On 3G, this will delay Time-to-Interactive beyond the 5-second budget. Load a static image or a lightweight SVG on first paint; upgrade to interactive map on hydration or user scroll.
- **"Get the app" button prominence** relative to "See live results." The primary CTA should be "See live results" — the product is useful before you install anything.

### Web — PinVerify (pp. 44+)

**Works:** Replaces the previous purple-gradient gamified page (the deck explicitly acknowledges this was a problem). Coverage map, top verifiers, active verification with satellite/map toggle — all reasonable.

**Fails:**
- **"Same game, dressed as civic infrastructure."** The word "game" appears in the designer's own annotations. This reveals a framing problem. PinVerify is not a game. It's geospatial verification of electoral infrastructure. The annotation itself is a red flag that gamification thinking hasn't been fully rooted out.
- **Leaderboard** ("TOP VERIFIERS · THIS WEEK" with point totals) is public, competitive, and creates a reputation economy around verification volume rather than accuracy. One malicious verifier with high point total has social proof to corrupt the system.

---

## 2. Design System Audit

| Token category | Status | Gap |
|---|---|---|
| Color palette | Forest/Sand/Candidate tokens | Only 2 of 3+ candidate tokens defined; no hex values, no contrast ratios, no dark mode variants |
| Typography | Public Sans + IBM Plex Mono | No line-heights; 13px caption violates AA on mobile |
| Spacing | Not defined | No scale. Tailwind config cannot be generated |
| Radius | Not defined | No tokens |
| Elevation/Shadow | Not defined | No tokens |
| Motion | Not defined | No duration/easing tokens; no reduced-motion specification |
| Iconography | lucide-react-native mentioned in stack | Not in design system doc |
| Verification states | 4 states named | No colors assigned to states |
| Component states | Buttons, inputs shown | No loading, disabled, focused, pressed states |
| Grid/Breakpoints | Not defined | Web responsive breakpoints missing |
| Dark mode | Not shown | No screens, no tokens |

**Verdict:** This is a design *direction* document, not a design *system*. An engineer cannot generate a Tailwind config or a React Native token file from what's here. The claim "Tokens implemented in src/tokens.css" is contradicted by the absence of spacing, radius, elevation, and motion tokens. This needs 2–3 days of filling gaps before implementation can start.

**Political color concern:** Forest green. Kenya's national flag includes green. While green isn't exclusively tied to one party, the Jubilee Party's branding has used green in some cycles, and environmental/green associations in Kenyan politics exist. A dark forest green is probably safe, but this should be explicitly reviewed by someone with current Kenyan political-color literacy. I lack certainty here — can you confirm that this particular shade of forest green reads as neutral in 2027 Kenyan political context?

---

## 3. Flow Rigor Scorecard

| Flow | Happy path | Error states | Empty states | First-run | Offline | Permission denied | Destructive confirm |
|---|---|---|---|---|---|---|---|
| Signup/login | ✓ | Partial (OTP expiry only) | — | ✓ | ✗ | ✗ | — |
| Onboarding | ✓ | ✗ | — | ✓ | ✗ | ✗ | — |
| PinVerify A/B | ✓ | Partial | Partial | Partial | ✗ | ✗ | Partial |
| Form 34A capture | ✓ | ✓ (blur) | — | ✓ | ✓ | ✗ | ✗ |
| Results dashboard | ✓ | Partial | ✗ | Partial | ✓ (mobile) ✗ (web) | — | — |
| Community Notes | ✓ | ✗ | ✗ | Partial | ✗ | — | Partial |
| Settings/Profile | ✗ | — | — | — | — | — | — |
| About | ✗ | — | — | — | — | — | — |
| Language switching | ✗ | — | — | — | — | — | — |
| Account recovery | ✗ | — | — | — | — | — | — |
| Push notifications | ✗ | — | — | — | — | ✗ | — |

**Missing flows entirely:** Account recovery (lost phone/SIM), settings/profile, about/why-this-exists, language switching post-onboarding, push notification preferences, dark mode for any flow, logout/account deletion, multi-device sync (promised in Data & Privacy copy, never shown).

---

## 4. PinVerify Scrutiny

**Direction B > Direction A. Ship B. Bury A.**

Direction B's consensus-first approach is defensibly accurate because it:
- Shows you the community's answer before asking for yours (reduces anchoring bias)
- Requires an explicit "I disagree" action with a structured reason (creates friction against casual dissent)
- Has a clear dispute mechanism (≥50m triggers tie-breaking)

**Specific changes needed for Direction B:**

1. **Remove all point values.** Replace "+10 pts", "+15", "+25" with "Confirm", "Correct", "Resolve in person" — no numbers.
2. **Remove the leaderboard.** "TOP VERIFIERS" becomes "Recent contributors" with timestamp, not score.
3. **Bump dispute threshold to 75m** or make it configurable per station density. 50m will generate false disputes on large compounds.
4. **Add a non-satellite station identification method.** For users who can't interpret satellite imagery: "Does the entrance face a main road? A football pitch? A church?" — structured questions that help triangulate without visual map literacy.
5. **Add a "can't confirm — skip" path that is equally prominent**, not a secondary link. Half the value of PinVerify is knowing which stations haven't been verified yet; a confident "skip" is useful data.
6. **Neutral pin color.** Verify the green pin doesn't map to any Kenyan party color. Grey/dark blue is safer.

---

## 5. Form 34A Capture Scrutiny

**Location-before-camera:** Enforced ✓ (Step 1 of 4).

**Document overlay:** Mentioned in annotations but not visible in the extracted text. Need to confirm: is the overlay a rectangle that helps users align the form? Is it adaptive to different Form 34A dimensions? Does it include level-detection (tilt warning)?

**Glare/blur:** Blur detection shown. Glare detection — mentioned in requirements — not explicitly addressed in the capture screen. Add: "Too much glare — try moving out of direct sunlight" or "Angle the phone to avoid reflections." Glare is a bigger problem than blur in outdoor Kenyan conditions.

**Multi-page:** "+ Add page" exists but the capture flow always shows "Page 1 of 2." What's the capture experience for page 3, 4, 5? Does the user see "Page 3 of 5" after adding pages? This needs explicit screens.

**OCR confirmation:** Model confidence shown as decimal — replace with plain-language tier. Editable fields — can any field be edited or only low-confidence ones? If all fields are editable, there must be a server-side validation that edited tallies don't exceed registered voter count for that station. This validation isn't shown.

**Offline queue:** Strong UX. One fix: "Don't close the app" should become "If you close the app, reopen it when you have signal — your submission is saved."

**Local receipt:** Hash, timestamp, coordinates, station code, tallies — all present. QR code missing. Add it; it's the fastest way for a second person to verify on their own device.

---

## 6. Dashboard Scrutiny

**Low-connectivity banner (mobile):** Well specified — trigger (network loss), copy ("Showing stale data"), retry ("Try again"), last-refreshed ("14 min ago"). The "No spinner — we'll just refresh" philosophy is the right call for this context. **P0 fix:** Apply the same stale-data treatment to web dashboard.

**Unofficial-data disclaimer:** Fails screenshot resilience. "CITIZEN TALLY · NOT IEBC" in status bar chrome is croppable. **Required fix:** Repeat the disclaimer as a watermark or inline element within the scrollable data area — ideally as a semi-transparent text overlay on the map/tally area that appears in the content layer, not chrome. If someone screenshots the data, the disclaimer must be in that screenshot.

**Information density (mobile):** The 47-hex map on a 360dp-wide screen creates tap targets under 20px — below the 48dp minimum. The hex map must be a visual overview, not the primary drill-down interaction. Add a search field and a county list as the primary navigation path. This also serves screen-reader users.

**Information density (web):** Appropriate. The sidebar activity feed and trending notes are useful without overwhelming.

---

## 7. Accessibility Audit

**Contrast failures I can identify from text alone:**
- 13px text (caption/code) on what is likely a dark forest background. Without exact hex values I can't compute ratios, but the combination of dark bg + small text + outdoor use is a triple threat to readability.

**Tap-target failures:**
- Hex map counties on mobile: well below 48dp.
- "Hold to confirm" button: needs to be a large, obvious target.

**Color-only signaling risks:**
- Candidate mapping on hex map: if cand-1/cand-2/cand-3 are color-only, this fails WCAG 1.4.1. Need pattern/texture on hexes in addition to color.

**Screen-reader gaps:**
- No TalkBack/aria-label annotations anywhere in the deck.
- Map-as-navigation is fundamentally inaccessible. No alternative text-based drill-down path shown.
- Form 34A photo: what's the alt text for a photographed document? "Form 34A, Likii Primary School, Stream 1" — needs to be specified.

**Reduced motion:**
- Not mentioned anywhere. The hold-to-confirm ring animation, drag-to-disagree pin movement, and page transitions all need `prefers-reduced-motion` alternatives.

**Dynamic type:**
- No specification for how layouts respond to larger system font sizes. Kiswahili text is 15–30% longer than English — if the user also increases system font size, combined overflow will break layouts. Test with Kiswahili + 150% font scaling.

---

## 8. Voice and Tone

**Problematic copy:**

| Text | Slide | Problem |
|---|---|---|
| "MAMBO WANJIKU! +84 pts" | PinVerify A, Task Hub | Social-media casual. Undermines gravity. |
| "Curious, exploratory" | Brand spec | Wrong register for politically charged context. |
| "+84 pts / +15 pts / +10 pts" | Throughout PinVerify | Gamification language. Creates wrong incentives. |
| "Your phone. Your polling station. Your verified Form 34A." | One Promise onboarding | Reads as motivational marketing, not civic tool. |
| "Same game, dressed as civic infrastructure" | Designer annotation, Web PinVerify | Reveals gamification mindset. |
| "Help us pin the map" | PinVerify A | "Help us" sounds like a startup, not civic infrastructure. |

**Good copy:**

| Text | Slide | Why |
|---|---|---|
| IS/IS NOT table | Onboarding, Landing | Direct, scannable, sets expectations without marketing. |
| "Why we ask" location rationale | Form 34A, Step 1 | Calm, transparent, specific. Best copy in the deck. |
| "Asante. Your tally is now public." | Receipt | Appreciative without being promotional. |
| "We never track you." | Data & Privacy | Simple, clear, addresses the fear directly. |
| "Numbers don't add up" / "Signatures missing" | Community Notes | Factual, specific reason labels. |
| "Tip: walk a few metres toward a road or window" | Offline queue | Practical local knowledge. Respects user intelligence. |

**Recommendation:** Adopt the "Why we ask" tone (Form 34A Step 1) as the product-wide voice. It's factual, transparent, never cute, never alarmist.

---

## 9. Brand Differentiation

**From official government systems:** The dark-background, map-first aesthetic differentiates from typical IEBC or government websites (which skew white/blue/institutional). This is good — nobody should confuse this with an official system. The "NOT IEBC" labeling reinforces this.

**From political party material:** The earthy palette (forest/sand) steers away from recognizable Kenyan party colors, which is the right instinct. I can't confirm with certainty without exact hex values, but the direction appears safe here.

**From generic startup templates:** Less differentiated. The dark mode dashboard with hex maps, rounded cards, and gamified verification reads as "Web3/fintech startup" aesthetic. The product's unique differentiator — *verifiable paper trail as trust infrastructure* — is not visually expressed. The design looks like a dashboard; it should look like evidence.

**What would push it further:**
- Lean into the "receipt" metaphor. Every number has a sha256 hash. Make that visible, not buried. A subtle hash watermark, a "verify this number" action, a visual chain from tally back to source photo.
- Replace rounded-card UI with something that references the materiality of the Form 34A — paper texture, typewriter-style tally presentation, evidence-grid layouts.
- The Kenyan newspaper/election-results-poster aesthetic is more distinctive and culturally resonant than a generic dark SaaS dashboard.

---

## 10. Implementability

**Stack concerns:**

| Design feature | Stack risk |
|---|---|
| 47-hex interactive county map on mobile | `react-native-maps` + custom SVG overlay via `react-native-svg`. 47 interactive polygons on a low-end Android GPU will drop frames. Needs performance testing on a Tecno Spark. |
| Document overlay in camera | `expo-camera` supports overlays, but the rectangular guide frame + tilt/glare detection requires significant custom work. No library in the listed stack handles glare detection. |
| On-device OCR for offline use | No OCR library in the stack. Tesseract.js is ~30MB; Google ML Kit requires Play Services. Offline OCR is the hardest architectural problem in the product. If OCR is server-side, the offline claim is false. |
| Background sync of queued submissions | `expo-background-fetch` is unreliable on Chinese OEM Android (Tecno, itel, Infinix — dominant in Kenya). The "don't close the app" copy acknowledges this. The promise "will sync even if screen is locked" cannot be reliably delivered. |
| 200KB JS budget | `react-native-maps`, `react-native-reanimated`, `react-native-gifted-charts`, `expo-camera`, `expo-location`, `@react-native-community/netinfo` combined exceed 200KB before any app code. Budget is aspirational, not achievable with the listed dependencies. |
| 2.6 MB photo upload on 2G | No client-side compression specified. Must implement `expo-image-manipulator` to resize to ~1024px before queueing. Otherwise, uploads will fail or cost users real money in data. |

**What needs an architecture decision before design can be finalized:**
1. OCR strategy: on-device, server-side, or hybrid (pre-process on-device, confirm server-side)?
2. Background sync reliability: is it acceptable to say "keep app open until synced" or does the product require true background upload?
3. Image compression: what resolution and format are photos reduced to before queueing?

---

## 11. Prioritized Punch List

### P0 — Must change before ship (usability and trust)

1. **Remove all gamification.** Delete point values, leaderboards, "Mambo Wanjiku," and competitive framing from both PinVerify directions, the web verifier page, and the task hub. Replace with neutral completion language: "Station confirmed," "Thank you," no scores.
2. **Make disclaimer screenshot-resilient.** Embed "CITIZEN TALLY · NOT IEBC" as a repeating inline watermark within the scrollable data area on every dashboard view, not just in status bar chrome.
3. **Ship PinVerify Direction B. Archive Direction A.** Do not merge them. Remove point values from B as well. Add non-satellite station identification method.
4. **Add an alternative text-based navigation path for screen-reader users and users who can't interact with the hex map.** County/constituency/ward list with search, parallel to the map.
5. **Define offline signup.** A user with no connectivity at first launch must be able to proceed (anonymous browsing + deferred verification).
6. **Add account recovery flow.** Lost SIM = lost account is unacceptable. Recovery phrase, trusted contact, or backup code.
7. **Add location-permission-denied handling for Form 34A capture.** What happens when the rationale screen is shown and the user still taps "Deny"? Can they manually select a station and proceed without GPS?
8. **Add double-confirm to Form 34A submission.** Permanent public action requires explicit secondary confirmation.

### P1 — Should change before ship (completeness and accessibility)

1. **Complete design system tokens.** Add line-heights, spacing scale (4px base), radius tokens, elevation/shadows, motion durations/easing, dark mode variants, breakpoints.
2. **Add reduced-motion specifications.** `prefers-reduced-motion` alternatives for every animation.
3. **Add TalkBack/aria-label annotations to all interactive elements and data displays.**
4. **Add dark mode screens for all flows.**
5. **Add settings/profile/about screens.** Not shown at all.
6. **Add web offline/stale state** matching mobile treatment.
7. **Show multi-page capture (3+ pages)** for Form 34A.
8. **Design empty states** for: station with no submissions, Community Notes with no notes, PinVerify with no stations nearby, search with no results.
9. **Design error states** for: fetch failure, upload failure, OCR complete failure, GPS timeout, SMS never arrives.
10. **Validate 20m GPS gate** (if any remnant of A is kept) against real-world accuracy on $80 Kenyan Android phones. Likely needs to be 40–50m minimum.
11. **Add QR code to Form 34A receipt.**
12. **Add client-side image compression spec** (resolution target, format) before queueing.

### P2 — Nice to have

1. **Explore light-background default** with dark mode as option — better outdoor readability.
2. **Design push notification preferences** (what events trigger notifications, frequency caps).
3. **Design language switching** post-onboarding (currently only at onboarding).
4. **Replace "Live" with "Updated X ago"** — more honest for intermittent data.
5. **Rename "forest" and "sand" tokens** to semantic names (`--kz-surface-primary`, `--kz-surface-highlight`) to avoid nature-metaphor confusion in code.
6. **Add animation specs** for page transitions, loading states, success confirmations.
7. **Test all screens with Kiswahili copy at 150% system font scale** and fix layouts that break.
8. **Verify the green pin color against all major Kenyan party colors** and switch to neutral grey/blue if any overlap exists.

---

## 12. What I Would NOT Change

- **Public Sans + IBM Plex Mono.** The single best decision in the deck. Don't touch it.
- **Location-before-camera enforcement.** Correct order. The rationale copy that accompanies it is the product's best writing.
- **The IS/IS NOT table in onboarding and landing page.** This is the most effective trust mechanism in the entire design. It answers the first question every skeptical user has. Expand it if anything, never reduce it.
- **Community Notes with weighted ranking and auto-hidden low-weight notes.** Well-structured against harassment while preserving the ability to flag issues. The reason categories are specific and actionable.
- **Offline queue UX with data-cost estimate.** KES 1.20 is the kind of detail that signals "this was designed for me." Keep it.
- **"No spinner — we'll just refresh" philosophy.** Correct for intermittent connectivity. Spinners on slow connections cause rage-abandons.
- **Sha256 hash on every receipt.** Verifiable proof is the product's core differentiator from "trust us" platforms.
- **"Skip — browse tallies" on signup.** Lowers barrier to entry. Lets skeptical users observe before committing.
- **OTP + optional biometric, no passwords.** Right for the device and literacy context.
- **PinVerify Direction B's consensus-first approach.** This is the defensible model. The structured disagreement reasons are excellent.
- **The four-step "How it works" on the landing page.** Clear, scannable, honest.
- **"OCR unsure · please check"** on low-confidence fields. Respects user intelligence while flagging potential errors.

---

## Verdict

**Rework-required.**

The deck contains the bones of a trustworthy product — the IS/IS NOT table, location-first capture, Community Notes structure, offline queueing, and the Public Sans + Plex Mono pairing are all correct decisions. But the product is not ship-ready for three systemic reasons:

1. **Gamification compromises integrity.** Points, leaderboards, and competitive framing around election verification create perverse incentives that undermine the product's core trust proposition. This must be stripped entirely — not toned down, removed.

2. **The design system is a sketch, not a handoff.** Without line-heights, spacing, radius, elevation, motion, dark mode, and state tokens, an engineer cannot implement what's proposed. The claim that tokens exist in `src/tokens.css` is contradicted by the deck's contents.

3. **Critical flows are missing.** Account recovery, permission-denied states, offline signup, empty states, and settings/profile don't exist. The disclaimer isn't screenshot-resilient. Screen-reader navigation isn't addressed. These aren't polish — they're functional requirements for the use context described.

The P0 list above is ~2 weeks of design work. After that, the product could ship to a closed beta. The direction is salvageable — the foundation is honest — but in its current state, shipping this to a rural Kenyan user at 9pm on election night would fail them.
