# Kura Zetu Deployment & Hardening Plan

**Target stack:** bare VPS, Ubuntu LTS, Cloudflare (proxied DNS) -> NGINX -> Gunicorn -> Django -> Postgres (PostGIS) + Redis.
**Scale target:** 100k-300k concurrent-ish users, read-heavy, with bursty write traffic around an election window.
**Frontend:** single `index.html` SPA served from same origin, all data via `/api/*`.
**Date:** 2026-05-17.

This document is the operations companion to `audit.md`. Audit.md fixes the code; this file makes the deployed system survive real traffic.

Action checkboxes track follow-up work. Sections are roughly ordered "outside in" (Cloudflare first, code last).

---

## 0. Realistic scale ceiling (read this first)

A single 4 vCPU / 8 GB VPS, NGINX + 9 gunicorn workers + tuned Postgres, with Cloudflare in front, can comfortably handle:

- ~5k-10k requests/second on **cacheable GETs** (most traffic is served by Cloudflare, origin never sees it).
- ~150-400 requests/second on **uncached origin reads** (DB-backed).
- ~30-80 requests/second on **writes** (Form 34A upload, signup, votes-create) before Postgres or disk I/O becomes the bottleneck.

"Hundreds of thousands of users" is fine if 95% of their traffic is GETs that Cloudflare can cache. It is **not fine** if every user is simultaneously uploading a Form 34A. The mitigation is not "more code", it is queueing, edge caching, and being willing to vertical-scale the VPS the week of the election.

Plan for: scale up VPS before election day, add a Postgres read replica, fall back to Cloudflare-only static if origin dies.

---

## 1. Cloudflare (the cheapest perf + security win)

Cloudflare in front of you is doing 80% of the work. Configure it deliberately.

- [ ] **CF1. SSL/TLS mode: "Full (strict)".** SSL/TLS -> Overview. Anything less and CF can fetch your origin over HTTP, undoing HSTS.
- [ ] **CF2. Authenticated Origin Pulls.** SSL/TLS -> Origin Server -> "Authenticated Origin Pulls" + install CF's client cert on NGINX. Origin then rejects any request that did not come through Cloudflare. Closes the "attacker finds origin IP" hole.
- [ ] **CF3. Hide origin IP.** Do not point any other A/AAAA record (mail, staging, vpn) at the same host as `kurazetu.example`. Use a separate VPS / subdomain or you lose CF2's value via DNS history lookup.
- [ ] **CF4. WAF managed rulesets ON.** Security -> WAF. Enable "Cloudflare Managed Ruleset" and "OWASP Core Ruleset" in Block mode after a week of Log mode tuning.
- [ ] **CF5. Bot Fight Mode ON** (free plan) or "Super Bot Fight Mode" (Pro). Bots flooding `/api/results/total-votes/presidential/` is the obvious DoS vector.
- [ ] **CF6. Rate limiting rules.** Security -> WAF -> Rate limiting rules. Set:
  - `POST /api/accounts/login/` -> 10 / 10 minutes per IP, action Challenge.
  - `POST /api/accounts/signup/` -> 5 / hour per IP, action Block.
  - `POST /accounts/password-reset/` -> 3 / hour per IP, Block.
  - `POST /api/results/polling-station/create/*` -> 30 / minute per IP, Block.
  - Defence in depth with DRF throttle (see section 8).
- [ ] **CF7. Cache rules for `/api/*` GETs.** Caching -> Cache Rules. Match `request.uri starts_with "/api/results/total-votes/"` -> Cache: Eligible for caching, Edge TTL: 30 seconds, Browser TTL: 0, "Bypass cache on cookie" off (the data is public). This is your headline perf win.
- [ ] **CF8. Cache rule for `/` (SPA shell).** index.html -> Edge TTL 5 minutes, Browser TTL 0, "Always serve stale on error" ON. Hash-named JS/CSS bundles get Edge TTL 1 year.
- [ ] **CF9. "Always Online" ON.** Caching -> Configuration. Serves a stale snapshot if origin is down. Worth it.
- [ ] **CF10. Argo Smart Routing** (~$5/mo) for users in EU/US hitting a KE-hosted origin. Real RTT improvement. Skip if origin is in-region.
- [ ] **CF11. Page Rules / Transform Rules: strip `Server` header, set CSP.** Cheaper than configuring it in Django for static responses.
- [ ] **CF12. Cloudflare Tunnel** for SSH / admin. Replace `ssh -p 22 ip` with `cloudflared access ssh`. Removes port 22 from the public internet.
- [ ] **CF13. Access policy on `/admin/` and `/{ADMIN_URL_SUFFIX}/`.** Zero Trust -> Access -> Applications. Restrict to your team email / IP. Free for up to 50 users. Layer this in front of Django OTP for defence in depth.
- [ ] **CF14. Country block (if appropriate).** During election window, consider blocking countries with zero legitimate users. Cheap; reversible.

**Pushback:** do **not** enable "Caching Level: Cache Everything" globally. It will cache authenticated API responses across users. Use Cache Rules per-URL only.

---

## 2. NGINX (TLS termination, static, reverse proxy)

- [ ] **NX1. NGINX listens on 443 only.** Cloudflare handles port 80 redirect. NGINX cert = Cloudflare Origin CA cert (15 year, free), pinned via Authenticated Origin Pulls (CF2).
- [ ] **NX2. Set `real_ip` from Cloudflare ranges.** Otherwise every request looks like it comes from CF's IPs and your rate-limits / logs are useless.
  ```nginx
  # /etc/nginx/conf.d/cloudflare-realip.conf
  set_real_ip_from 173.245.48.0/20;
  set_real_ip_from 103.21.244.0/22;
  # ... full list from https://www.cloudflare.com/ips/
  real_ip_header CF-Connecting-IP;
  ```
  Refresh monthly with a cron that pulls https://www.cloudflare.com/ips-v4 and reloads NGINX.
- [ ] **NX3. Limits.**
  ```nginx
  client_max_body_size 15M;             # Form 34A cap. Match Django DATA_UPLOAD_MAX_MEMORY_SIZE.
  client_body_timeout 30s;
  send_timeout 30s;
  keepalive_timeout 65s;
  keepalive_requests 1000;
  limit_req_zone $binary_remote_addr zone=api:10m rate=20r/s;
  limit_conn_zone $binary_remote_addr zone=conn:10m;
  ```
  Apply `limit_req zone=api burst=40 nodelay;` on `/api/`. Belt-and-braces with CF6.
