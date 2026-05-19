# Kura Zetu Backend Audit

**Scope:** Django backend (accounts, stations, results, historical, CommunityTally settings, Dockerfile/compose).
**Threat model:** Public production app (Kenyan election data — high stakes).
**Date:** 2026-05-17
**Branch:** `backend-audit-2026-05`

Findings are grouped by severity. Action checkboxes track follow-up work. Skip nits where the cost > value.

---

## Critical — exploitable, fix before next deploy

### Account / Auth

- [ ] **C1. Password reset has no OTP / verification — full account takeover.** `src/accounts/views.py:55` `PasswordResetView.form_valid` resets password by phone number alone. Anyone who knows a registered phone can take over the account. TODO comment confirms it: *"How do we confirm the phone number first via OTP?"*. **Fix:** disable the endpoint until SMS/OTP flow is wired, or gate behind `django_otp` (already in `INSTALLED_APPS`).
- [ ] **C2. `User.has_perm` and `has_module_perms` always return `True`.** `src/accounts/models.py:120-128`. Any authenticated user passes Django permission checks — defeats `IsAdminUser`, admin permission checks, and DRF object permissions. Only thing protecting admin is `is_staff` flag. **Fix:** delegate to `super().has_perm()` or implement real perm system. This is one of the biggest issues in the codebase.
- [ ] **C3. `UserSerializer` exposes `staff`, `admin`, `is_verified` as writable fields.** `src/accounts/api/serializers.py:11`. `SignupView` does `User(**validated_data)` on the deserialized payload (`src/accounts/api/views.py:65`) — a client can register and set `"admin": true, "staff": true, "is_verified": true` in the same POST. **Privilege escalation.** **Fix:** mark these `read_only=True` in serializer Meta or strip in view.
- [ ] **C4. Signup endpoint trusts `request.data["data"]["password"]` and `phone_number` directly.** Both are read out of dict twice without going through the serializer, so phone-number validation is bypassed. `accounts/api/views.py:66,72,79`. Use `serializer.save()` with `set_password` in a `create()` override.
- [ ] **C5. Account-enumeration via login + password-reset forms.** `accounts/forms.py:31` and `:195` raise *"This Phone Number is not registered"*. Same for `LoginForm`. Lets attacker enumerate registered phones. **Fix:** generic error message ("invalid phone or password").
- [ ] **C6. DRF tokens never expire and are reissued on every login.** `accounts/api/views.py:171`. Combined with C1, a stolen/leaked token works forever. **Fix:** add token expiry (custom or `dj-rest-auth`/`SimpleJWT`), invalidate on password change.

### Authorization on results / stations

- [ ] **C7. Default DRF permission is `AllowAny`** (no `DEFAULT_PERMISSION_CLASSES` set in `base.py:165`). Most `results/api/views.py` and `historical/api/views.py` views set NO `permission_classes` — fully public. For a results-during-election app this might be intentional, but verify each endpoint deliberately. **Fix:** set `DEFAULT_PERMISSION_CLASSES = ["IsAuthenticatedOrReadOnly"]` and opt-in `AllowAny` per view.
- [ ] **C8. `VerificationPollingCenterAPIView` allows unauthenticated upvotes/pin suggestions.** `stations/api/views.py:306` (`permission_classes = [AllowAny]`, then writes to DB). Anyone on the internet can bump `location_upvotes` and create `PollingCenterVerification` rows. Confirmed by TODO at `stations/models.py:101`. **Fix:** require auth, dedupe by user.
- [ ] **C9. `CountyTotalResultsAPIView` has no `permission_classes` set but indexes `request.user.polling_center.ward`.** `results/api/county_views.py:29`. Anonymous request → `AttributeError` (500) — also leaks county data based on attacker-controlled user. Add `IsAuthenticated`.

### Config / deploy

