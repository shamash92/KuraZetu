# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Three audiences, in priority order. When their needs conflict, the submitter wins.

1. **Submitters — citizens and party agents at a polling station on election night.** They stand at
   their own station after the count is announced, photograph the posted Form 34A, and enter the
   figures. The scene is rushed and crowded, light is poor, the network is patchy, and the person
   may be wary of being seen using the app.
2. **Verifiers — community members cross-checking submissions after the fact.** They compare
   submitted photographs against entered figures, and raise community notes on discrepancies. Their
   work is deliberate and comparative rather than hurried.
3. **Observers — civil society, journalists, and oversight bodies reading aggregated tallies.** They
   scan results across wards, constituencies, and counties looking for anomalies at scale rather
   than entering data.

## Product Purpose

Kura Zetu is an open source, citizen-led parallel tallying platform for Kenyan elections. Results
announced at each polling station are legally final and posted publicly on Form 34A, so ordinary
voters can act as agents of electoral transparency. The platform crowd-sources those station-level
results, lets the public cross-verify them, and publishes live tallies.

Success is a result that a citizen submitted, another citizen verified, and an observer can trace
back to a photograph of the form posted at a named station.

## Positioning

Verification is bottom-up and evidence-bound: every figure is tied to a specific polling station and
to an image of the Form 34A posted there, and any member of the community can dispute it through
community notes. It is a parallel civic instrument, not a competing authority — it does not declare
winners, and it derives its credibility from traceability to the posted forms rather than from
institutional standing.

## Operating Context

- Kenya runs elections across more than 46,000 polling stations.
- Geography is hierarchical: county → constituency → ward → polling center → polling station.
  Polling centers carry location data and can be community-verified.
- Six races are tallied per station: president, governor, senator, MP, women representative, and MCA.
- The artifact of record is Form 34A, posted physically at the station and photographed by the
  submitter.
- The heaviest usage is compressed into election night and the days after, when accuracy and speed
  matter simultaneously and public attention is highest.

## Capabilities and Constraints

- Identity is a phone number, not an email or a real name. Phone numbers are masked in output
  (last three digits replaced).
- Native app: authentication including biometric sign-in, Form 34A capture, per-race result entry,
  station and center browsing with maps, community notes, live results views, push notifications.
- Web: React UI alongside Django-rendered pages; PostGIS-backed geography.
- Terminology to preserve: Form 34A, polling station, polling center, ward, constituency, county,
  aspirant, community notes, verification.
- Open source under the MIT licence; the codebase is intended to be contributed to and audited by
  outsiders.
- **Undecided, and not to be invented:** the operating legal entity, governing jurisdiction, and the
  Terms of Service and Privacy Policy themselves. `src/terms.md` records these as open questions and
  the links in the signup form, landing footer, and APK download page are still placeholders.
- **Not established:** device and network floor. Low-end Android and offline tolerance were
  explicitly *not* confirmed as binding constraints; do not treat performance limits as settled
  product truth until they are.

## Brand Commitments

- Name: **Kura Zetu** ("our votes").
- **The not-official framing is load-bearing and must stay visible in the product.** Kura Zetu is
  not an IEBC system, does not replace official processes, and is not a legally binding
  representation of results. This cannot be softened or relegated to the README.
- **Political neutrality is a design constraint, not only an editorial one.** No party colour,
  ordering, prominence, or treatment may read as favouring any candidate or party. All aspirants get
  neutral presentation.
- Bilingual reality: Kiswahili and English sit side by side, and other Kenyan languages appear in the
  product's voice. The app already greets across Kiswahili, Gĩkũyũ, Dholuo, Kĩkamba, Kalenjin, Luhya
  and English.
- The project is explicitly non-partisan, and explicitly not a tool for harassment, intimidation, or
  misinformation.

## Evidence on Hand

- `README.md` — scope, what the project is and is not, the IEBC disclaimer.
- `docs/` — Sphinx site following Diátaxis; `docs/contributing.md` and
  `docs/how-to-guides/anonymous_github.md` carry the contributor safety guidance.
- `LICENSE.md` — MIT.
- Real domain models for geography, aspirants, parties, and per-race results in `src/stations/` and
  `src/results/`.
- An existing visual system: the **perk** token set in `NATIVE/app/_utils/colors/`, mirrored by
  `claude-design/src/perk.css`.
- **Absent — do not fabricate:** testimonials, user counts, adoption or accuracy benchmarks,
  partnerships, press coverage, funding, and any claim of official recognition.

## Product Principles

1. **Evidence over assertion.** A figure means little without the photographed form and the named
   station behind it; keep the chain from claim to evidence visible.
2. **The submitter's night is the hard case.** Rushed, dim, crowded, and watched — design the
   capture path for that scene, not for a calm desk.
3. **Neutrality is structural.** Treat every party and aspirant identically in colour, order, and
   emphasis; let the numbers carry the difference.
4. **Never expose the person behind the submission.** Anonymity is a safety measure against real
   surveillance risk, not a privacy nicety.
5. **Claim exactly what is true.** Parallel, citizen-led, unofficial. Overstating authority is the
   fastest way to make the project dangerous rather than useful.

## Accessibility & Inclusion

Contributors and users face genuine risk of surveillance and reprisal, so anonymity is treated as an
access requirement: identity must never be inferable from the interface. Language inclusion is
active — Kiswahili and English are both first-class, and other Kenyan languages are represented in
the product's voice. No formal accessibility standard has been established for the project yet.