- [ ] **NX4. Gzip + Brotli on JSON / HTML / JS / CSS.** Install `nginx-module-brotli`, enable for `application/json` etc. ~70% size reduction on result-tally JSON.
- [ ] **NX5. Static files served by NGINX, not Django.** Whitenoise is fine in a pinch but NGINX is faster and frees a gunicorn worker.
  ```nginx
  location /static/ { alias /srv/kurazetu/staticfiles/; expires 1y; add_header Cache-Control "public, immutable"; }
  location /media/  { alias /srv/kurazetu/media/; }   # but see section 11, move media to R2/S3
  ```
- [ ] **NX6. Reverse proxy to gunicorn over UNIX socket** (not TCP). Faster, simpler firewalling.
  ```nginx
  upstream django { server unix:/run/gunicorn/kurazetu.sock fail_timeout=0; }
  location / {
      proxy_pass http://django;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_redirect off;
      proxy_buffering on;
      proxy_read_timeout 60s;
  }
  ```
- [ ] **NX7. Security headers** (only what CF does not already set):
  ```nginx
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "geolocation=(self), camera=(), microphone=()" always;
  # CSP is fiddly; build it iteratively in Report-Only first.
  ```
- [ ] **NX8. Block obvious crawlers / probes.** `location ~ \.(env|git|sql|bak)$ { return 404; }`.
- [ ] **NX9. Log format with `$http_cf_ray` and `$request_time`.** Lets you join CF logs with origin logs and spot slow endpoints.
- [ ] **NX10. Disable `server_tokens`.** `server_tokens off;` in `http {}`.

---

## 3. Gunicorn

- [ ] **GU1. Workers = `2 * vCPU + 1`** for sync, or fewer with threads. On a 4 vCPU box: 9 sync workers or 3 workers x 4 threads (`--workers 3 --threads 4 --worker-class gthread`). I/O-bound (DB calls, image upload) benefits from `gthread`. Do not use `gevent` unless you have audited every blocking call.
- [ ] **GU2. `--max-requests 1000 --max-requests-jitter 100`.** Recycles workers to bound memory growth (Pillow + PostGIS queries leak slowly).
- [ ] **GU3. `--preload`** loads the app once before forking. Cuts memory ~30% via copy-on-write. Disables auto-reload (fine in prod).
- [ ] **GU4. `--timeout 60 --graceful-timeout 30`.** Form 34A upload + thumbnailing can take 10-20s. 60s is generous; reject above.
- [ ] **GU5. `--access-logfile -` to stdout** so journald / systemd picks it up. Same for error log.
- [ ] **GU6. Bind to UNIX socket.** `--bind unix:/run/gunicorn/kurazetu.sock`. Match NX6.
- [ ] **GU7. Run under systemd, not nohup or screen.** Service file template:
  ```ini
  # /etc/systemd/system/kurazetu.service
  [Unit]
  Description=Kura Zetu gunicorn
  After=network.target postgresql.service redis.service
  Requires=postgresql.service redis.service

  [Service]
  User=kurazetu
  Group=www-data
  WorkingDirectory=/srv/kurazetu/src
  EnvironmentFile=/srv/kurazetu/.env
  ExecStart=/srv/kurazetu/venv/bin/gunicorn \
      --workers 3 --threads 4 --worker-class gthread \
      --max-requests 1000 --max-requests-jitter 100 \
      --preload --timeout 60 --graceful-timeout 30 \
      --bind unix:/run/gunicorn/kurazetu.sock \
      --access-logfile - --error-logfile - \
      CommunityTally.wsgi:application
  Restart=on-failure
  RestartSec=5
  RuntimeDirectory=gunicorn
  RuntimeDirectoryMode=0775

  [Install]
  WantedBy=multi-user.target
  ```
- [ ] **GU8. Drop privileges.** `User=kurazetu`, a non-login user with no sudo. Match the file ownership of `/srv/kurazetu`.

---

## 4. Django settings for production

This section depends on audit item **I1** (production.py currently does not import base). Fix that first.

- [ ] **DJ1. `from .base import *` at the top of `production.py`.** Then override only what differs.
- [ ] **DJ2. `DEBUG = False`** (already inherits, but assert it explicitly).
- [ ] **DJ3. `ALLOWED_HOSTS = ["kurazetu.example", "www.kurazetu.example"]`** from env. Do **not** include `*`.
- [ ] **DJ4. `SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")`** is correct but only safe because NGINX strips any incoming header of the same name. Confirm with `proxy_set_header X-Forwarded-Proto $scheme;` in NX6.
- [ ] **DJ5. `CSRF_TRUSTED_ORIGINS = ["https://kurazetu.example"]`.** Required for Django 4+.
- [ ] **DJ6. `SECURE_HSTS_SECONDS = 31536000` (1 year), `SECURE_HSTS_PRELOAD = True`, `SECURE_HSTS_INCLUDE_SUBDOMAINS = True`.** Submit to hstspreload.org **only after** you are sure every subdomain serves TLS.
- [ ] **DJ7. `SECURE_SSL_REDIRECT = True`, `SESSION_COOKIE_SECURE = True`, `CSRF_COOKIE_SECURE = True`, `SESSION_COOKIE_HTTPONLY = True`, `SESSION_COOKIE_SAMESITE = "Lax"`.**
- [ ] **DJ8. Remove `CORS_ORIGIN_ALLOW_ALL`** (audit C10). Use `CORS_ALLOWED_ORIGINS` only. If frontend is same-origin, you can drop CORS middleware entirely.
- [ ] **DJ9. `DATA_UPLOAD_MAX_MEMORY_SIZE = 15 * 1024 * 1024`** (15 MB). Match NX3.
- [ ] **DJ10. `LOGGING` config with stdout JSON handler.** Section 13.
- [ ] **DJ11. `python manage.py check --deploy --settings=CommunityTally.settings.production`** must exit clean before any deploy. Wire into CI.

---

## 5. OTP for backend login

You already have `django_otp` + `OTPAdminSite` wired. Two flows to add:

### 5a. Admin / staff (TOTP, free)

- [ ] **OTP1. Require `django-two-factor-auth`** (`pip install django-two-factor-auth[phonenumberslite]`). Wraps `django_otp` with friendly enrollment views.
- [ ] **OTP2. URL wiring:** `path("account/", include("two_factor.urls", "two_factor"))`. Replace your own login view's redirect for staff.
- [ ] **OTP3. `LOGIN_URL = "two_factor:login"`** in production settings.
- [ ] **OTP4. Force enrollment via `OTP_LOGIN_URL` middleware** for any user with `is_staff=True`.
- [ ] **OTP5. Backup codes mandatory.** `TWO_FACTOR_REMEMBER_COOKIE_AGE = 0` (no "trust this device") on admin role.

### 5b. Regular users (SMS OTP for signup + password reset)

This is the fix for audit **C1** (password reset has no verification).