- [ ] **C10. `CORS_ORIGIN_ALLOW_ALL = True` in production settings.** `CommunityTally/settings/production.py:16`. Overrides `CORS_ALLOWED_ORIGINS` — any origin can hit your API with credentials. **Fix:** remove that line.
- [ ] **C11. `settings/__init__.py` never loads `production.py`.** It does `from .base import *` then `try: from .local import *`. Production file is dead code unless `DJANGO_SETTINGS_MODULE=CommunityTally.settings.production` is set explicitly. Confirm prod env actually uses production module — otherwise prod is running with `DEBUG` defaulting (from base) and **no HSTS / SSL redirect / secure cookies**. **Fix:** branch on `ENV` var.
- [ ] **C12. Dockerfile runs `manage.py runserver` as entrypoint.** `src/Dockerfile:31`. `runserver` is the dev server — not safe for production (no concurrency, no worker recycling, security warnings disabled). **Fix:** use `gunicorn` (add to requirements; bind `0.0.0.0:8000`).
- [ ] **C13. `DATA_UPLOAD_MAX_MEMORY_SIZE = 20 GB`.** `settings/base.py:206-208`. Single request can OOM the server — trivial DoS. **Fix:** cap at e.g. 25 MB; use chunked upload for form 34 images.
- [ ] **C14. No throttling configured.** Login/signup/results endpoints can be brute-forced. **Fix:** `DEFAULT_THROTTLE_CLASSES` + `AnonRateThrottle`, `UserRateThrottle`, and a stricter `ScopedRateThrottle` on `login`/`signup`/`password-reset`.

---

## High — fix soon

- [ ] **H1. `print()` used 178x across `accounts/stations/results/historical` — leaks credentials.** `accounts/api/views.py:28,135` prints raw `request.data` (which contains password). On production logs (stdout) this writes passwords/tokens to disk. **Fix:** delete or replace with `logger.debug` (and never log password fields).
- [ ] **H2. Form 34A image upload is unvalidated.** `results/api/views.py:645` saves whatever the client sent as `form34A.jpg`. No MIME check, no size cap (combined with C13), no malware scan. An attacker (admin role required, but see C2/C3) can upload arbitrary files into `MEDIA_ROOT/forms/34A/…`. **Fix:** validate content type + extension + magic bytes (`python-magic`), cap size, store outside web root or use S3.
- [ ] **H3. Almost every endpoint returns `status.HTTP_200_OK` for errors.** E.g. `accounts/api/views.py:59,87,109,122,151`; `results/api/views.py:592,597,612,631,654`. Breaks client error handling and monitoring (200 errors are invisible to uptime tools). **Fix:** return 4xx for client errors, 5xx for server errors.
- [ ] **H4. N+1 queries everywhere — zero `select_related`/`prefetch_related` in app code.** `grep` returned 0 matches. `TotalPresResultsAPIView` (`results/api/views.py:366`) loops `aspirants`, then for each does `.filter().count()` + `.aggregate()` — separate queries per aspirant. `CountyTotalResultsAPIView` same. `PollingCenterBoundarySerializer.get_county` walks `ward.constituency.county` per row. **Fix:** add `select_related("ward__constituency__county", "party")` and batch aggregations with `annotate(Sum("votes"))` instead of per-row loops.
- [ ] **H5. `Aspirant.first_name` collisions break upload path.** `results/models.py:57` returns `f"party/aspirants/{instance.first_name}.{extension}"` — two aspirants with same `first_name` overwrite each other's photos. Use `pk` or a uuid.
- [ ] **H6. `RandomUnverifiedPollingCenterAPIView` uses `.order_by("?")`.** `stations/api/views.py:190,210,229,237,289`. `ORDER BY RANDOM()` on PG does a full-table sort — slow on a national dataset. **Fix:** count rows, pick `random.randint(0, count-1)` as `OFFSET 1 LIMIT 1`, or use `tablesample`.
- [ ] **H7. `CountyTotalResultsAPIView` indexes `request.user.polling_center.ward` even when `polling_center` is null.** `accounts/models.py:73` allows `null=True, blank=True`. AttributeError → 500 for any user without a polling center. **Fix:** guard + 400.
- [ ] **H8. Admin URL obfuscation undermined by `admin_honeypot`.** `urls.py:39` puts real admin at `${ADMIN_URL_SUFFIX}/`, honeypot at `/admin/`. Honeypot is fine, but real admin is also accessible at predictable path if env defaults to `admin/` (line 37 default). **Fix:** force `ADMIN_URL_SUFFIX` to be required (no default) in production. Also confirm `OTPAdminSite` enforcement works — note line 39 has trailing slash `f"{admin_url_suffix}/"` already includes trailing slash from default, so URL becomes `admin//`.
- [ ] **H9. Token issuance before verifying password.** `accounts/api/views.py:75` creates token, then re-authenticates at line 78. Token persists even if `authenticate` returns None.
- [ ] **H10. Login view returns 400 for "Invalid credentials" but 200 for everything else** (`accounts/api/views.py:151,189`). Inconsistent. Combine with C5: leaks valid-phone vs not-valid.

