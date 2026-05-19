# Voting Audit

Companion to [`audit.md`](./audit.md). The original audit catalogs the
backend security and election-integrity findings. This document captures the
**self-regulating voting design** that the platform is moving toward,
without moderators, and links to the flow diagrams that make each piece
concrete.

**Scope:** Django backend, NATIVE mobile app, PinVerify data pipeline.
**Branch:** `backend-audit-2026-05`
**Date:** 2026-05-19

---

## Design goals

1. No human moderators. Every state transition is driven by data or by
   constraints enforced at the database level.
2. Hard gates over weighted trust. Every submission must pass a deterministic
   set of checks; weights only resolve ties among submissions that all
   already passed.
3. Contested is a public state, not an error. The platform shows
   disagreement raw and lets the audience read it.
4. Cheap to run in normal conditions, with paid AI used sparingly and only
   where confidence is low.
5. Avoid OCR. Image trust comes from hashes, EXIF, template matching, and
   targeted AI vision on a single challenge region, not from reading the
   form contents.

---

## Flow diagrams

All flow diagrams live in [`claude/plans/flows/`](./claude/plans/flows/).
Mermaid blocks render inline on GitHub and in any Markdown previewer with
Mermaid support. Order is meaningful: read top-to-bottom for the full
picture.

| # | File | What it covers |
|---|---|---|
| 00 | [`index.md`](./claude/plans/flows/index.md) | Landing page for the flow set |
| 01 | [`01-kill-chain.md`](./claude/plans/flows/01-kill-chain.md) | Current end-to-end fraud path, mapped to audit findings |
| 02 | [`02-upload-gates.md`](./claude/plans/flows/02-upload-gates.md) | Proposed gated upload happy path |
| 03 | [`03-contested-state.md`](./claude/plans/flows/03-contested-state.md) | Result state machine: pending / live / contested / frozen |
| 04 | [`04-aspirant-accreditation.md`](./claude/plans/flows/04-aspirant-accreditation.md) | IEBC nominee PDF → party HQ email → aspirant → agent |
| 05 | [`05-pinverify-hybrid.md`](./claude/plans/flows/05-pinverify-hybrid.md) | Schools dataset + OSM + DBSCAN cluster + manual game fallback |
| 06 | [`06-account-takeover-c1.md`](./claude/plans/flows/06-account-takeover-c1.md) | C1 + C3 + C6 chain, before and after fix |
| 07 | [`07-form34a-integrity.md`](./claude/plans/flows/07-form34a-integrity.md) | Pre-checks + AI gate + hashed storage + history |
| 08 | [`08-consensus-state-machine.md`](./claude/plans/flows/08-consensus-state-machine.md) | k-of-n consensus math, thresholds, freshness |

---

## How this maps back to `audit.md`

- **Kill chain (audit.md lines 270-281):** every link broken by one or more
  flows. See `01-kill-chain.md` for the mapping table.
- **C-series (Critical):** auth and config fixes are anchored by
  `06-account-takeover-c1.md`.
- **E-series (Election integrity):** addressed across
  `02-upload-gates.md`, `07-form34a-integrity.md`, `08-consensus-state-machine.md`,
  and `04-aspirant-accreditation.md`.
- **PinVerify / geo data:** `05-pinverify-hybrid.md` shows how the existing
  scripts under `src/stations/scripts/` plus the open `schools.geojson`
  dataset cut manual game load.

## Decisions captured

- **No Play Integrity / no BLE co-witness.** Too high a UX cost on cheap
  Android. Replaced by server nonce + GPS bounds + optional in-photo
  challenge.
- **Aspirants are limited to their zone** (`Aspirant.clean()` constraint
  mirrored in `Accreditation.clean()`) and to **one agent per station**
  (DB `UniqueConstraint`).
- **All hard gates must pass.** Probabilistic gates expose a clear reason on
  fail so the contributor can fix the cause and retry.
- **Contested becomes public.** UI shows both clusters side-by-side without
  picking a winner.
- **Premium-per-upload payments are dropped.** Aspirant corporate plans
  fund the platform instead; per-voter charging reads like vote-buying.
- **Merkle public ledger** parked as a future option, not blocking.

## Legal posture

Add the following disclaimer to onboarding, every results screen, and the
API response metadata for any non-`live` state:

> Kura Zetu is a civic transparency tool. Results shown here are
> crowd-sourced and unverified by IEBC. They are not admissible as legal
> evidence in election petitions. Official results are published only by
> the Independent Electoral and Boundaries Commission at iebc.or.ke.

Mirror in Kiswahili. Bake into the API response so any scraper sees it too.

---

## Suggested next implementation steps

1. **C3 + E11**: read-only privilege fields on `UserSerializer` plus the new
   `Accreditation` model with `clean()` zone enforcement. Closes the kill
   chain. ~1 day.
2. **E1**: wrap result-create views in `transaction.atomic`. Half day.
3. **E3 + E5 + E6**: unique filename, sha256 column, EXIF strip on upload.
   1 day.
4. **`match_schools_to_centers.py`**: auto-verify pins from existing
   `schools.geojson`. Cuts PinVerify game load. 1 day.
5. **Wire `django-simple-history`** on `*Results` and `*Extras` models for
   append-only audit (E9). Half day.