- [ ] **OTP6. SMS provider: AfricasTalking** (KE-native, cheap, ~KSh 0.80/SMS). Account + sender ID approval is the long pole; start now.
- [ ] **OTP7. Model:** `PhoneOTP(phone_number, code_hash, expires_at, attempts, used_at)`. Store **sha256 hash of the code**, not the code itself. 6 digit code, 5 min expiry, 5 attempts max, single use.
- [ ] **OTP8. Endpoints:**
  - `POST /api/accounts/otp/request/` body `{phone_number, purpose: "signup|reset"}` -> sends SMS, returns `{request_id}`. Rate-limit 1 req / 60s / phone (DB or Redis), 5 / hour / IP.
  - `POST /api/accounts/otp/verify/` body `{request_id, code}` -> on success, returns a single-use signed token good for 10 min, scoped to `purpose`. That token is what `POST /signup/` and `POST /password-reset/confirm/` accept.
- [ ] **OTP9. Send via Celery task** (section 12), not synchronously, or signup latency = SMS provider latency.
- [ ] **OTP10. Log only the request_id, never the code.** SMS bodies are not logged at the provider in human-readable form for >24h.
- [ ] **OTP11. Throttle costs.** SMS sent without verify is wasted money. Cap to 3 sends per phone per day; cap to N sends per IP per day; reject if `request_id` already verified.
- [ ] **OTP12. Voice fallback** (AfricasTalking supports it) for users on feature phones / poor signal. Optional, but consider for accessibility.

**Pushback:** SMS OTP is not free and is not infallible (SIM swap, delayed networks). For high-value accounts (admins) prefer TOTP. For password reset of regular voters, SMS + a 24h cool-off after reset before the account can upload anything is a pragmatic compromise.

---

## 6. Postgres (PostGIS)

- [ ] **PG1. Pin Postgres + PostGIS version** (`postgis/postgis:14-3.3` is what compose uses; pin in prod too). Test major version upgrades on a staging dump.
- [ ] **PG2. Bind to `localhost` only.** `listen_addresses = 'localhost'` in `postgresql.conf`. Closes audit I2.
- [ ] **PG3. `scram-sha-256` password auth, not md5.** `pg_hba.conf`.
- [ ] **PG4. Tuned defaults for 8 GB box.** Run https://pgtune.leopard.in.ua/ with your specs and apply. Key ones:
  ```
  shared_buffers = 2GB
  effective_cache_size = 6GB
  work_mem = 16MB
  maintenance_work_mem = 512MB
  max_connections = 100         # see PG5 about pooling
  random_page_cost = 1.1         # SSD
  wal_compression = on
  ```
- [ ] **PG5. PgBouncer in transaction mode.** Django opens a connection per request; with `--workers 9 --threads 4` that is up to 36 connections. PgBouncer pools that down to ~20 real PG connections, lets you bump worker count without exploding PG. `pool_mode = transaction`. Note: prepared statements need extra config in Django (`DISABLE_SERVER_SIDE_CURSORS = True` for transaction mode pre-PG14).
- [ ] **PG6. Add the missing indexes (audit D1).** Run with `EXPLAIN ANALYZE` first; do not blanket-index.
- [ ] **PG7. WAL archiving + base backups.** `wal-g` or `pgbackrest` to Cloudflare R2 / Backblaze B2 (cheap egress). Daily full + continuous WAL = point-in-time recovery to any second. Test restore quarterly.
- [ ] **PG8. Read replica for the election window.** Streaming replication to a second VPS. Wire DRF to a read-replica DB router for the heavy `/api/results/total-votes/*` GETs. Optional but high impact.
- [ ] **PG9. `pg_stat_statements` extension enabled.** Drive the H4 N+1 fix from real slow-query data, not guesses.
- [ ] **PG10. Connection security.** No SSL needed for `localhost`. If you ever go off-box, require SSL.

---

## 7. Redis

Redis does triple duty: cache, session backend, throttle backend, Celery broker.

- [ ] **RD1. Single Redis instance on the VPS.** `bind 127.0.0.1`, `requirepass <strong>`, `protected-mode yes`. No reason to expose it.
- [ ] **RD2. `maxmemory 1gb`, `maxmemory-policy allkeys-lru`** for the cache portion. Use separate logical DBs (`/0` cache, `/1` celery broker, `/2` celery result backend, `/3` sessions).
- [ ] **RD3. `appendonly no` for the cache DB**, AOF on for the broker DB (so unsent SMS OTPs are not lost on crash).
- [ ] **RD4. Django config:**
  ```python
  CACHES = {
      "default": {
          "BACKEND": "django.core.cache.backends.redis.RedisCache",
          "LOCATION": "redis://:PASS@127.0.0.1:6379/0",
          "TIMEOUT": 60,
      }
  }
  SESSION_ENGINE = "django.contrib.sessions.backends.cache"
  SESSION_CACHE_ALIAS = "default"
  ```
- [ ] **RD5. DRF throttle uses Redis (via the default cache).** No extra config needed; `AnonRateThrottle` and `UserRateThrottle` write through the configured cache.

---

## 8. API caching strategy (the headline perf section)

Two layers: **Cloudflare edge** (your free CDN) and **Redis at origin** (Django cache framework).

### 8a. What to cache where

| Endpoint | Edge (CF) | Origin (Redis) | TTL | Vary on |
|---|---|---|---|---|
| `GET /` (SPA shell) | yes | no | 5 min | nothing |
| `GET /static/*.js`, `.css` | yes | no | 1 year | nothing (hash in filename) |
| `GET /api/results/total-votes/presidential/` | **yes** | yes | 30s edge, 30s origin | nothing (public) |
| `GET /api/results/county/<id>/` | yes | yes | 30s | URL only |
| `GET /api/results/polling-center/<code>/` | yes | yes | 60s | URL only |
| `GET /api/stations/polling-centers/<id>/boundary/` | yes | yes | 24h | URL only |
| `GET /api/historical/*` | yes | yes | 24h | URL only |
| `GET /api/accounts/me/` | no | no | n/a | per user |
| `POST /api/*` | no | no | n/a | n/a |

- [ ] **CACHE1. Audit M4: bump origin cache TTL from 3s to 30-60s with jitter.** Audit calls this out; do it.
- [ ] **CACHE2. `Cache-Control` headers from Django on cacheable endpoints.**
  ```python
  from django.views.decorators.cache import cache_control
  @cache_control(public=True, max_age=30, stale_while_revalidate=60)
  ```
  Cloudflare respects this. Stale-while-revalidate is gold: under load, CF serves a stale copy while one request through to origin refreshes the cache.