---

## Medium — quality / robustness

- [ ] **M1. `accounts/api/views.py:30` does `data["ward_code"]` without `.get`.** KeyError → 500 instead of 400.
- [ ] **M2. Duplicate identical try/except blocks in results views.** `results/api/views.py:113-121` (and copies at :147, :209, :266, :320) fetch the same `PollingCenter` twice in a row — copy-paste bug. **Fix:** delete the second block.
- [ ] **M3. `results/api/views.py:417` shadows loop variable `candidate` inside `for candidate in candidate_results: total_votes = sum(candidate["votes"] for candidate in …)` — recomputes total for each iteration AND shadows outer variable.** Works by accident; refactor to compute total once before loop. Same bug duplicated in `national_views.py:62` and `county_views.py:147`.
- [ ] **M4. Cache timeout = 3 seconds.** `results/api/views.py:431`, `national_views.py:77`, `county_views.py:167`. Cache barely helps; under load every 3s all clients trigger the slow uncached path simultaneously (thundering herd). **Fix:** 30–60s + jitter, or use `cache.get_or_set` with a lock.
- [ ] **M5. `EMAIL_BACKEND = console`** in `base.py:115`. Fine for dev but prod inherits this. Add real backend in prod settings.
- [ ] **M6. `django_browser_reload` middleware + URLs are loaded unconditionally** (`base.py:75`, `urls.py:71`). Should be `DEBUG`-only.
- [ ] **M7. `LoginForm.save()` calls `super().save(commit=False)` on a plain `forms.Form`** (`accounts/forms.py:62`). `Form` has no `save()`. Dead code path that would crash if called.
- [ ] **M8. `id_number` is unique + nullable + blank.** `accounts/models.py:58`. Multiple users with `NULL` id_number is OK on PG, but blank string `""` will collide. **Fix:** add a constraint or normalize blank → null.
- [ ] **M9. `historical` views have NO `permission_classes` set** — completely public (might be intentional for historical data). Confirm and document.
- [ ] **M10. `re_path(r"ui/.*", react_view)`** — broad catch-all (`urls.py:70`) eats any path starting with `ui/`. Fine but document.
- [ ] **M11. No `pgettext` / consistent error message format.** All errors are hand-rolled. Consider a central exception handler (DRF `EXCEPTION_HANDLER`).
- [ ] **M12. Sitemap.xml/robots.txt as `TemplateView`** — no caching, no compression. Cheap fix.
- [ ] **M13. `requirements.txt` is unpinned** for most packages. Reproducible builds need `pip-compile` (pip-tools) or Poetry/uv lock.

---

## Low — nits, fix when convenient

- [ ] **L1. Typo `Set environment varibles`** in `Dockerfile:4`.
- [ ] **L2. `Dockerfile` uses old `ENV K V` syntax** (deprecated). Use `ENV K=V`.
- [ ] **L3. Commented-out code in `urls.py`, `local.py`, `production.py`.** Delete.
- [ ] **L4. `accounts/api/views.py:106` returns "User not found after creation" with status 200.**
- [ ] **L5. `SignupView.post` is ~110 lines.** Split into serializer + service.
- [ ] **L6. `clean_password` in `LoginForm` and `MyAdminPasswordChangeForm`** has unreachable `else: pass`.
- [ ] **L7. `kurazetu_key` (private key) at repo root** — `.gitignore` lists it but verify with `git ls-files | grep -i key`. If ever committed, **rotate it**.

---

## Potential attack surface (open / wide endpoints)

| Endpoint | Auth | Risk |
|---|---|---|
| `POST /api/accounts/signup/` | `AllowAny` | Privilege escalation (C3), no throttle, no captcha |
| `POST /api/accounts/login/` | `AllowAny` | Brute force, enum, logs creds (H1) |
| `POST /accounts/password-reset/` | `AllowAny` | **Account takeover** (C1) |
| `POST /api/stations/polling-centers/verify/` | `AllowAny` | Anonymous DB writes (C8) |
| `POST /api/stations/ward/polling-centers/<distance>/pins/` | `AllowAny` | Unbounded `distance_meters` — full-table geo scan |
| `GET /api/results/total-votes/presidential/` | none | Public, but H4 (slow) → DoS via cache stampede |
| `GET /api/results/polling-center/...` | none | Public reads of results |
| `POST /api/results/polling-station/create/<code>/<level>/` | `IsAuthenticated, IsAdminUser` | OK in theory, but C2 (`has_perm` always True) breaks `IsAdminUser` semantics. Also H2 (unsafe upload). |
| `/{ADMIN_URL_SUFFIX}/` | session + OTP (only when `not DEBUG`) | OK if env set; broken if production settings not loaded (C11) |
| `/api/schema/swagger/`, `/redoc/` | none | Exposes full API spec to attackers. Consider gating behind auth in prod. |

