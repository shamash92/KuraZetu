# Kura Zetu — Redesign Canvas Evaluation

Source: `KuraZetu — Redesign Canvas (print).pdf` (52 pages, May 2026).

---

## 1. Per-screen critique

**Cover · Redesign canvas / Section title cards (1, 2, 7, 12, 19, 27, 34, 41, 46, 49).** Confident, restrained, no AI-template smell. The bilingual "Ramani" framing is right for Kenya. Type is the brand — that's a defensible call. Keep them.

**Brand · Chosen (Ramani spec) / Country map (4) / County drill (5) / Station detail (6).** "Map-first. The country IS the dashboard" is the strongest idea in the deck. The 47-hex country abstraction is distinctive, readable on small screens, and avoids choropleth noise on low-DPI Android. Concerns: the hex-grid map uses three candidate colors (orange-coral, sage-green, mustard-yellow) that read as a *political map*. **Sage-green is uncomfortably close to ODM's green family and NARC-Kenya's leaf-green.** Orange-coral is fine but in 2022 was associated with Azimio-adjacent branding. Mustard-yellow has been used by UDA-adjacent material. None are bullseyes, but the cluster of three together will be *read* as partisan even when the labels are fictional ("Longoggy", "Uhuru", "Raila"). Recommendation: shift to a candidate-neutral palette that explicitly does *not* echo any current party — e.g. teal / amber / clay / slate — and reserve the current set for *non-political* ramp uses (verification states). Trade-off: you lose some of the "earthy Kenyan" warmth; you gain defensibility.

**Type scale (8).** Public Sans + IBM Plex Mono is a defensible pairing — both free, both have tabular figures, Plex Mono has strong glyph support. **However: the body sample "Ñandu njema · diacritics safi · Äö" is not idiomatic Kiswahili.** It looks like a glyph-test string dressed as language. Replace with a real Kiswahili body sentence so reviewers can judge the actual reading rhythm. Display sizes are sensible for mobile. 13px caption is the floor — verify against dynamic type (Android font scaling 1.3×–2.0×) — not tested anywhere in the deck.

**Color · Ramani / Tokens (9).** Tokens are namespaced (`--kz-bg`, `--kz-ink`, `--kz-cand-1…3`) which is exactly right for the Tailwind ↔ RN JSON bridge described on slide 7. But the token sheet is **cut off** at "Candidate 2 — `--kz-cand-2`" — there is no visible spec for semantic tokens (success / warning / danger / info), focus rings, disabled states, divider/border tokens, surface elevation tokens, or motion tokens. That's a gap, not a stylistic choice. An engineer cannot build from this as shown.

**Verification states (10).** "Four states, never ambiguous · Color + glyph. Never color alone" is exactly correct policy. UNVERIFIED / COMMUNITY-VERIFIED / DISPUTED / FLAGGED is the right taxonomy. However, the chips rely on a thin colored label tag — **no glyph is visibly attached to the chip in the artwork**, despite the rule stating "color + glyph." Either the glyph treatment is missing from the spec or it's there but invisible at print size; either way, ship the glyph variant.

**Components (11).** Buttons (Primary / Accent / Ghost / Danger) are clean. Concern: **Primary is sand-on-dark, Accent is coral, Danger is red**. Primary and Accent will be read as equal-weight CTAs by many users — Primary should be visually unambiguously the default action. The "I understand — continue" button on slide 14 uses sand-primary and is right; "Send code" on slide 16 uses coral and works because it's the only CTA. Document when each is used or you'll get drift.
The "Likii Primary School / ✓ VERIFIED" row at the bottom of the components slide uses a green tag — fine, but the tag relies on color alone in print; add a glyph.

**Language pick (13).** Good. Bilingual side-by-side. Note: "Karibu. Welcome." typography stacks the two languages but with **no visual distinction between them** — a sighted user reads them as one phrase. Either separate with a thin rule, slightly down-weight the secondary, or give the secondary slightly tighter line-height. Sheng "Tap to request" is a clever inclusion; make sure it's not a dead button at MVP — better to say "Sheng coming — tell us" than to imply it's available.