- [ ] **CACHE3. ETag / Last-Modified on result endpoints.** Django middleware `ConditionalGetMiddleware`. Lets clients get 304 Not Modified, dramatically cuts bytes shipped during election-day polling.
- [ ] **CACHE4. Avoid `Vary: Cookie` on cacheable responses.** If the response is the same for every user, do not set a Cookie. Cloudflare will not cache a `Vary: Cookie` response by default.
- [ ] **CACHE5. Cache invalidation strategy: short TTL + jitter + lock.** Election results change frequently; rather than building a tag-based invalidation system, use 30s TTL with cache-stampede protection.
  ```python
  from django.core.cache import cache
  def cached_or_compute(key, compute, ttl=30):
      val = cache.get(key)
      if val is not None: return val
      with cache.lock(f"{key}:lock", timeout=10):
          val = cache.get(key)               # re-check inside lock
          if val is not None: return val
          val = compute()
          cache.set(key, val, ttl)
          return val
  ```
- [ ] **CACHE6. Do not cache responses that include `request.user`.** Trivial leakage of one user's data to another. Enforce via a custom decorator that asserts `user.is_anonymous`.
- [ ] **CACHE7. Cloudflare cache purge on result publication.** When IEBC officially declares, you may want to force-bust `/api/results/*`. Use the CF API from a Django management command.

### 8b. Frontend hints

- [ ] **FE1. Single `index.html` -> hash-named bundles** (Webpack already produces `main.<hash>.js`). HTML is short TTL; bundle is forever-TTL.
- [ ] **FE2. SWR or React Query on the client.** Stale-while-revalidate at the browser layer means polling every 5s feels instant even with 30s server cache.
- [ ] **FE3. Don't poll if you can WebSocket** for live results. Realistically: out of scope for an election deadline. Polling with ETag is fine.

---

## 9. Static files

- [ ] **ST1. `collectstatic` at build time**, output to `/srv/kurazetu/staticfiles/`, served by NGINX (NX5). Skip Whitenoise; saves a worker.
- [ ] **ST2. Hash-named static via Webpack manifest** (already in place per docker-compose). Set `STATIC_URL = "/static/"` and let NGINX set `Cache-Control: public, immutable, max-age=31536000`.

---

## 10. Media (Form 34A images)

Right now form34A images go to local disk (`MEDIA_ROOT`) served by NGINX from `/media/`. Two problems:

1. Disk fills (47k stations x ~2 MB image = 94 GB).
2. If origin dies, evidence is gone with it.

- [ ] **MD1. Move media to S3-compatible object storage.** Best free egress: **Cloudflare R2** (no egress fees, S3 API compatible). Backblaze B2 is the next-best.
- [ ] **MD2. `django-storages` + `boto3`.**
  ```python
  STORAGES = {
      "default": {"BACKEND": "storages.backends.s3.S3Storage",
                  "OPTIONS": {"bucket_name": "kurazetu-media",
                              "endpoint_url": "https://<account>.r2.cloudflarestorage.com",
                              "default_acl": None,
                              "querystring_auth": True,
                              "file_overwrite": False}},
      "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
  }
  ```
  `file_overwrite=False` closes audit E3 (predictable filename overwrite).
- [ ] **MD3. Serve media via Cloudflare** with a custom domain pointing at the R2 bucket. Public images are cached at edge for free.
- [ ] **MD4. Validate uploads.** Audit H2. `python-magic` for MIME, Pillow `verify()` to confirm decodable, max size 8 MB (Form 34A is a single page photo), strip EXIF (audit E6).
- [ ] **MD5. Store SHA256 of every uploaded file** (audit E5). Indexed column for dedup detection.
- [ ] **MD6. Lifecycle policy on R2** to keep originals indefinitely but tier infrequently accessed.

---

## 11. Background jobs (Celery)

Currently zero async tasks but `CELERY_TIMEZONE` is set (audit I8). Two genuine needs: SMS OTP send, Form 34A image post-processing (EXIF strip, thumbnail, hash).

- [ ] **BG1. Celery worker + beat under systemd, Redis broker.** Reuse the same Redis instance, separate logical DB (RD2).
- [ ] **BG2. One worker process, `--concurrency=4 --pool=prefork`.** No gevent.
- [ ] **BG3. Queue routing:** `sms_otp` (priority), `image_processing` (bulk). Do not let bulk jobs starve SMS.
- [ ] **BG4. Task idempotency.** SMS retry must not double-send; use a (phone, request_id) lock.
- [ ] **BG5. Result backend off** (`CELERY_RESULT_BACKEND = None`) unless you actually need results. Saves Redis.
- [ ] **BG6. Soft + hard time limits.** `task_soft_time_limit=20, task_time_limit=30` so a hung SMS API call cannot park a worker forever.

---

## 12. Logging & monitoring

- [ ] **LG1. Structured JSON logs to stdout.** `python-json-logger`. Captured by `journald`, shipped by Vector / Promtail to a log aggregator.
- [ ] **LG2. Sentry (or self-host GlitchTip).** Auto-captures exceptions. `traces_sample_rate=0.05` for performance. Free tier is generous.
- [ ] **LG3. Strip request/response bodies** from Sentry events (`send_default_pii=False`). Audit H1 found `print(request.data)` logging passwords; same risk in Sentry breadcrumbs.
- [ ] **LG4. Uptime checks.** UptimeRobot or BetterStack free tier: every 1 min on `/healthz` (add this view, returns 200 + DB ping).
- [ ] **LG5. NGINX access logs to disk + log rotation** (`logrotate`, 14d retention).
- [ ] **LG6. Cloudflare Logpush** (Pro plan) for edge logs, or skip and rely on origin.
- [ ] **LG7. Postgres slow query log.** `log_min_duration_statement = 500ms`. Tells you when audit H4 N+1s creep back.
- [ ] **LG8. Disk + CPU + memory alerts.** Netdata Cloud (free), or Prometheus + Alertmanager. Page on disk >85%, swap >0, load >cpu_count * 2.

---

## 13. Backups & disaster recovery

- [ ] **BK1. Postgres: `pgbackrest` daily full + WAL streaming to Backblaze B2.** Retain 30 days. Cost: pennies / month for a 5 GB DB.
- [ ] **BK2. R2 media has versioning ON.** Free; rescues accidental deletes.
- [ ] **BK3. `.env` and NGINX config in a private git repo,** secrets via `sops` (age key offline).
- [ ] **BK4. Restore drill quarterly.** Spin up a throwaway VPS from the latest backup, run `manage.py check`, verify a known polling-center count. Untested backups are theoretical backups.
- [ ] **BK5. Runbook for "origin is down on election day"** as a one-pager: who has root, where the DNS lives, how to flip CF to "Always Online" only, contact for VPS vendor.