---

## What is done well

- Custom `User` based on `phone_number` with `AbstractBaseUser` — clean.
- `django_otp` + `OTPAdminSite` wired for admin (good).
- `admin_honeypot` decoy at `/admin/` — nice defence-in-depth.
- `production.py` has HSTS, `SECURE_SSL_REDIRECT`, secure cookies, `SECURE_PROXY_SSL_HEADER` (assuming it loads — see C11).
- `SECRET_KEY`, DB creds via `python-decouple` — not committed.
- `Aspirant.clean()` enforces level↔geo constraints — good business-rule validation.
- `unique_together` on result models prevents double-counting per station+candidate.
- DRF + `drf-spectacular` for OpenAPI — modern stack.
- Cache layer present (just needs tuning, M4).
- Models use `PositiveIntegerField` for vote counts (defence against negative votes).

---

## Recommended tooling

### Static analysis / security

| Tool | What it catches | Setup |
|---|---|---|
| **`bandit`** | Python sec issues (hardcoded passwords, `eval`, weak crypto, `subprocess`, etc.) | `pip install bandit && bandit -r src -ll` |
| **`semgrep`** | Pattern-based bugs/security. Has Django ruleset. | `pip install semgrep && semgrep --config=p/django --config=p/python` |
| **`pip-audit`** or **`safety`** | CVEs in deps (e.g. old DRF, Django) | `pip install pip-audit && pip-audit -r requirements.txt` |
| **`ruff`** (already have via `black` style) | Lints + many `flake8-bugbear`, `flake8-bandit` rules in one tool. **Replace `black+isort+pytest-black`** with `ruff format` + `ruff check`. | `pip install ruff` |
| **`django-upgrade`** | Auto-fix old Django patterns. | `pip install django-upgrade` |
| **`djhtml` / `djlint`** | Template lint + security (`autoescape off`). | `pip install djlint` |
| **`mypy`** + `django-stubs` | Type-check Django code. | optional, big payoff later |

### Runtime / dynamic

| Tool | Use |
|---|---|
| **`django-debug-toolbar`** | Spot N+1 (H4) in dev. |
| **`django-silk`** or **`nplusone`** | Catch N+1 in CI/tests. |
| **`django-axes`** | Brute-force lockout on login (covers C14 partially). |
| **`django-ratelimit`** | Per-view rate limits. |
| **`django-defender`** | Account lockout + Redis-backed. |
| **OWASP ZAP** / **`nikto`** | DAST against staging. |
| **`gunicorn` + `whitenoise`** | Replace `runserver` (C12) and serve static. |

### Pre-commit additions

Already have pre-commit. Add hooks:

```yaml
- repo: https://github.com/astral-sh/ruff-pre-commit
  rev: v0.6.0
  hooks: [{id: ruff}, {id: ruff-format}]
- repo: https://github.com/PyCQA/bandit
  rev: 1.7.9
  hooks: [{id: bandit, args: [-r, src, -ll]}]
- repo: https://github.com/Lucas-C/pre-commit-hooks-safety
  rev: v1.3.3
  hooks: [{id: python-safety-dependencies-check}]
- repo: https://github.com/gitleaks/gitleaks
  rev: v8.18.0
  hooks: [{id: gitleaks}]
```

### CI security gates

- Run `pytest --cov` + fail under threshold.
- Run `bandit -ll` and `pip-audit` — fail on high/critical.
- Run `python manage.py check --deploy` in production-settings mode — Django's built-in security checklist.
- Run `semgrep ci` with Django ruleset.

### One quick win

Run this now to see what Django itself flags:

```bash
DJANGO_SETTINGS_MODULE=CommunityTally.settings.production python manage.py check --deploy
```

---

## Composability / complexity notes

