# KuraZetu Redesign Canvas Evaluation

Evaluated: `KuraZetu — Redesign Canvas (print).pdf`

I evaluated the PDF as a 52-page slide deck. PDF pages are cited as slide/page numbers.

## Updated Audience Assumption

Primary audience: Kenyan Gen Z and millennials. Under this assumption, connectivity and low-end OS/device constraints are less central than the original brief implied. I would still keep offline and bandwidth-aware behavior because election-day usage can happen outdoors, in crowds, at night, or under unstable local networks, but I would no longer treat "old Android / 2G / tiny memory budget" as the dominant design constraint.

The more important Gen Z/millennial constraints are: screenshot culture, social sharing, fast trust judgments, fear of surveillance, clout-seeking behavior, political pile-ons, misinformation risk, and the need for the product to feel credible without feeling like government, NGO bureaucracy, or campaign material.

## Overall Score

6.3 / 10.

The direction has a serious civic-tech spine and is closer to the likely Gen Z/millennial audience than it is to a lowest-common-denominator public-service app. The biggest failures are still trust failures: politically loaded candidate color treatment, incomplete offline/permission/error states, screenshots that can crop away key context, over-dense dashboard layouts, gamified PinVerify incentives, public usernames, and copy that sometimes slips into activist or viral-product energy.

## Per-Screen Critique

**p3-p6, Ramani brand/results:** The map-first idea is strong, and for Gen Z/millennials it has a shareable identity that could travel well. But "The country IS the dashboard" is too design-studio clever. The 47-hex county abstraction is distinctive, but it risks turning vote leads into a political heat map. Candidate colors are a major trust risk: orange/yellow/green are too close to Kenyan party visual languages. Candidate names plus party names reinforce partisan reading.

**p4, Country map:** "Leading by county" is dangerous as the primary mental model. It invites winner-map interpretation before verification confidence is understood. Missing "% community-verified" and stale-data language. Disclaimer is bottom-croppable.

**p5, County drill:** Good drill-down pattern, but it shows "leading" too prominently and hides verification quality. "0 / 312 not reporting" is good, but no stale/offline/partial-data explanation.

**p6, Station detail:** Best core civic screen. Station code, stream, submitted form, hash, and verification are the right primitives. Failure: username display may expose contributors in hostile environments. "Report..." is too vague for Community Notes.

**p8, Type:** Public Sans + IBM Plex Mono is implementable and sensible. But 13px captions/code are still too small for outdoor use and fast scanning, even if the audience has better phones. The typo "Selecta polling-station" is embarrassing in a design system slide.

**p9-p11, System:** Tokens are named but not precise enough. No actual hex values, spacing scale, radius scale, shadow/elevation rules, motion rules, focus states, disabled states, dark/light pairs, or RN/Tailwind mapping. Engineers could not implement this consistently from the deck alone.

**p13-p18, Onboarding/auth:** Language-first is correct. Disclaimer-first is correct. Phone + OTP is right. But the onboarding is actually more than 3 screens if language is counted, and there is no OTP failure, resend failure, no-SIM, dual-SIM, bad network, wrong number, or biometric denial state. "Sheng? Tap to request" feels underdesigned and maybe tokenistic unless there is a real language strategy.

**p15, Disclaimer:** The IS / IS NOT table is one of the strongest pieces. Keep it. But "A check on official results" could read confrontational. Safer: "A public parallel record for transparency."

**p16, Privacy:** "Your location, once" is good, but "Hashed. Never shared." for phone numbers is too absolute unless the backend design truly guarantees it. Do not overpromise privacy in this context.

**p20-p24, PinVerify A:** This is the better mobile PinVerify direction. Search, GPS pre-fill, walk-to-confirm, hold-to-confirm, receipt all make sense. Failure: it assumes GPS +/-4-6m too confidently. "Mambo Wanjiku!" plus points feels gamified in a politically sensitive environment. For Gen Z/millennials, this is not a device problem; it is a clout problem. Points can become a social status game around election infrastructure. De-emphasize them or replace them with private contribution counters.

**p26-p29, PinVerify B:** Showing prior pins upfront creates anchoring bias. It is transparent, but it nudges people to agree with consensus rather than independently verify. "I agree (+10 pts)" is especially bad: it rewards conformity and can become a low-effort points farm. The two-cluster dispute idea is good, but the UI needs "same compound / different stream / renamed station / entrance moved / unsure" as structured reasons.