**One promise (14).** "Your phone. Your polling station. Your verified Form 34A." This is the strongest copy in the deck. The "VERIFIED ✓ sha256: a4f1…" tease in the same card is the right show-don't-tell. Keep.

**The disclaimer (15).** "What Kura Zetu is — and is not." Two-column IS / IS NOT is the most honest moment on the site and a deliberate echo of the README's caution box. The "I understand — continue" button is the right friction. **Concern:** the IS column uses an orange check, the IS NOT column uses an orange X — same color for opposing semantics. Use the system's success-green check and the system's danger-red X, with glyphs. This is the screen that *defines* the product's trust posture and it must not have a color/symbol mismatch.

**Data & privacy (16).** Three plain promises, each with a one-line reassurance in coral. "Hashed. Never shared." / "Coordinates only. Not tracked." / "Stored openly under your station code." This is excellent. **However:** "Stored openly" is ambiguous to a low-literacy user — does it mean *anyone can read my coordinates*? Rephrase: "The photo is public. Your phone number stays private." Add a one-tap "see what gets published" preview so the user knows exactly what becomes public.

**Phone (17) / OTP + biometric (18).** Clean. "+254" prefix locked, "Safaricom, Airtel, and Telkom numbers supported." is the right reassurance. The biometric toggle on the OTP screen is well-placed; defaults to ON which is appropriate for Kenya's Android base. **Wrong number?** inline link is good. **Skip — browse tallies** is critical — preserves anonymous-read access, which the brief required.

**PinVerify · Direction A (20–26):** Task hub (21), Find station (22), Walk to entrance (23), Hold to confirm (24), Consensus + receipt (25). **This is the strongest end-to-end flow in the deck.**
- Task hub gamifies without trivialising — "Mambo Wanjiku! Help us pin the map. 57% of 46,231 stations confirmed." is civic-toned, not Duolingo-toned.
- Search-by-name on Find station with sorted-by-distance and GPS ±6 m is exactly right for low-literacy users who don't know station codes.
- "Walk to entrance" with a 20 m unlock radius and a disabled "Hold to confirm" button until you arrive is *the* anti-fraud mechanism. Concern: 20 m is generous — at a school compound with two streams, two stations are often within 20 m of each other. Either tighten to 10 m in dense compounds or use the streams disambiguator as a follow-up. Also: **what happens if GPS accuracy is ±50 m under a tin roof?** No fallback for poor accuracy. The "GPS ±6 m" chip is shown as confident; the design needs a "GPS poor — try outside" state.
- Hold-to-confirm with haptic feedback (slide 24) is right — `expo-haptics` is already in the stack. 2-second hold is at the upper bound of patience; consider 1.5 s.
- Consensus + receipt (slide 25) — "Your pin · Other contributors · 11" with the small cloud is the right reward. The local receipt with sha + EAT timezone is exactly the kind of trust artefact that survives screenshotting. Keep.

**PinVerify · Direction B (27–31):** Consensus-first / pin-cloud-first. Landing — see the cloud (28), Drag to disagree (29), Two-cluster dispute (30), Trail + receipt (31).
- The "11 verifiers have pinned this station. They agree within a 18 m radius — that's a strong consensus." sentence is the **single best piece of copy in the deck**. It is calm, numeric, and confidence-bearing without being patronising.
- The two-cluster dispute (30) directly addresses the "two streams in one compound" edge case called out in the original brief. "Visit in person to help us break the tie · Resolve in person (+25)" is correct.
- The trail (31) with @njokim / @mwangi.kev / @flo_n / @cher254 is what gives the system its Wikipedia-grade legitimacy.

**Decision:** **Ship Direction A as the default flow for first-time users, and surface Direction B from the station detail page** (the "Verify another station" path). Direction A walks you to the entrance and is fraud-resistant; Direction B is a desk activity. Make this explicit in the spec — right now it reads as A-or-B and the deck doesn't recommend.

