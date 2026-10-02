# How to Configure Log Rotation in Production

This guide explains how to install size-based rotation for the application
and auth log files written when `LOG_FILE` / `AUTH_LOG_FILE` are set. See
[About logging and redaction](../explanations/logging-approach.md) for why
rotation happens outside the Django process rather than inside it.

```{important}
This guide assumes a production server running Gunicorn under systemd, with
`LOG_FILE` and/or `AUTH_LOG_FILE` set to real paths (see `src/.env`).
```

## Steps

1. **Review the tracked template**

    The repository ships a template at `src/.deploy/logrotate/kurazetu.conf`.
    It rotates each file once it reaches 10MB, keeps 8 compressed generations,
    and does **not** use `copytruncate` — `WatchedFileHandler` already
    reopens the file when `logrotate` renames it, so a plain rename-and-create
    rotation is both simpler and safe across multiple Gunicorn workers.

2. **Match the paths and ownership to this server**

    Edit the copied file so the paths match this server's actual `LOG_FILE`
    and `AUTH_LOG_FILE` values, and `create` uses the user/group Gunicorn
    runs as:

    ```bash
    grep -E "^(LOG_FILE|AUTH_LOG_FILE)=" src/.env
    ```

3. **Install it**

    ```bash
    sudo cp src/.deploy/logrotate/kurazetu.conf /etc/logrotate.d/kurazetu
    sudo logrotate -d /etc/logrotate.d/kurazetu   # dry run, no changes made
    ```

    `logrotate` already runs daily via `logrotate.timer` on Ubuntu, so no
    separate `cron` job or systemd unit is needed — dropping the file into
    `/etc/logrotate.d/` is enough.

4. **Force an immediate rotation (optional)**

    To rotate right away instead of waiting for the next daily run, e.g.
    when a file has already grown large:

    ```bash
    sudo logrotate -f /etc/logrotate.d/kurazetu
    ```

## Notes

- Do not switch `LOG_FILE` handling to `RotatingFileHandler` in Django
  settings. Each Gunicorn worker would rotate independently, and workers
  race each other, corrupting the file and losing lines — this is why
  `WatchedFileHandler` plus external `logrotate` is used instead.
- A stale log file that is no longer the active `LOG_FILE` target (for
  example, after changing `LOG_FILE` from `app.json` to `app.log`) is not
  picked up by rotation automatically. Archive it by hand once:
  `gzip logs/app.json`.