**p31-p37, Form 34A capture:** The location-before-camera order is enforced in the shown sequence, p31 before p32. Good. The data-cost estimate on p35 is excellent, though less central for a Gen Z/millennial target than for the original rural-low-bandwidth brief. Receipt on p36 is strong and screenshot-resilient because "THIS IS NOT IEBC" appears inside the receipt. Failures: no permission-denied location state, no weak-GPS state, no manual station fallback, no camera permission denial, no glare-specific state beyond blur, no multi-page mistake handling, no OCR confidence by field, and "Don't close the app" / "even if locked" overpromises what Expo/Android background sync can guarantee.

**p32-p33, Camera:** Overlay is usable, torch is visible, blur warning is good. But "Use it anyway" should require an explanation and mark the submission lower confidence. In hostile or rushed conditions, users will tap through warnings.

**p34, OCR confirm:** Editable tallies are implied but not shown clearly enough. Numeric keyboard behavior, row-level validation, total checks, rejected/spoilt/registered/cast consistency, and "OCR unsure" correction flow are under-specified.

**p39-p43, Mobile results:** Visually polished but too partisan in effect. Candidate bars and county colors dominate; verification confidence is secondary. For Gen Z/millennials, the screenshot problem is severe: p39 can be cropped into "candidate X leads" content without the unofficial-data context. p43 stale/offline state is good and calm, but p39 lacks a persistent uncroppable unofficial-data disclaimer in the content body.

**p41-p42, Community Notes:** Structured notes are a good direction. But author privacy is not solved: usernames are public. "Suspected fraud" is too inflammatory as a default reason; use "Possible irregularity" and require structured evidence. Anti-harassment safeguards are mentioned nowhere in the UI.

**p45-p46, Web results:** Too much density, too many side panels, too much live activity. The issue is less 3G performance under the updated assumption and more political attention design: this risks becoming a trading terminal for election drama. The "Recent community activity" feed with usernames is a privacy, harassment, and dogpiling risk. p46 station page is better: form images, notes, trail, permalink are the right ingredients.

**p48-p49, Landing:** The landing is clear but too marketing-like. "The count, uploaded by you" is catchy but slightly triumphalist. "Powered by Kiongozi" risks confusing authority/affiliation. The IS / IS NOT section should appear above live preview or be sticky near it.

**p50-p51, Web PinVerify:** Better than "game" framing, but still too points-driven. Leaderboards are a bad fit for election infrastructure: they invite brigading, harassment, and performative verification. Satellite view on web is heavy and may be necessary, but should be lazy-loaded and never block the basic task.

## Design System Audit

**Color:** Fails neutrality. Orange/yellow/green candidate colors are too politically adjacent and too emotionally charged. Use neutral candidate slots with patterns, labels, and tabular numbers; reserve semantic color for system states only.

**Contrast:** Dark mode is attractive and likely audience-appropriate, but it is not enough. There is no light/high-contrast outdoor mode. Fine muted text on dark forest backgrounds will still fail bright sun and quick in-the-field scanning.

**Typography:** Font choices are good. Sizes need a mobile floor closer to 16dp body / 14dp metadata, with dynamic type support.

**Iconography:** Mostly restrained, but emoji-style items on p42 undermine seriousness. Use lucide icons with labels.

**Spacing/radius/elevation:** Not specified enough. The components look coherent, but tokens are not engineering-ready.

**Component coverage:** Missing permission sheets, denial states, offline queue manager, conflict resolution, destructive confirmation, empty states, loading skeletons, language expansion examples, TalkBack labels, reduced-motion states, and data-staleness components.

## Flow Rigor

**Signup/login:** Happy path shown. Error/offline/permission/empty/destructive states missing.

**Onboarding:** Good concept, but over screen budget if counted strictly. Missing skip/return/language-change behavior.

**PinVerify:** Good happy paths. Missing low-accuracy GPS, no GPS, no map tiles, station not found, shared compound disambiguation, malicious consensus, brigading resistance, and conflict-resolution moderation.

**Form 34A:** Good main sequence. Missing permission-denied, weak GPS, camera denial, glare, page-order correction, OCR edit details, duplicate submission, failed upload, and conflict state.

**Dashboards:** Happy and stale states shown. Missing empty/no-data, partial verification, failed refresh, and screenshot-resilient disclaimer on every content view. A true low-bandwidth mode is less central under the updated audience assumption, but it remains useful for election-day resilience.