**Form 34A capture (33–40).** Why we need location (34), Camera + guides (35), Blur — retake (36), OCR confirm (37), Review + submit (38), Receipt (39), Offline / queued (40).
- **Location-before-camera order is correctly enforced** on slide 34: "Step 1 of 4 · Confirm location" and the body copy "We need to know which station's form this is — before you photograph it." Captured-once / Never-sold / etc. reassurances are correct. The "GPS coordinates are sent **once**, when you press capture" phrasing is excellent for a privacy-anxious user.
- Camera + guides (35): document overlay with corner brackets, "PAGE 1 OF 2 · 12.3 MP", torch toggle top-right, real-time hint "Looks clear. Hold steady for sharper text." This is the right shape. **Missing:** no permission-rationale screen for camera itself, no torch state for night (the icon is there but no night-mode treatment), no glare-detection hint shown (only blur). Add a "There's glare on the upper-right — angle the phone" hint variant.
- Blur — retake (36): "We can't read the tallies. Let's try again." with **Use it anyway / Retake page 1** is the right escape valve. Trust the user.
- OCR confirm (37): editable rows, "WAINAINA, M. · OCR unsure · please check" highlighted in amber is exactly the right pattern. **Concern:** the input cells use a faint outline on a near-black bg — verify ≥3:1 non-text contrast against `--kz-bg`. At print size it looks borderline.
- Review + submit (38): **"Total · Approx data cost KES 1.20 · 2.6 MB"** — this single line is worth the entire redesign. Showing data cost in the local currency before upload is *the* thing the original product was missing. Keep this verbatim.
- Receipt (39): "Asante. Your tally is now public." paper-receipt skeuomorph with QR + sha + permalink is exactly right for a stress context. The "— THIS IS NOT IEBC · CITIZEN TALLY —" baked into the receipt graphic is screenshot-resilient. Strong.
- Offline / queued (40): "Your tally is safe. Don't close the app." with concrete fields (Captured, Network, Next retry, When publishes) and the tip "walk a few metres toward a road or window" is genuinely Kenyan and useful. Keep.

**Results · mobile (42–45).** National (42), Station + race tabs (43), Community Notes (44), Add a note (45), Offline / stale (slide visible later).
- National (42) — hex map + ranked candidate bars. Information density is appropriate. **"Live · 4 min ago · 68.8% reporting"** sub-header is the right shape, but on a low-end phone with stale data the "Live" word is misleading; flip to "Last refreshed 4 min ago" when offline (the offline/stale slide does this correctly).
- Station + race tabs (43): horizontal-scroll tab row for President / Governor / Senator / MP / MCA — this will need a momentum-scroll affordance hint on first run, or first-time users will miss MCA.
- Community Notes (44): the verification-weight model ("weight 0.84", "Hidden by community. Tap to show.") is good. **Concern:** "SUSPECTED FRAUD" as a structured tag is *dangerous copy* on a public, screenshot-able page during a charged election. Re-label the tag to "POSSIBLE IRREGULARITY" or "NUMBERS QUESTIONED" — same meaning, no defamation surface. The free-text body can still describe what the user suspects.
- Add a note (45): structured reasons + "Other (write your own)" is correct. Keep "Numbers don't add up" and "Signatures missing" as named structured reasons. Rename "Suspected fraud" → "Possible irregularity" for the same defamation reason.
- Offline / stale: **"OFFLINE · LAST REFRESH 14 MIN AGO · NOT IEBC"** persistent top strip is correct. "Showing the last numbers we saved 14 minutes ago." is the right copy. **"Background sync is ON. We'll refresh as soon as your network returns."** is exactly the kind of sentence a stressed user needs. This satisfies the brief's mandatory low-connectivity warning requirement — confirmed.