- **`results/api/views.py` has six near-identical `PollingCenter*ResultsAPIView` classes** (presidential, governor, senator, women rep, mp, mca). Author flagged this in TODO at line 37. Refactor to one generic view parametrised by `level` (the URL already has the pattern). Reduces 350+ LOC by ~70%.
- **`CountyTotalResultsAPIView`** has a giant if/elif chain on `level`. Build a `LEVEL_MAP = {"president": (PollingStationPresidentialResults, "presidential_candidate"), ...}` and loop. Same applies to `PollingStationCandidatesListAPIView`.
- **Settings layout is broken** (C11). Use a single `settings.py` that branches on `DJANGO_ENV` env var, or properly use `DJANGO_SETTINGS_MODULE` everywhere.
- **`User` model** mixes `staff` / `admin` / `is_verified` / `active` — overlap with Django's `is_staff` / `is_superuser`. Consider standard fields.
- **`forms.py` has 4 forms that re-implement password hashing.** Centralise.

---

## Suggested priority order

1. **This week:** C1 (password reset), C3 (privilege escalation), C2 (has_perm), C10 (CORS), C11 (settings load), C12 (gunicorn), C13 (20GB upload), H1 (print + creds).
2. **Next sprint:** C7/C8/C9 (auth on endpoints), C14 (throttle), H2 (file upload), H4 (N+1).
3. **Cleanup:** M-series, L-series, refactor results views (composability).
4. **Add tooling** (pre-commit + CI gates) once acute issues fixed.

---

# Round 2 — Election Integrity Deep Dive

Focus: what can corrupt, intercept, or fake election results. Working file paths relative to `src/`.

## E — Election integrity (CRITICAL, fix before any real-election use)