**Community Notes:** Basic flow shown. Missing privacy, abuse reporting, moderation, rate limits, evidence requirements, and author shielding.

**Settings/profile/privacy/about:** Not shown. This is a major omission.

## PinVerify Scrutiny

Direction A is more defensible than B because it reduces anchoring. Keep walk-to-confirm and hold-to-confirm. Change the scoring model: no leaderboards, no agreement bonuses, no public verifier rankings. Use private contribution history and trust weighting instead.

For field usability, add: cached station list, text search by school/landmark/stream, "same compound" selector, manual "I am here but GPS is poor," accuracy ring, satellite unavailable fallback, and delayed consensus reveal after user submits.

## Form 34A Scrutiny

The required location-before-camera order is shown correctly. But ship cannot proceed until denial paths are designed. The capture flow also needs explicit multi-page controls: replace page, reorder, retake page 2, add continuation page, and submit with missing page warning. Receipt is good; keep the hash, timestamp, station code, and "THIS IS NOT IEBC" inside the receipt.

## Dashboard Scrutiny

Low-connectivity warning on p43 is one of the better screens: clear trigger, last refresh, saved snapshot, retry. But p39/p45 do not carry that rigor into normal live views. Every dashboard needs visible "unofficial citizen tally," "last refreshed," "stations reporting," and "community-verified" in the content area, not only the top chrome.

## Accessibility

Likely failures: 13px metadata/code, low-contrast muted text on dark forest, color-coded candidates, tiny county hex labels, small chart legends, dense web sidebars, emoji/icons without accessible labels, and no focus order or keyboard states. Tap targets appear mostly acceptable, but p39 tabs and map hexes are suspect.

## Voice and Tone

Best tone: p15 disclaimer, p16 privacy, p35 data cost, p43 stale data. Worst tone: "Mambo Wanjiku!", points, leaderboards, "Suspected fraud," "The count, uploaded by you," and "Vote without IEBC?" These read activist, game-like, or provocative.

## Brand Differentiation

The work is distinct from generic startup templates in its map-first civic infrastructure feel. It is less successful at separating itself from political material because candidate colors, leaderboards, and live "leading" framing create campaign-like energy. To push it further, make the visual identity more documentary: form evidence, station codes, timestamps, verification confidence, receipts, neutral map layers, and calm tabular data.

## Implementability

Mostly buildable on Expo/Django/React/Tailwind, but with caveats. Satellite maps, live dashboards, charting, camera/OCR, and background sync should still be lazy-loaded. On-device OCR/glare detection beyond basic blur/brightness is possible only with careful performance trade-offs. "Publish even if locked" is not reliably deliverable in Expo. Under the updated audience assumption, the initial mobile JS <=200KB target should be treated as a discipline target rather than a hard audience requirement.

## Prioritized Punch List

**P0:** Remove party-adjacent candidate colors and leaderboards. Make unofficial-data disclaimer screenshot-resilient on every results view. Redesign public identity/privacy so contributors are not exposed to pile-ons. Add permission-denied/weak-GPS/offline/no-map states. Add Settings/privacy/about/language flows. Redesign Community Notes privacy and "suspected fraud" language.

**P1:** Define full tokens with hex values, spacing, radius, type, elevation, focus, semantic states, and RN/Tailwind mapping. Add light/high-contrast outdoor mode. Simplify mobile dashboards. Add OCR correction details and multi-page controls. Add anti-brigading and rate-limit states for PinVerify and Community Notes.

**P2:** Keep the hex map as a brand motif but reduce reliance on it for comprehension. Add Kiswahili expansion examples. Add low-bandwidth dashboard mode as a resilience feature, not the primary product posture. Add civil-society audit affordances after the core trust flows are fixed.

## What I Would Not Change

Keep language-first onboarding, the IS / IS NOT disclaimer structure, phone + OTP, location-before-camera sequencing, data-cost disclosure, local receipt with hash/timestamp/station code, station-level drilldown, and structured Community Notes as a concept. Those are the parts that actually serve trust.

## Verdict

Ship-with-major-fixes. With Gen Z and millennials as the main audience, the visual direction is more viable than the original low-end/rural-first critique suggested. But the trust problems remain serious: neutrality, public identity, clout incentives, screenshot resilience, permission/error states, and dashboard framing must be fixed before treating this as implementation-ready.