**Web · National dashboard (47).** Clean, dense, reads at a glance. **"CITIZEN TALLY · THIS IS NOT AN IEBC SYSTEM · LIVE · 4 MIN AGO · 68.8% OF 46,231 STATIONS REPORTING"** strip is unmissable and screenshot-resilient. The "VOTE WITHOUT IEBC?" coral panel bottom-right reads ambiguous and slightly inflammatory — rephrase: "Want to see your station's tally?" The phrase "vote without IEBC" can be quote-mined by bad-faith actors. Rewrite.

**Web · Station detail (48).** Excellent. Permalink + Copy link panel right-side is journalism-friendly. Source Form 34A pages displayed inline with Download originals — correct for press use. Verification trail in the right rail is what makes this defensible.

**Web · Landing 1280 (50).** "The count, uploaded by you." is the right hero. 46,231 / 47 / 18,422 / 0.94 stat row is sharp. **Critical issue:** the artboard is **massively truncated** — visible content ends at "READ THIS FIRST" and everything below is blank canvas. The deck does not show the IS / IS NOT table the section intro on slide 49 said this page would keep. Either complete the artboard or annotate the gap explicitly. As shipped, this slide is a placeholder.

**Web · PinVerify Landing — play (51).** "Help us know exactly where each polling station is." with +10 / +15 / +2 point legend, top-verifiers leaderboard, "Start verifying — random stations" / "Or start in my ward" — this **is** the civic-infrastructure framing the section title promised. The leaderboard is the right gamification; it rewards consistent contributors without being childish.

**Web · Active verification (52).** Satellite/Map toggle, prior-pins list with timestamps and accuracy notes (@flo_n Aug 2 exact, @cher Aug 7 10 m off), session progress 3/5, decision panel (Pin is correct +10 / Save my correction +15 / Skip — not sure +2). This is the desktop dual of mobile PinVerify Direction B and the two are coherent. Strong.

---

## 2. Design system audit

- **Color system:** see partisan-color note above. Critical fix. Also missing semantic tokens beyond the four verification states. Add `--kz-success`, `--kz-warning`, `--kz-danger`, `--kz-info`, `--kz-focus-ring`, `--kz-border`, `--kz-overlay`, plus a `--kz-bg-3` for a third surface tier (currently only bg and bg-2 are shown). Document required contrast ratios per token pair.
- **Typography:** pairing is sound. Add weights spec (Regular/Medium/Bold; avoid Light below 17px), tabular-figures opt-in spec for both faces (`font-feature-settings: 'tnum'`), and a Kiswahili line-height adjustment (Kiswahili sentences run longer; raise body line-height from typical 1.5 to 1.55 for body to prevent crammed feel).
- **Iconography:** Lucide is referenced in the mobile stack (`lucide-react-native`). The deck doesn't show the web side of this — confirm Lucide on web too rather than mixing with Heroicons or Material.
- **Spacing / radius / elevation / motion tokens:** **Not specified in this deck.** Slide 7 says "Tokens implemented in src/tokens.css — apply to Tailwind via CSS vars, mirror to RN as a JSON token file" but the actual token sheet stops at colors. An engineer cannot implement consistent spacing or motion from what's shown. Add the missing pages or link to the source.
- **Component coverage:** buttons, inputs, banners, station rows, tag chips are shown. Missing from the deck: toasts, modals, bottom sheets, segmented controls, switches (one is on slide 18 but not specced), tabs (used on slides 4 and 43 but not specced), date/time, skeletons, empty states, error boundaries, snackbars. Specify these or the implementation will diverge.

---

## 3. Flow rigor (happy / error / empty / first-run / offline / permission-denied / destructive confirm)