- [ ] **E1. No `transaction.atomic` anywhere in result-write flow.** `results/api/views.py:615-640` `PollingStationResultsCreateAPIView.post` loops over candidates and does `Result.objects.create(...)` one row at a time, then creates `Extras`, then saves form34A image. Each statement auto-commits. **Attack:** intentionally cause IntegrityError on 5th candidate (e.g. duplicate aspirant id, level mismatch) — first 4 rows persist; remaining 4 do not; aggregation reports a partial, attacker-shaped tally. Same shape in governor/senator/mp/wr/mca views. **Fix:** wrap the whole handler in `with transaction.atomic():` and let any exception roll the entire submission back. Confirmed zero matches for `atomic|select_for_update|transaction\.` in app code.
- [ ] **E2. Form 34A image saved AFTER vote rows committed.** `results/api/views.py:631,645` — votes inserted, *then* `Extras` created, *then* `x.form_34A.save(...)`. If image save fails (disk full, S3 error, bad file), votes are accepted with no supporting evidence. **Fix:** validate + persist the image first (or stage it), only then insert vote rows, all inside one `atomic()` block.
- [ ] **E3. Form 34A filename is `"form34A.jpg"` — hardcoded.** `results/api/views.py:649`. Storage path is `forms/34A/<county>/<const>/<ward>/<center>/<station>/form34A.jpg`. Re-upload (or two near-simultaneous uploads) **overwrite the previous image** in storage. Evidence chain destroyed. **Fix:** name file `<station_code>_<timestamp>_<sha256[:12]>.jpg`, never reuse filenames.
- [ ] **E4. `PollingStationPresidentialExtras` has no uniqueness constraint.** `results/models.py:209-244`. Every POST creates another Extras row for the same station. Aggregations that sum `valid_votes_cast` across Extras (or join via `polling_station`) double-count rejected/disputed/valid totals. Same for `PollingStationGovernorExtras`, etc. (verify each level — `unique_together` exists on result rows but not on extras). **Fix:** `unique_together = ("polling_station",)` on every `*Extras` model + migration via `python manage.py makemigrations results`.
- [ ] **E5. No image hash / signature.** Nothing stores a SHA256 of the form34A bytes. Anyone with file system / S3 access (or anyone who can re-POST — see E3) can swap the image with no detection. **Fix:** add `image_sha256 = CharField(max_length=64, editable=False)`, compute in `save()` on the Extras model, expose in API. Optionally Ed25519-sign the (station_code, totals, sha256) tuple with a per-deploy key so tampering is detectable client-side.
- [ ] **E6. No EXIF strip on uploaded form34A.** Image likely contains GPS, device ID, timestamp of the uploader (presiding officer / agent). If `MEDIA_URL` is public (`urls.py:76` serves it in DEBUG; in prod, S3 or `nginx /media/` likely public), this leaks personal data of the chain of custody. **Fix:** `Pillow` `image.getexif().clear()` before save; or run through `pyvips`/`exiftool`.
- [ ] **E7. No sanity-check on vote totals vs `registered_voters`.** `PollingStation` has no `registered_voters` field exposed in result writes, no validator caps `votes` against it. `votes` is `PositiveIntegerField` so it accepts up to 2^31-1. **Attack:** admin POSTs `{"votes": 1000000}` for a 700-voter station — accepted silently, scales national totals. **Fix:** add `registered_voters` on `PollingStation`, validate `sum(votes) + rejected + disputed <= registered_voters` in serializer/view.
- [ ] **E8. No verification workflow code.** `is_verified` and `verified_by` exist on result models but no endpoint, signal, or admin action flips them. Anyone reading the API can't distinguish raw-uploaded from verified results. **Fix:** add `/api/results/<id>/verify/` endpoint behind a dedicated `IsVerifier` permission; require two-person sign-off (record `verified_by` + `co_signed_by`) before counting towards public totals.
- [ ] **E9. No append-only / tamper-evident log.** Once a result row exists, Django admin can delete or `UPDATE` it with no audit trail. **Fix:** `django-simple-history` (or `django-pgcrypto-fields` for hash-chain) on `PollingStation*Results` and `*Extras`. Restrict admin `delete_*` perm so even superusers can't silently rewrite.
- [ ] **E10. JSON parse + key access unguarded.** `results/api/views.py:570` `json.loads(client_data.get("data", "{}"))` — malformed JSON → 500. `:573` `data["polling_station"]` — KeyError after the line that *did* use `.get()`. Mixed defensive style; pick one. **Fix:** validate the whole payload through a `serializers.Serializer` and return DRF's standard 400.
- [ ] **E11. `IsAdminUser` + `is_staff` is the only thing protecting result uploads.** `results/api/views.py:564`. Combined with **C3 (signup writes `staff/admin/is_verified`)**, this is the full election-integrity kill chain: register → set `staff=True` → upload arbitrary votes for any station. Fix C3 first; then add a stricter permission like `IsAccreditedAgent` that checks `user.accreditation.station_id == polling_station.id` so an agent can only upload their assigned station.
- [ ] **E12. No rate-limit / submission-window on result writes.** A single compromised account can POST results for every station in the country in seconds. **Fix:** `ScopedRateThrottle` (e.g. 5/min per user) on `PollingStationResultsCreateAPIView`. Also reject submissions outside the publicly-known counting window.
- [ ] **E13. Geo-binding of submitter not enforced.** Nothing checks that the uploading user is *physically near* the polling station they're reporting on, or that their assigned `polling_center` matches the station code in the POST. `user.polling_center` exists on `accounts/models.py:73` — use it as a hard filter.

## I — Infra / Docker (incremental to C10-C13)

- [ ] **I1. `production.py` does NOT import from `base.py`.** `CommunityTally/settings/production.py:1-37` starts with `import os` and never does `from .base import *`. It has no `INSTALLED_APPS`, no `MIDDLEWARE`, no `DATABASES`. **Two failure modes:** (a) if `DJANGO_SETTINGS_MODULE=CommunityTally.settings.production`, Django crashes on startup — therefore prod is *not* using this module; (b) prod is using `settings/__init__.py` → `base.py` (+ optionally `local.py`), meaning **none of the HSTS / `SECURE_SSL_REDIRECT` / secure-cookie / `SECURE_PROXY_SSL_HEADER` settings ever load in production**. This is the same root cause as C11 but worse than first read: production.py is fundamentally unusable as-is. **Fix:** prepend `from .base import *`, then run `python manage.py check --deploy --settings=CommunityTally.settings.production`.
- [ ] **I2. `docker-compose.yml` exposes Postgres port `5432:5432` to host.** `src/docker-compose.yml:25-27`. If this compose file is ever run on a public host, the DB is reachable from the internet with whatever password is in `.env`. **Fix:** drop the `ports:` block (containers reach each other on the compose network), or bind to `127.0.0.1:5432:5432`.
- [ ] **I3. `web` service in compose runs `python manage.py runserver 0.0.0.0:8000`.** Duplicates C12; if dev compose is what's deployed, prod is on `runserver`.
- [ ] **I4. `DJANGO_SETTINGS_MODULE` commented out in compose env.** `src/docker-compose.yml:51`. Confirms the runtime is the broken `__init__.py` path, not `production.py`. **Fix:** set it explicitly per environment.
- [ ] **I5. No healthcheck on `web` or `db` services.** Compose can't tell when the DB is ready before `web` runs `migrate`. Migration runs on every `up` (`command: sh -c "python manage.py migrate && python manage.py runserver ..."`) — race on first boot. **Fix:** `healthcheck:` blocks; or split migrate into a one-shot service.
- [ ] **I6. Host `./` mounted into `/app` for `web`.** Fine in dev. Make sure prod image does **not** use this compose file (it would let host-side file changes hot-patch the running prod app).
- [ ] **I7. No reverse proxy / nginx in compose.** With C12 fixed (gunicorn), still need nginx (or Caddy) in front for TLS, static files, request-size limits, and rate-limits at the edge.
- [ ] **I8. `CELERY_TIMEZONE` set in production.py but no broker, no `celery.py`, no worker.** Dead config — either wire celery for async form34 processing / SMS OTP, or delete the line.