---

## 14. OS hardening on the VPS

- [ ] **OS1. Unattended-upgrades** for security patches (`apt install unattended-upgrades`).
- [ ] **OS2. UFW firewall: allow 443/tcp from Cloudflare IPs only,** 22/tcp from your home / Tailscale only, deny everything else. With CF12 (Tunnel) you can drop 22 entirely.
- [ ] **OS3. SSH: key-only,** no password, no root login, port 22 (or move to high port if not using Tunnel).
- [ ] **OS4. Fail2ban on sshd + nginx auth logs.**
- [ ] **OS5. Separate `kurazetu` user** for the app, no sudo. Postgres + Redis as their own daemon users.
- [ ] **OS6. `/srv/kurazetu` owned by `kurazetu:www-data`, mode 750.** Media + staticfiles group-readable by `www-data` (NGINX).
- [ ] **OS7. `/tmp` and `/var/tmp` `nosuid,nodev,noexec` mount options.**
- [ ] **OS8. Swap file = RAM size.** Cheap insurance against OOM during peak.
- [ ] **OS9. AppArmor profiles for nginx, postgres** (Ubuntu ships them; leave enabled).
- [ ] **OS10. Time sync.** `systemd-timesyncd` enabled. OTP codes depend on it.

---

## 15. Deployment process

Your sentence was cut off; this is the recommended pipeline. Adjust to taste.

- [ ] **DP1. Single `main` branch is deployable.** Feature branches via PR. CI runs `pytest`, `python manage.py check --deploy`, `bandit -ll`, `pip-audit`.
- [ ] **DP2. Build once, deploy artifact.** GitHub Actions builds:
  - Python wheel / virtualenv tarball.
  - Static + webpack bundle.
  - Tag with git SHA.
  Push to Backblaze B2 / R2 as a release artifact, or to GitHub Releases.
- [ ] **DP3. Server pulls, not pushes.** A small `deploy.sh` on the VPS, triggered by SSH or via a webhook, does:
  ```sh
  set -e
  cd /srv/kurazetu
  git fetch && git checkout "$1"   # or download artifact
  ./venv/bin/pip install -r requirements.txt --require-hashes
  ./venv/bin/python src/manage.py migrate --noinput
  ./venv/bin/python src/manage.py collectstatic --noinput
  sudo systemctl reload nginx
  sudo systemctl restart kurazetu kurazetu-celery
  ```
  Gunicorn `--reload` is for dev only; in prod do a clean `restart`.
- [ ] **DP4. Migrations are reviewed manually** before deploy. CI flag any migration with `RunPython` or column drops; require human sign-off.
- [ ] **DP5. Zero-downtime restart.** Run two gunicorn instances behind NGINX upstream, restart one at a time. Or simpler: `systemctl restart kurazetu` is ~1s outage; with CF "Always Online" + retry-on-error, users see nothing.
- [ ] **DP6. Rollback = redeploy previous SHA.** Test it once before you need it.
- [ ] **DP7. No prod shell access during election day.** Lock the deploy script to a release window.
- [ ] **DP8. Health gate.** After restart, deploy script polls `/healthz` for 200; if it does not come up in 30s, restart the previous SHA and page someone.

---

## 16. Canonical / managed product alternatives (the "curious" section)

You asked about "Charms for DB" etc. Two reads of that:

1. **Canonical's actual Juju Charms** are operator packages for self-hosting on top of Juju / Kubernetes / LXD. There are charms for Postgres, Redis, NGINX, Prometheus, etc. (See `charmhub.io`.) They are real, but Juju is heavy for a single-VPS deploy. Skip unless you adopt Juju across the org.
2. **"Canonical / boringly-good managed products"** for each layer, so you do not run them yourself. This is what most teams reach for.

| Layer | Self-host (current plan) | Managed option | Notes |
|---|---|---|---|
| DB | Postgres on VPS | Crunchy Bridge, Neon, Supabase, Render PG, AWS RDS, DigitalOcean Managed PG | Crunchy Bridge is the most Postgres-purist. Neon has cheap branching for staging. Supabase bundles auth + storage but is opinionated. |
| Cache / broker | Redis on VPS | Upstash, Redis Cloud, AWS ElastiCache | Upstash has a generous free tier and per-request pricing. Good fit for bursty. |
| Object storage | R2 (already recommended) | Backblaze B2, Wasabi, AWS S3 | R2 wins on egress (free), B2 wins on simplicity. |
| CDN / WAF | Cloudflare (already) | Fastly, Bunny.net, AWS CloudFront | Cloudflare's free tier is unmatched. Bunny is cheaper for bandwidth-heavy. |
| SMS | AfricasTalking | Twilio, Vonage, MessageBird | AfricasTalking is the right answer for Kenya. |
| Email (transactional) | n/a yet | Postmark, AWS SES, SendGrid, Mailgun | Postmark for transactional, SES for cheap bulk. |
| Error tracking | n/a yet | Sentry, GlitchTip (self-host clone), Bugsnag | Sentry is the default. GlitchTip if you must self-host. |
| Log aggregation | journald + nothing | BetterStack Logs, Axiom, Loki + Grafana Cloud | Axiom has a generous free tier. |
| Metrics / APM | n/a yet | Sentry Performance, Grafana Cloud, Datadog, New Relic | Grafana Cloud free tier covers a single-VPS deploy. |
| Uptime checks | n/a yet | BetterStack, UptimeRobot, Pingdom | UptimeRobot is free and enough. |
| Identity / OTP | django-otp + AT | Auth0, Clerk, Stytch, FusionAuth | Heavy for this scope. Stay with django-otp + AfricasTalking. |
| Background jobs | Celery + Redis | Render Background Workers, AWS SQS + Lambda | Stick with Celery; cost and learning curve do not justify a swap. |
| Container orchestration | systemd | Fly.io, Render, Railway, ECS, Kubernetes | Fly.io is the smoothest "I outgrew a VPS" option. K8s is wildly over-budget for this. |
| Backups | wal-g / pgbackrest -> B2 | Crunchy Bridge has built-in PITR, RDS snapshots | If you move DB to managed, backups become someone else's problem. |
| Secrets | `.env` + sops | Doppler, AWS Secrets Manager, Infisical, Vault | sops + age is fine for a small team. |

**Pushback:** every managed product trades money + lock-in for ops time. For a project that needs to survive ~6 weeks of intense election traffic and then a long tail of historical reads, **self-hosting on one VPS with Cloudflare in front is the lowest-risk choice**. Move to managed Postgres only if pg ops are eating your time. Do not adopt Kubernetes for this; it is the wrong tool.

---

## 17. Pre-election cutover checklist (run T-7 days)