| Flow | Happy | Error | Empty | First-run | Offline | Perm-denied | Destruct-confirm |
|---|---|---|---|---|---|---|---|
| Signup/login | ✅ (17,18) | ⚠️ "Wrong number?" only — no SMS-fail state | n/a | ✅ (13–16) | ❌ — what if OTP send is offline? | n/a | n/a |
| Onboarding | ✅ (13–16) | n/a | n/a | ✅ | n/a | n/a | n/a |
| PinVerify A | ✅ (21–25) | ⚠️ "Wrong place? Let us know" link only | ⚠️ no "no stations near you" empty | ⚠️ no first-run coaching | ❌ no offline state for pinning | ❌ no location-denied state | n/a |
| PinVerify B | ✅ (28–31) | ✅ dispute (30) | ⚠️ | ⚠️ | ❌ | ❌ | n/a |
| Form 34A | ✅ (34–39) | ✅ blur (36), OCR unsure (37) | n/a | ⚠️ no torch-on-night prompt | ✅ (40) | ❌ no camera-denied state | ❌ no "discard draft" confirm |
| Results | ✅ (42, 47) | ⚠️ no server-error state | ⚠️ no "no submissions yet for this station" | ⚠️ | ✅ (offline/stale) | n/a | n/a |
| Community Notes | ✅ (44, 45) | n/a | ⚠️ no "no notes yet" empty | n/a | ❌ what if note submit is queued? | n/a | ❌ no "delete my note" confirm |

**Material gaps to close before ship:** location-denied and camera-denied states for both PinVerify and Form 34A, draft-discard confirm in Form 34A, and a "no nearby stations" empty state for PinVerify Direction A's Find station screen.

---

## 4. PinVerify scrutiny