## T — Templates / XSS

- [ ] **T1. (Clean.) Grep for `|safe`, `mark_safe`, `format_html`, `autoescape off` across `templates/`, `accounts/templates/`, `ui/templates/`, and all app `*.py` files returned **zero matches**. Django auto-escaping is intact. Keep it that way — flag any future `|safe` in PR review.

## D — Database integrity / indexes

- [ ] **D1. Zero explicit `db_index=True` and zero `Meta.indexes` in any model.** `accounts/models.py`, `stations/models.py`, `results/models.py`, `historical/models.py` have `class Meta:` blocks only for `unique_together` / `verbose_name`. Django auto-indexes FKs and `unique=True` columns, but **not** the filter columns used in hot paths: `Aspirant.level`, `PollingCenter.is_verified`, `PollingCenter.ward_id` (auto, but covering index missing), `PollingCenterVerification.verified_by_id` (auto). The big N+1 queries flagged in H4 also do full sequential scans on these columns. **Fix:** `Meta.indexes = [models.Index(fields=["level"]), models.Index(fields=["is_verified", "pin_location"])]` etc. Run with `EXPLAIN` first.
- [ ] **D2. `Aspirant.first_name`-based upload path** (H5) plus no uniqueness on `(first_name, last_name, level, party)` — two candidates with the same first name can be created. **Fix:** `unique_together = ("first_name", "last_name", "level", "party")` or use a slug.
- [ ] **D3. No constraint that vote-row `aspirant.level == result-model.level`.** Enforced in Python `clean()` only (`results/models.py:188`). `bulk_create` / direct SQL bypasses it. **Fix:** `CheckConstraint` at DB level via `Meta.constraints`.

## Cov — Test coverage

- [ ] **Cov1. Overall 34% (htmlcov index). Excluding migrations/management commands, the lowest-coverage hot files are election-critical:**
  - `results/api/county_views.py` — **13%** (59 of 68 stmts uncovered)
  - `results/api/views.py` — **18%** (181/220 uncovered) — *this is where E1-E12 live*
  - `stations/api/views.py` — **22%** (61/78) — *this is C8 / verification writes*
  - `accounts/api/views.py` — **30%** (143/203) — *this is C1-C6, H1*
  - `results/api/national_views.py` — **29%**
  - `historical/api/views.py` — **35%**
  - `accounts/forms.py` — **38%**
  - `accounts/views.py` — **43%**

  **Fix:** before fixing E-items, write a regression test per item (`test_partial_writes_rollback`, `test_form34_overwrite_blocked`, `test_signup_cannot_set_staff`, `test_password_reset_requires_otp`). Then implement the fix. Aim for >80% on `*/api/views.py` files.

- [ ] **Cov2. Management commands at 0%.** Acceptable for one-shot loaders (`load_fake_results`, `parse_polling_station_data`) but **`create_100k_pres_results`** is a test-data generator — ensure it cannot run in prod (guard on `DEBUG` or `IS_PROD`).

- [ ] **Cov3. Security regression tests are not enforced by CI yet.** `src/results/test_killchain.py` documents E1/E2/E4/E11, but `src/setup.cfg:39` limits default pytest discovery to `accounts stations`, so the result-write kill-chain tests are easy to miss. **Fix:** include `results` in `testpaths`, ensure GitHub Actions runs the full security regression suite, and require these tests to pass before any audit item is marked closed.