- [ ] All `audit.md` C-items closed.
- [ ] All `audit.md` E-items (election integrity) closed.
- [ ] `python manage.py check --deploy` exit code 0 against production settings.
- [ ] Cloudflare WAF + rate limits in Block mode, tested with `curl`.
- [ ] Authenticated Origin Pulls verified: hit origin IP directly, get 403.
- [ ] Backup + restore drill done on staging.
- [ ] Read replica streaming, lag < 1s.
- [ ] Sentry receiving events; uptime monitor green.
- [ ] OTP send path tested end to end with real phone, real SMS.
- [ ] Load test: `k6 run` simulating 5x expected peak on cacheable + uncacheable paths. Origin holds.
- [ ] Runbook printed, contacts confirmed, rollback script tested.

---

## 18. Things to deliberately *not* do (anti-patterns)

- Do not put `runserver` behind NGINX. (audit C12)
- Do not run Celery with `gevent` until every blocking call has been audited.
- Do not enable Cloudflare "Cache Everything" globally.
- Do not set `Vary: Cookie` on public endpoints (kills CDN cache).
- Do not store passwords or `request.data` in any logger. (audit H1)
- Do not deploy on Friday afternoon.
- Do not adopt Kubernetes for one VPS. Resist the urge.
- Do not use SQLite "for the small tables". One DB.
- Do not run migrations from CI; run them on the box as part of `deploy.sh`. Easier to roll back.
- Do not enable HSTS preload until you have run with `HSTS_SECONDS = 31536000` for at least a week without breakage. Preload is one-way for ~6 months.

---

## 19. Your existing deployment recipe (annotated)

This is the recipe you sent. Each block is annotated with `[harden]` notes that point back to the relevant section above. Treat the original as the *baseline*; the hardening notes are the diff to get to production-grade.

### 19.1 Server bootstrap

```bash
sudo apt update
sudo apt install python3-pip python3-dev python3-venv libpq-dev nginx curl zsh

# oh-my-zsh + plugins (developer ergonomics, not security)
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
git clone https://github.com/zsh-users/zsh-autosuggestions   ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
```

```zsh
# ~/.zshrc additions
plugins=( git history zsh-syntax-highlighting zsh-autosuggestions )
alias sba="source venv/bin/activate"
alias rs="python3 manage.py runserver 0.0.0.0:8000"
alias migrate="python3 manage.py migrate"
alias makemigrations="python3 manage.py makemigrations"
alias collectstatic="python3 manage.py collectstatic"
alias resg="sudo systemctl restart gunicorn"
```

**[harden] B1.** Also install: `redis-server`, `postgis`, `python3-certbot-nginx`, `fail2ban`, `ufw`, `unattended-upgrades`, `pgbouncer`, `python3-magic`, `libmagic1`, `git-crypt` (or `age` for sops). `libgdal-dev` if you use raster features.

**[harden] B2.** Run `sudo dpkg-reconfigure unattended-upgrades` and accept defaults. Reboots on kernel updates can be deferred via `Unattended-Upgrade::Automatic-Reboot "false";`.

**[harden] B3.** Create a non-login app user instead of using your sudo login:
```bash
sudo adduser --system --group --shell /usr/sbin/nologin --home /srv/kurazetu kurazetu
```
All systemd services below should run as `kurazetu:www-data`, not your sudo login. Keep your sudo login for administration, drop privileges everywhere else. (OS5 in section 14.)

**[harden] B4.** UFW first, before opening anything:
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH                  # or restrict to your IP / Tailscale net
sudo ufw enable
```

### 19.2 Postgres setup (your script, hardened for Kura Zetu)

Your script renamed for this project. Strong passwords from a generator, not literals.

```bash
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Generate two random strong passwords first (do NOT paste these literals):
#   openssl rand -base64 32
# Put them in /srv/kurazetu/.env as DATABASE_PASSWORD and TEST_DATABASE_PASSWORD.

sudo -u postgres psql <<'SQL'
CREATE DATABASE kurazetu;
CREATE USER kurazetu_user WITH PASSWORD '<<replace-me-strong>>';
ALTER ROLE kurazetu_user SET client_encoding TO 'utf8';
ALTER ROLE kurazetu_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE kurazetu_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON SCHEMA public TO kurazetu_user;
GRANT ALL PRIVILEGES ON DATABASE kurazetu TO kurazetu_user;
SQL

# PostGIS extensions inside the DB (must be run as superuser inside that DB)
sudo -u postgres psql -d kurazetu <<'SQL'
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_raster;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
SQL

# Test DB (only on staging / CI hosts, NOT prod)
sudo -u postgres psql <<'SQL'
CREATE DATABASE kurazetu_test_db;
CREATE USER kurazetu_test_user WITH PASSWORD '<<replace-me-strong-too>>';
ALTER ROLE kurazetu_test_user SET client_encoding TO 'utf8';
ALTER ROLE kurazetu_test_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE kurazetu_test_user SET timezone TO 'UTC';
ALTER USER kurazetu_test_user CREATEDB;
GRANT ALL PRIVILEGES ON SCHEMA public TO kurazetu_test_user;
GRANT ALL PRIVILEGES ON DATABASE kurazetu_test_db TO kurazetu_test_user;
SQL

sudo -u postgres psql -d kurazetu_test_db <<'SQL'
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_raster;
SQL
```

**[harden] PG-A.** `GRANT ALL PRIVILEGES` is over-broad. The app user needs `CONNECT`, `USAGE` on schema `public`, and `SELECT/INSERT/UPDATE/DELETE` on tables it owns. After running migrations, lock it down:
```sql
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO kurazetu_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO kurazetu_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO kurazetu_user;
```

**[harden] PG-B.** Do not put the test DB on prod. The test DB role with `CREATEDB` is dangerous on a public-facing host. Keep test DB on staging / CI only.

**[harden] PG-C.** `pg_hba.conf`: change `local all all peer` and the `host` entries to `scram-sha-256`, and set `listen_addresses = 'localhost'` in `postgresql.conf` (PG2 in section 6). Reload:
```bash
sudo systemctl reload postgresql
```

**[harden] PG-D.** Apply the tuning from section 6 PG4 (shared_buffers, work_mem, etc.) using pgtune's output for your actual VPS specs. Add `pg_stat_statements` to `shared_preload_libraries` in `postgresql.conf` and restart (not reload) once.

**[harden] PG-E.** PgBouncer (PG5). Install `pgbouncer`, point Django at `127.0.0.1:6432`, set `pool_mode = transaction`, `default_pool_size = 20`, `max_client_conn = 200`. Bypass it only for `manage.py migrate` (use direct port 5432) because migrations need session-level features.

### 19.3 Virtualenv + dependencies

```bash
sudo -H pip3 install --upgrade pip
cd /srv/kurazetu/src
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**[harden] V1.** Pin everything (audit M13). Use `pip-compile` from `pip-tools`: keep `requirements.in` with top-level deps, generate `requirements.txt` with hashes. Install with `pip install -r requirements.txt --require-hashes`. Supply-chain attack via compromised PyPI package is no longer theoretical.