- **Defensibly accurate:** yes for Direction A — walk-to-20m + 2-second hold is strong. Tighten radius in dense compounds. Add a GPS-poor fallback.
- **Resistant to accidental drops:** yes — distance gating + hold-to-commit + haptic. Best-in-class for this problem.
- **Crowd consensus:** yes — both A's "Pin confirmed · Other contributors · 11" and B's full cloud, spread, and agree% (98%) are correct.
- **Usable rurally with no street data:** **partially.** The mobile map artwork shows abstract building blocks without street names. Specify offline base tiles (consider MapLibre GL Native + MBTiles bundled or pre-cached vector tiles for the user's county) so the map renders without network. `react-native-maps` defaults to Google tiles which require network and will fail in rural areas. Recommend MapLibre or Mapbox offline — call this out as a stack swap with cost.
- **Two-stream disambiguation:** addressed on slide 30. Good.

---

## 5. Form 34A capture scrutiny

- Location-before-camera order: **confirmed enforced.**
- Document overlay: ✅ corner brackets + page indicator + torch.
- Glare/blur: blur handled (slide 36). Glare not handled — add.
- Multi-page: ✅ page thumbnails on slide 37, "+ Add page" affordance.
- OCR confirmation: ✅ editable, low-confidence cells highlighted.
- Offline queue: ✅ slide 40, with concrete retry/sync copy.
- Local receipt: ✅ slide 39, QR + sha + screenshot-resilient disclaimer.

This is the strongest section of the deck. Ship close to as-is.

---

## 6. Dashboard scrutiny

- Low-connectivity banner: **specified well** on the offline/stale slide. Trigger: `netinfo` offline OR last refresh > N minutes. Copy: "Showing the last numbers we saved 14 minutes ago." Retry: "Try again" CTA + auto-resume on reconnect. Last-refreshed: shown in top strip. Confirmed.
- Unofficial-data disclaimer screenshot resilience: **partially.** The top strip "CITIZEN TALLY · THIS IS NOT AN IEBC SYSTEM" is unmissable on web (slide 47). On mobile the strip reads "CITIZEN TALLY · NOT IEBC" — fine, but **a user screenshotting only the candidate-bars area below the fold will lose the disclaimer.** Either repeat a subtle "NOT IEBC" watermark on the body, or add it to the bottom strip on the national mobile view (you do this on slide 4 — extend to slide 42). The receipt (39) and the web station detail (48) bake it in correctly.
- Information density on low-end Android: candidate rows are appropriately tall, tabular figures used, no overflowing text in what's shown. Verify at 320 dp width (lowest common Android) — not shown in the deck.

---

## 7. Accessibility audit

Specific failures to fix:

- **Slide 15 (Disclaimer):** orange check and orange X for IS / IS NOT — opposing semantics, same color. Failure of "never color alone."
- **Slide 10 (Verification states):** spec says color + glyph, artwork shows color-only. Add glyph.
- **Slide 11 (Components):** "✓ VERIFIED" tag uses green only — needs a glyph that survives monochrome.
- **Slide 24 (Hold to confirm):** progress fills the button background — color-only state. Add a percentage text or "Holding · 1.2 s" countdown so a screen-reader and low-vision user gets parity.
- **Slide 13 (Language pick):** Kiswahili and English stacked with same weight read as one phrase to a sighted user — ambiguous structure for screen-reader linearisation too.
- **Slide 18 (OTP):** the 6-digit boxes — make sure each is announced as "digit 1 of 6, etc." for TalkBack, not as "edit text."
- **Throughout:** no documented focus-ring token, no documented reduced-motion variants for the hex map and pin-cloud animations.
- **Touch targets:** the hex tiles on slides 4, 42, 47 are visually small (~24–28 dp) — they're a tap target. Either enlarge or wrap each in a larger invisible hit area. Spec it explicitly.
- **Contrast:** sand on forest (the primary type pair) is fine. Mustard "cand-3" on forest is borderline for body text — never use it for body, only for fills with glyph.

No WCAG 2.2 AA compliance table is included in the deck. Add one as an appendix.

---

## 8. Voice and tone

Mostly excellent. Civic, calm, numeric, bilingual where it matters.

**Flag for rewrite:**
- "VOTE WITHOUT IEBC?" (slide 47) — sounds activist; rewrite "See your station's tally."
- "SUSPECTED FRAUD" tag (slide 44 + slide 45) — rewrite "Possible irregularity" or "Numbers questioned." Defamation surface, especially when screenshot-shared.
- "MAMBO WANJIKU!" (slide 21) — fine for Nairobi but reads slightly app-marketing; consider "Habari Wanjiku" for a calmer civic tone.
- "Pin another nearby" (slide 25) — fine. "Verify another station" (slide 31) — better. Standardise.

Otherwise the copy is the strongest civic-tech copy in this category. Keep "Asante. Your tally is now public." (39), "Your tally is safe. Don't close the app." (40), "We need to know which station's form this is — before you photograph it." (34).

---

## 9. Brand differentiation

Distinct from: ✅ government work (no royal-blue, no coat-of-arms typography). ✅ political parties (provided you fix the candidate-color cluster — currently a partial fail). ✅ generic startup templates (the hex-map, the receipt skeuomorph, the bilingual section titles, the "CITIZEN TALLY · NOT IEBC" strip are all distinctive).

To push further: lean harder into the **receipt** and **trail** artefacts. They're the soul of the brand. Make the receipt printable on thermal paper as an export option — that's the kind of detail that makes a Kenyan grandmother trust the product.

---

## 10. Implementability on Expo / Django + RN stack

- ✅ Public Sans + IBM Plex Mono via `expo-font` — fine.
- ✅ Haptics, location, camera, secure-store, biometric, notifications, netinfo — all already in `package.json`.
- ⚠️ **Maps:** `react-native-maps` default Google tiles require network. Rural-Kenya use case demands offline tiles. **Recommend swap to `@maplibre/maplibre-react-native` + pre-cached MBTiles bundled per county on first run** (or downloaded on demand under 5 MB). Cost: 1–2 sprint weeks of integration, plus tile-build pipeline. Justification: a verifier in Turkana with no signal cannot pin a station on a blank map.
- ⚠️ **OCR on slide 37:** no mention of which OCR engine. On-device (ML Kit via `expo-mlkit-ocr` or `vision-camera-ocr` for handwritten tallies) is preferable to a server round-trip on 2G. Specify.
- ⚠️ **Hex map on `react-native-skia`** (already in stack) would render efficiently. `react-native-gifted-charts` won't handle the hex layout — needs Skia. Confirm.
- ⚠️ **Animation:** the pin-cloud and consensus dots will use `react-native-reanimated` — already in stack. Provide reduced-motion variants per token.
- ⚠️ **`react-native-paper`** is in `package.json` but the deck designs nothing that looks like Paper. Either fully adopt Paper's primitives and theme them, or drop the dep — currently it's dead weight on the bundle.
- ⚠️ **Web:** Tailwind tokens via CSS vars is correct. Django templates rendering the React app needs an explicit hand-off contract — slide 7 mentions it but doesn't draw it. Specify.

Performance budget: hex map on national mobile screen (42) is the heaviest screen — confirm it loads under 200KB JS via code-splitting before the user lands. Lazy-load Skia.

---

## 11. Prioritised punch list

**P0 — must fix before ship:**
1. **Repalette candidate colors** away from current sage-green + mustard-yellow + coral cluster. Defensibility against partisan-mapping accusations.
2. **Rename "Suspected fraud" → "Possible irregularity"** (slides 44, 45). Defamation surface.
3. **Rewrite "VOTE WITHOUT IEBC?" CTA** (slide 47). Quote-mining surface.
4. **Add glyphs to verification-state chips** (slides 10, 11). Color-only fails AA.
5. **Fix slide 15 IS/IS NOT color** — success-green check, danger-red X, not both orange.
6. **Specify missing semantic, spacing, radius, elevation, motion tokens.** Engineer cannot build from current spec.
7. **Add location-denied and camera-denied permission-fallback screens** for Form 34A.
8. **Swap to offline-capable map tiles** (MapLibre + MBTiles) — without this the rural use case fails.
9. **Repeat "NOT IEBC" disclaimer in the lower half of mobile dashboard** (42) for screenshot resilience.
10. **Complete the web landing artboard** (slide 50) — currently truncated below the fold.

**P1 — should fix soon:**
11. Recommend Direction A as default flow, Direction B as desk activity. Document.
12. Add GPS-accuracy-poor fallback in PinVerify (no walk-gate when ±50 m+).
13. Add glare-detection hint to camera (35), complementing blur detection (36).
14. Add "no stations near you" empty state to Find station.
15. Add real Kiswahili body sentence to type-scale spec (8).
16. Specify dynamic-type behaviour up to 2.0× scaling.
17. Specify WCAG 2.2 AA contrast pairs in the token sheet.
18. Drop or fully adopt `react-native-paper`.
19. Specify on-device OCR engine.

**P2 — nice-to-have:**
20. Thermal-receipt export.
21. Sheng language pack (or remove the request CTA at MVP).
22. Reduced-motion variants for hex map and pin-cloud animations.

---

## 12. What I would NOT change

- The map-first "the country IS the dashboard" thesis. It's the single best concept in the deck and differentiates this from every other civic-tech product in the region.
- The receipt (slide 39) and the verification trail (slide 31). These are the trust artefacts that make the product defensible.
- The location-before-camera enforcement and the calm "why we ask" copy (slide 34). Privacy-respectful and audience-appropriate.
- The "CITIZEN TALLY · NOT IEBC" strip as a persistent header. Brave and correct.
- "Asante. Your tally is now public." (39), "Your tally is safe. Don't close the app." (40), and the 11-verifier consensus sentence on slide 28. Don't touch this copy.
- The data-cost-in-KES line on Review + submit (38). This is the single most considerate sentence in any Kenyan app in this category.
- The bilingual section title cards. The aesthetic restraint is the brand.

---

## Verdict

**Ship-with-fixes.** Thoughtful, opinionated, audience-aware redesign whose strongest moments — location-first capture, offline queue, receipt-as-proof, walk-to-confirm pin verification, consensus-cloud disambiguation — are best-in-class for the use case and stack. Fails on three categories that block ship: the candidate palette overlaps too closely with current Kenyan party color associations; one tag ("Suspected fraud") and one CTA ("Vote without IEBC?") create defamation and quote-mining surfaces; the design system is materially incomplete below the color layer. None of these are conceptual problems — all are polish-and-finish gaps. Fix the P0 list above and this is shippable for the 2027 cycle.
