# About logging and redaction

These are the logs written by the production server. They describe the people
using the app, not the developers building it: the citizen outside a polling
station submitting what was announced there. Development logs stay on the
machine that made them and are ignored by Git.

The decision point is mostly operational policy: where logs live, who rotates
them, and how hard we enforce redaction. Kura Zetu keeps stdout and journald as
the baseline, makes `LOG_FILE=logs/app.json` a first-class repo-local option,
rotates production files outside the app with `logrotate`, and aggressively
deletes or converts unsafe `print()` calls.

## Logs go to standard output

The application writes to standard output, and nothing in the code decides
where that ends up. In production Gunicorn runs as a systemd service, systemd
captures whatever its processes print, and hands it to journald, which stores
it under `/var/log/journal` as indexed binary records rather than text files.
`journalctl -u <service>` reads them back. Rotation, retention and querying are
already solved there.

The journal is storage, not a passing stream. Records survive restarts and
reboots, and `journalctl` queries them by unit, time and field. Locally there
is no systemd, so standard output is the terminal running `runserver`.

Setting `LOG_FILE` adds a JSON file next to stdout, for tools that would rather
tail a path: the log-reading agent, or anything correlating application events
with nginx while chasing bad traffic. Keeping that file in the ignored
`logs/` directory also lets an agent inspect runtime evidence and source code
inside one workspace. It uses `WatchedFileHandler`, so `logrotate` owns
production rotation and several Gunicorn workers can share one file without
losing lines.

Three paths are worth knowing:

- `/var/log/journal` holds the journal itself. If that directory is missing,
  journald is running in volatile mode and everything is discarded on reboot,
  which no amount of application configuration can fix. Ubuntu creates it, but
  it is worth confirming on a new server rather than assuming.
- `logs/app.json` is the repo-local `LOG_FILE` used by the tracked local
  template. Relative paths are resolved under Django's `BASE_DIR`, which is the
  `src/` directory.
- `/var/log/kurazetu/app.json` is a production-friendly absolute `LOG_FILE`
  value, owned by the user Gunicorn runs as.
- `/var/log/nginx/access.log` is the separate record of requests that arrived,
  including the ones the application never saw.

## Nothing breaks on a fresh clone

The tracked `.env.local` template sets `LOG_FILE=logs/app.json`. The directory
is ignored by Git and created at startup, so a new contributor gets a file an
agent can inspect without creating tracked runtime state.

When it is set, the two things that go wrong on a real machine are handled at
startup rather than at the first log line. A missing directory is created. A
path owned by another user cannot be fixed, so the application writes one
warning to stderr and carries on with stdout alone.

This is deliberate: a logging destination should never be the reason a site
fails to boot. The older arrangement had exactly that failure, where a missing
`logs/` directory stopped the process before it served anything.

## Where hostile traffic actually shows up

Application logs are the wrong place to look first. A flood never reaches
Django: Cloudflare absorbs most of it at the edge, and what gets past that
exhausts nginx or the Gunicorn worker pool before any view runs. Three layers
see three different things.

- **Cloudflare** sees every request, including the ones it blocked. It is the
  only place that knows about traffic that never touched the server.
- **nginx** sees what passed the edge, including requests Django never handled:
  404 floods, probes for `/wp-admin`, malformed paths.
- **Django** sees only what reached the application. Useful for a bot that
  behaves like a real client, such as scripted signups or credential stuffing,
  which is exactly what the `django.security` logger and the per-user
  correlation are for.

So the application log answers "which accounts and endpoints were abused", and
the other two answer "how much traffic arrived and from where". Redaction is
what makes the first question safe to ask.

We deliberately did not use a `RotatingFileHandler` writing to `logs/`, which
is the usual arrangement, because it is worse in two ways. The directory must
exist before the first log line, so a fresh clone crashes until someone creates
it. More seriously, the handler is not safe across processes: Gunicorn workers
each hold the file open, and when one rotates it the others keep writing to the
old one. Lines are lost. A single development process never shows this, which
is how it reaches production.

Retention is bounded deliberately. A log says which people used the app and
when, and it sits on a server that could be seized.

## Why records are redacted

Everyone signs up with a phone number. In a contested election, a record of
which numbers reported which results from which stations is exactly what
someone would want, and the people in it are civilians.

So a phone number is treated like a password. It never reaches a log line.

Discipline at the point of logging does not achieve this. Someone debugging a
failed signup logs the whole request body, and the line outlives the bug. It
has happened here already. Redaction is applied centrally instead, by a filter
on the log handler, which is the one place a child logger cannot bypass.

Values with keys are matched reliably:

```json
{"phone_number": "+254712345678", "password": "x", "ward_code": "094"}
    -> {"phone_number": "[redacted]", "password": "[redacted]", "ward_code": "094"}

{"user": {"phone_number": ["+254712345678 is already registered"]}}
    -> {"user": {"phone_number": ["[redacted] is already registered"]}}
```

Formatted strings have no keys left, so secrets are matched by shape. This
catches the common cases and misses uncommon ones:

```
"auth failed for +254712345678 after 3 attempts"
    -> "auth failed for [redacted] after 3 attempts"
"Token from server: 9f8a7b6c5d4e3f2a"
    -> "Token from server: [redacted]"

"verified station 094-0031 in ward 094"     unchanged, nothing sensitive
"created session 4f21ab8e"                  unchanged, and it should not be
```

That last line is the honest limit: an opaque value with no recognisable label
looks like any other text. Anything logged with a key avoids the guesswork.
`print()` avoids the filter entirely.

Over-redaction is its own failure. A log missing the ward, the station and the
retry count is one nobody reads, and a log nobody reads gets switched off.

## Users are identified by key, not by number

Following one person through a log is the reason to log a phone number. Kura
Zetu logs the user's primary key instead.

The key means nothing without the database, and anyone holding the database
already has the numbers. Logging the number would copy a secret into a second
store with weaker protection and longer life.

## Why redacted values are not encrypted

Encrypting instead of discarding would let an administrator recover the
original later. Three reasons against it.

1. Encrypted personal data is still personal data: it exists indefinitely, waiting
on the key holding. Correlating one person across lines needs the same input to
give the same ciphertext, and there are only about a hundred million Kenyan
mobile numbers, few enough to encrypt all of them and match.

2. The deciding one is that a capability which exists can be compelled, by a
court, a coerced administrator, or a stolen session.

3. A project that cannot identify the people who used it cannot be made to.