**[harden] V2.** Drop the custom `django-large-image` / GDAL block. Not used by this project (audit shows no `large-image` imports). Remove.

**[harden] V3.** The honeypot pin:
```bash
pip uninstall django-admin-honeypot
pip install git+https://github.com/dmpayton/django-admin-honeypot.git@develop
```
Pin to a **commit SHA**, not a branch. `@develop` shifts under you and breaks reproducibility / signing:
```bash
pip install "git+https://github.com/dmpayton/django-admin-honeypot.git@<sha>#egg=django-admin-honeypot"
```

**[harden] V4.** `dumpdata` is a useful one-shot but is **not a backup strategy**. Use it for fixtures / staging seeds only. Real backups go via `pgbackrest` / `wal-g` (BK1).

### 19.4 ALLOWED_HOSTS

Your snippet:

```python
ALLOWED_HOSTS = ['your_server_domain_or_IP', 'second_domain_or_IP', 'localhost']
```

**[harden] AH1.** Drive from env (already wired in `base.py:14`):
```bash
# .env
ALLOWED_HOSTS=kurazetu.example,www.kurazetu.example
```
Do not include the bare server IP in `ALLOWED_HOSTS` once Cloudflare is in front; CF will send `Host: kurazetu.example`. Including the IP makes it easier to validate-bypass via Host header attacks. Add `127.0.0.1` only if a local healthcheck hits the box directly.

