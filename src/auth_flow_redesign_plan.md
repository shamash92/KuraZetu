# Auth Flow UI Upgrade — Plan

Redesign the signup / boundary-selection flow in `src/ui/` to match the perk
aesthetic already shipped on the landing page, add local persistence so users
can move back/forward through the steps, and split the monolithic selector
component into maintainable pieces.

## Decisions (locked)

- **Persistence:** `localStorage` + step state. Refresh restores progress, a Back
  button steps backward through the flow.
- **Auth model:** keep the current **no-OTP** signup form fields (phone, name,
  gender, age, role, password). Restyle only — **no backend change**.
- **Structure:** split the ~1000-line `boundariesSelect.tsx` monolith into step
  components + a shared flow hook.
- **Aesthetic:** perk design tokens — sand `--paper`, `--lime` CTA, `--copper`
  eyebrows, IBM Plex Mono labels. Tokens in `landing.css` are global `:root`
  vars, so they're reusable directly from a new auth stylesheet.

## Assumptions (flag if wrong)

- The Django `/accounts/login/` page is **out of scope** (server-rendered, not
  React). Only the React "Already have an account / New here" choice screen gets
  restyled. Its Login button keeps pointing at `/accounts/login/`.
- **No backend / API changes.** Endpoints unchanged:
  - `GET /api/stations/counties/boundaries/`
  - `GET /api/stations/county/:n/constituencies/boundaries/`
  - `GET /api/stations/constituencies/:n/wards/boundaries/`
  - `GET /api/stations/wards/:n/polling-centers/pins/`
  - `POST /api/accounts/signup/`

---

## Target file structure

```
src/ui/src/auth/signup/
  index.tsx              → renders <SignupFlow/>
  useSignupFlow.ts       NEW — flow state machine + localStorage
  flow/
    ChoiceStep.tsx       NEW — image 1 (login / start registration)
    CountyStep.tsx       NEW — image 2
    ConstituencyStep.tsx NEW — image 3
    WardStep.tsx         NEW — image 4
    PollingStep.tsx      NEW — image 5
    SummaryStep.tsx      NEW — image 6 ("you are almost done")
  SelectorShell.tsx      NEW — shared list+map layout, list-row, Back/Select
  BoundaryMap.tsx        NEW — extracted Leaflet map (geojson/markers/fitBounds)
  signupForm.tsx         MODIFY — image 7, restyle to perk, prefill from flow
  boundariesSelect.tsx   DELETE after extraction
  auth.css               NEW — kz- perk classes for auth surfaces
```

### `useSignupFlow` hook (core)

Single source of truth, persisted to `localStorage["kz_signup_flow"]`:

```ts
{
  step: 'choice' | 'county' | 'constituency' | 'ward' | 'polling' | 'summary',
  county: { number, name } | null,
  constituency: { number, name } | null,
  ward: { number, name } | null,
  pollingCenter: { code, name } | null,
}
```

- `goNext()` / `goBack()` — derive previous step; clearing a level on Back also
  clears all downstream selections.
- Rehydrate on mount → land the user on the saved step (fixes "process not
  saved locally").
- On Summary → navigate to
  `/ui/signup/accounts/:wardCode/:pollingCenterCode/`.
- Data fetching (counties / constituencies / wards / polling centers) stays keyed
  off the selections; cache the last fetch in state.

### `SelectorShell` + `BoundaryMap`

- One shared layout for the four selector steps (list left, map right). Kills the
  4× duplicated row markup currently in the monolith. Props: title accent word,
  items, activeId, onPick, onSelect, **onBack**.
- Row restyled to perk: card row, mono label, lime "Select →" pill, colored
  accent bar per level.
- `BoundaryMap` takes `{ features, markers, bounds, tileProvider }`. Extracted
  as-is — **logic unchanged** (this code is timing-sensitive; preserve effect
  order, do not "improve").

---

## Visual changes per screen

| Img | Screen | Change |
|-----|--------|--------|
| 1 | Choice | Two perk cards on `--paper` mesh bg; lime "Start Registration", ink "Login" → Django login. |
| 2–5 | County / Const / Ward / Polling | `SelectorShell`: sand panel, mono uppercase labels, lime select pill, **+ Back button** (new), accent bars per level. |
| 6 | Almost done | Perk summary card: mono key/value rows showing **names** (not just codes), lime "Proceed to registration". |
| 7 | Signup form | Restyle to perk: `--paper` bg, phone-prefix block with KE flag (from `auth-perk.html`), mono field labels, lime Register CTA. Keep all fields + the no-OTP note. |

## New behavior

- **Back navigation** on every step (currently impossible).
- **Refresh-safe:** reload mid-flow → restored to the same step + selections.
- **Deep-link guard:** `signupForm` already handles bad ward/polling params; keep.

---

## Build order (verify each)

1. `auth.css` + confirm tokens resolve globally → render one styled row.
2. `useSignupFlow` hook + localStorage → console-check rehydrate / back.
3. `BoundaryMap` extraction → map still renders / fits (parity with current).
4. `SelectorShell` + 4 step components → click county → polling end to end.
5. `ChoiceStep` + `SummaryStep` → full flow to signupForm.
6. Restyle `signupForm` → submit still posts, token saved, redirect works.
7. Delete `boundariesSelect.tsx`, wire `index.tsx`.
8. `eslint` + `prettier` on touched files; `tsc --noEmit`.

## Risks

- Leaflet `bounds` / `fitBounds` timing is fragile in the current code — the
  extraction must preserve effect order. Diff behavior, do not refactor logic.
- localStorage may hold stale boundary IDs after data changes — guard: validate
  saved IDs against fetched lists, reset to a safe step if missing.

---

## Model assignment

Opus = design taste, state-machine logic, fragile timing. Sonnet = mechanical,
bounded, repetitive once the primitive exists.

| # | Task | Model | Why |
|---|------|-------|-----|
| 1 | `auth.css` perk classes | **Opus** | Pure taste; defines the aesthetic the rest copies. |
| 2 | `useSignupFlow` hook + localStorage | **Opus** | State machine, back/clear-downstream, rehydrate edge cases. |
| 3 | `BoundaryMap` extraction | **Opus** | Leaflet `fitBounds` timing fragile; preserve effect order. |
| 4a | `SelectorShell` (layout + row) | **Opus** | Reusable design primitive; sets quality for 4 screens. |
| 4b | 4 step components | **Sonnet** | Mechanical once Shell + hook exist. |
| 5a | `ChoiceStep` (image 1) | **Opus** | Hero-style cards, taste. |
| 5b | `SummaryStep` (image 6) | **Sonnet** | Key/value rows + CTA, bounded. |
| 6 | Restyle `signupForm` | **Sonnet** | className swaps, keep logic. |
| 7 | Delete monolith + wire `index.tsx` | **Sonnet** | Mechanical cleanup. |
| 8 | lint / prettier / `tsc --noEmit` | **Sonnet** | Mechanical verify. |

Execution order: Opus 1→2→3→4a→5a (foundations + taste), then Sonnet 4b/5b/6 in
parallel, then Sonnet 7→8.

## Out of scope (this plan)

- Django `/accounts/login/` page (server-rendered).
- OTP / phone-first auth (design shows it; app deliberately skips OTP).
- Backend / API changes.

## Side fix already shipped

- Navbar bug: `LandingNav` in `landing-pages/index.tsx` hardcoded
  "Sign in / Get started" even when logged in. Made it auth-aware via `useAuth()`
  — shows a single "Log out" (→ `/accounts/logout/`) when authenticated, on both
  desktop and mobile nav.