## Mgmt / commands

- [ ] **Mgmt1. `create_100k_pres_results` and `load_fake_results` exist as management commands.** If invoked in prod (e.g. via `manage.py` shell on a compromised host) they pollute the real result tables with fake data. **Fix:** add `if not settings.DEBUG: raise CommandError("refusing to run in production")` at the top of each.

## UX / legal language and content safety

- [ ] **UX1. UI language can imply official outcomes.** The roadmap says "not official" and "no winner declaration", but the current UI still uses winner-like treatment such as `Leading` in `src/ui/src/dashboards/results/index.tsx:269` and winner highlighting in `NATIVE/app/(tabs)/communityNotes/[id]/components/ResultsTable.tsx:60`. **Fix:** ban "winner", "leading", celebratory styling, and official-looking outcome language unless explicitly rendering an IEBC-declared official result. Use neutral labels such as "highest reported in Kura Zetu submissions", "reported total", "pending confirmations", "contested", and "frozen".

- [ ] **UX2. Disclaimer must travel with the data, not just the landing page.** `README.md` has the right disclaimer, but public result screens, share images, CSV/JSON exports, API metadata, and embedded widgets can be separated from the homepage. **Fix:** add a standard `disclaimer` / `source_status` block to result API responses and render it on every results view, screenshot/share card, export, and public dashboard. Mirror in Kiswahili.

- [ ] **UX3. Add a quarantine path for illegal or abusive uploads.** Form 34A is a public election document and is also shared through the IEBC portal, so the platform should not treat genuine forms as private by default. The missing control is for uploads that are not valid Form 34A evidence or contain illegal/abusive material, malware payloads, threats, doxxing outside the form context, or manipulated media. **Fix:** store new evidence as `quarantined` until it passes MIME/magic-byte/image checks and Form 34A pre-checks; allow a narrow incident role to hide or quarantine content without changing the tally; log every quarantine action publicly enough to prevent silent censorship while protecting clearly unlawful content.

## Things genuinely fine (clarifications)

- Templates audited clean (T1).
- CSRF middleware present (`base.py:70`) and `csrf_token` used in login + password-reset templates.
- DRF result rows have `unique_together` on `(polling_station, candidate)` — prevents naive double-insert per candidate (but E1/E4 still bypass-able via partial commits / Extras dupes).
- `votes` is `PositiveIntegerField` — no negative values.
- `Aspirant.clean()` enforces level↔geography binding.

---

## Updated kill chain (election fraud, end-to-end)

The most damaging attack with *zero* prior access:

1. `POST /api/accounts/signup/` with `{"data": {"phone_number": "...", "password": "...", "staff": true, "admin": true, "is_verified": true}}` (C3, C4).
2. `POST /api/accounts/login/` → DRF token (C6, never expires).
3. `POST /api/results/polling-station/create/<any_code>/presidential/` with crafted votes for any of 46k+ stations. Permission check is just `IsAdminUser` = `is_staff` — passes (E11).
4. Submit any image (no MIME check, H2) — server saves as `form34A.jpg`, overwriting genuine uploads (E3).
5. No `atomic()`: race two requests, get partial rows the aggregator picks up (E1).
6. No throttle (C14, E12): script the whole country in minutes.
7. No `verified_by` enforcement (E8): UI cannot distinguish your fake from a real submission.
8. National total endpoints (`results/api/views.py:366`) read straight from these tables → fraudulent count is the public count.

**The minimum patches that close this chain:** C3 (read-only fields on serializer) + E1 (atomic) + E11 (geo-bound permission) + E8 (verification workflow) + C14 (throttle). The other items are defence-in-depth around this chain.

---

## Suggested updated priority order

1. **Today (before any election-data exposure):** C3, E1, E11, E8 minimum-viable, E4, E7, C14, I1.
2. **This week:** C1, C2, C10, C11/I1 (settings load), C12/I3 (gunicorn), C13, H1, E2, E3, E5.
3. **Pre-election:** E6, E9, E12, E13, H2, H4, I2, I5, I7, D1.
4. **Public-trust polish:** UX1/UX2/UX3 before any public election-facing launch.
5. **Post-election cleanup:** M-series, L-series, T1 watch, refactor results views, Cov targets >80% on `api/views.py`.