### 19.5 Initial check + superuser

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic
```

**[harden] CS1.** Run `python manage.py check --deploy --settings=CommunityTally.settings.production` before flipping NGINX traffic. Section 4 DJ11.

**[harden] CS2.** Skip `python manage.py runserver` on prod entirely. Once gunicorn is wired, the box should never run the dev server. Audit C12.

**[harden] CS3.** `ufw allow 8000` from your recipe is for the temporary dev-mode test. Remove it after wiring NGINX:
```bash
sudo ufw delete allow 8000
sudo ufw allow 'Nginx Full'
```
Then further restrict 80/443 to Cloudflare IPs only (OS2):
```bash
# delete the broad rule
sudo ufw delete allow 'Nginx Full'
# allow only CF ranges
for ip in $(curl -s https://www.cloudflare.com/ips-v4); do sudo ufw allow from $ip to any port 443 proto tcp; done
for ip in $(curl -s https://www.cloudflare.com/ips-v6); do sudo ufw allow from $ip to any port 443 proto tcp; done
sudo ufw reload
```
Script this; CF IP ranges change. Re-run monthly via cron.

### 19.6 Gunicorn (your systemd template, hardened)

Your socket:

```ini
# /etc/systemd/system/gunicorn.socket
[Unit]
Description=gunicorn socket

[Socket]
ListenStream=/home/deploy/example_project/gunicorn.sock

[Install]
WantedBy=sockets.target
```

Your service:

```ini
# /etc/systemd/system/gunicorn.service
[Unit]
Description=gunicorn daemon
Requires=gunicorn.socket
After=network.target

[Service]
User=deploy
Group=www-data
WorkingDirectory=/home/deploy/example_project
ExecStart=/home/deploy/example_project/venv/bin/gunicorn \
          --access-logfile - \
          --workers 3 \
          --bind unix:/home/deploy/example_project/gunicorn.sock \
          ExampleProject.wsgi:application

[Install]
WantedBy=multi-user.target
```

**[harden] G-A.** Rename the old project module -> `CommunityTally` everywhere; move from `/home/deploy/example_project/` to `/srv/kurazetu/` so it survives if you delete a human login.

**[harden] G-B.** Add the prod-grade flags (GU1-GU4):
```ini
ExecStart=/srv/kurazetu/venv/bin/gunicorn \
    --workers 3 --threads 4 --worker-class gthread \
    --max-requests 1000 --max-requests-jitter 100 \
    --preload --timeout 60 --graceful-timeout 30 \
    --access-logfile - --error-logfile - \
    --bind unix:/run/gunicorn/kurazetu.sock \
    CommunityTally.wsgi:application
```

**[harden] G-C.** Use `RuntimeDirectory=gunicorn` so systemd creates `/run/gunicorn/` with the right perms on boot. Drop the socket file out of the app dir; `/run/gunicorn/kurazetu.sock` is the convention.

**[harden] G-D.** `User=kurazetu`, not `deploy`. B3.

**[harden] G-E.** Add `Restart=on-failure`, `RestartSec=5`, `EnvironmentFile=/srv/kurazetu/.env`. Already shown in section 3 GU7.

**[harden] G-F.** The socket-activated pattern (`gunicorn.socket` + `gunicorn.service`) is fine but on a busy host you usually want `gunicorn.service` started directly, not on-demand. Disable the socket activation:
```bash
sudo systemctl disable gunicorn.socket
sudo systemctl enable gunicorn
```
Keep the socket file inside the service via `--bind` instead.

### 19.7 NGINX site config

Your config:

```nginx
server {
    listen 80;
    server_name 203.0.113.10 www.example.org example.org;

    location = /favicon.ico { access_log off; log_not_found off; }
    location /static/ { root /home/deploy/example_project; }
    location / {
        include proxy_params;
        proxy_pass http://unix:/home/deploy/example_project/gunicorn.sock;
    }
}
```

**[harden] N-A.** That config is for the old project. The Kura Zetu version:

```nginx
# /etc/nginx/sites-available/kurazetu
upstream kurazetu_app {
    server unix:/run/gunicorn/kurazetu.sock fail_timeout=0;
}

# HTTP -> HTTPS redirect handled by Cloudflare, but keep this for direct hits:
server {
    listen 80 default_server;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name kurazetu.example www.kurazetu.example;

    # Cloudflare Origin CA cert (CF1, CF2)
    ssl_certificate         /etc/ssl/cloudflare/origin.pem;
    ssl_certificate_key     /etc/ssl/cloudflare/origin.key;
    ssl_client_certificate  /etc/ssl/cloudflare/authenticated_origin_pull_ca.pem;
    ssl_verify_client       on;          # rejects anything not from Cloudflare

    # Limits (NX3)
    client_max_body_size 15M;
    client_body_timeout 30s;
    send_timeout 30s;

    # Real IP from CF (NX2)
    include /etc/nginx/conf.d/cloudflare-realip.conf;

    # Security headers (NX7)
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(self), camera=(), microphone=()" always;

    location = /favicon.ico { access_log off; log_not_found off; }

    location /static/ {
        alias /srv/kurazetu/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # In dev only. In prod, media is on Cloudflare R2 (section 10).
    location /media/ {
        alias /srv/kurazetu/media/;
        expires 1h;
    }

    # Block dotfiles + common probes (NX8)
    location ~ /\.(?!well-known) { return 404; }

    location / {
        include proxy_params;
        proxy_pass http://kurazetu_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        proxy_read_timeout 60s;
    }

    # Throttle API writes at edge (belt and braces with CF6)
    location ~ ^/(api/accounts/(login|signup)|accounts/password-reset) {
        limit_req zone=api burst=10 nodelay;
        include proxy_params;
        proxy_pass http://kurazetu_app;
    }
}

server_tokens off;
```

**[harden] N-B.** Your `certbot --reinstall -d o3i.international` line is for the old domain. With Cloudflare Origin CA certs you do not need certbot at all - the Cloudflare-issued cert lasts 15 years. Skip Let's Encrypt unless you want fallback for non-CF traffic.

**[harden] N-C.** Always `sudo nginx -t` before reload, never `restart` (downtime). `sudo systemctl reload nginx` re-reads config without dropping connections.

### 19.8 Celery (your existing systemd templates)

If you already have working `celery-worker.service` and `celery-beat.service` templates from another Django project, they are correct in shape. Adapt them for Kura Zetu:

- Replace the old app module -> `CommunityTally` in `--app`.
- Replace the old project path -> `/srv/kurazetu/src`.
- Replace the old service user -> `kurazetu`.

```ini
# /etc/systemd/system/kurazetu-celery-worker.service
[Unit]
Description=Kura Zetu Celery Worker
After=network.target redis.service postgresql.service
Requires=redis.service

[Service]
Type=forking
User=kurazetu
Group=www-data
WorkingDirectory=/srv/kurazetu/src
EnvironmentFile=/srv/kurazetu/.env
ExecStart=/srv/kurazetu/venv/bin/celery \
    --app=CommunityTally.celery \
    worker \
    --loglevel=info \
    --logfile=/var/log/celery/worker.log \
    --pidfile=/var/run/celery/worker.pid \
    --concurrency=2 \
    -Q sms_otp,image_processing,celery
ExecStop=/srv/kurazetu/venv/bin/celery \
    --app=CommunityTally.celery \
    multi stopwait worker \
    --pidfile=/var/run/celery/worker.pid
ExecReload=/bin/kill -s HUP $MAINPID
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

```ini
# /etc/systemd/system/kurazetu-celery-beat.service
[Unit]
Description=Kura Zetu Celery Beat Scheduler
After=network.target redis.service postgresql.service
Requires=redis.service

[Service]
Type=simple
User=kurazetu
Group=www-data
WorkingDirectory=/srv/kurazetu/src
EnvironmentFile=/srv/kurazetu/.env
ExecStart=/srv/kurazetu/venv/bin/celery \
    --app=CommunityTally.celery \
    beat \
    --loglevel=info \
    --logfile=/var/log/celery/beat.log \
    --pidfile=/var/run/celery/beat.pid \
    --scheduler django_celery_beat.schedulers:DatabaseScheduler
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

**[harden] C-A.** This project does **not yet have a `CommunityTally/celery.py`**. Wire it before enabling these services. Minimal:

```python
# src/CommunityTally/celery.py
import os
from celery import Celery
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "CommunityTally.settings.production")
app = Celery("CommunityTally")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
```

And in `CommunityTally/__init__.py`:
```python
from .celery import app as celery_app
__all__ = ("celery_app",)
```

Settings additions:
```python
CELERY_BROKER_URL = "redis://:PASS@127.0.0.1:6379/1"
CELERY_RESULT_BACKEND = None
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_TASK_TIME_LIMIT = 30
CELERY_TASK_SOFT_TIME_LIMIT = 20
CELERY_TASK_ACKS_LATE = True
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
```

**[harden] C-B.** Only enable beat when you actually have periodic tasks. Right now you have none. Start with the worker, add beat when (a) cleanup-of-expired-OTPs job exists, or (b) periodic cache warm exists.

**[harden] C-C.** Log/pid dirs need to exist:
```bash
sudo mkdir -p /var/log/celery /var/run/celery
sudo chown kurazetu:www-data /var/log/celery /var/run/celery
```

**[harden] C-D.** Restart order on deploy:
```bash
sudo systemctl restart kurazetu-celery-worker
sudo systemctl restart kurazetu-celery-beat       # if enabled
sudo systemctl restart kurazetu                   # gunicorn last
```

### 19.9 Deploy aliases (yours, adapted)

```bash
# ~/.zshrc on the VPS
alias sba="source /srv/kurazetu/venv/bin/activate"
alias migrate="python3 manage.py migrate"
alias makemigrations="python3 manage.py makemigrations"
alias collectstatic="python3 manage.py collectstatic --noinput"
alias resg="sudo systemctl restart kurazetu"
alias recw="sudo systemctl restart kurazetu-celery-worker"
alias recb="sudo systemctl restart kurazetu-celery-beat"
alias rec="sudo systemctl restart kurazetu-celery-worker kurazetu-celery-beat"
alias resn="sudo nginx -t && sudo systemctl reload nginx"
alias deploy="cd /srv/kurazetu/src && git pull && sba && pip install -r requirements.txt && migrate && collectstatic && rec && resg"
```

**[harden] D-A.** The `rs` alias (`runserver 0.0.0.0:8000`) should not exist on the prod box. Keep it only on dev. Same for `makemigrations` on prod (migrations are generated on dev, applied on prod).

**[harden] D-B.** The `deploy` alias is fine for solo ops but lacks: health check, rollback-on-fail, zero-downtime. Replace with a `deploy.sh` script (section 15 DP3) once you cross the "one person doing ops by hand" line.

### 19.10 The diff in one paragraph

If you keep your existing recipe verbatim and run Kura Zetu on a public production host, the failures are: (a) database reachable from internet (no `listen_addresses = localhost`, no `pg_hba` lockdown), (b) wide-open Postgres role privileges, (c) gunicorn running as your sudo user, (d) NGINX terminating plain HTTP on a domain with sensitive data, (e) no Cloudflare authenticated origin pulls so anyone who guesses the origin IP bypasses CF entirely, (f) no firewall rules to CF-only, (g) `pip install` without hashes, (h) `--workers 3` with no thread / preload / max-requests tuning, (i) no Celery app file so the services would not even start. The annotations above are the minimum diff to close those. Sections 1-18 above are the full picture.
