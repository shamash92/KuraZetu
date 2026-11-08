# How to Run the Celery Worker in Production

This guide installs Redis and the Celery worker on the production server. The
worker reads results form photos uploaded from the mobile app in the
background, so the web server answers the phone at once instead of waiting
for the reading.

```{important}
This guide assumes a production server running Gunicorn under systemd, with
the checkout and virtual environment at `/home/<user>/KuraZetu/src`. Replace
`<user>` with the user Gunicorn runs as.
```

## Steps

1. **Install Redis**

    ```bash
    sudo apt update
    sudo apt install -y redis-server
    ```

2. **Make Redis keep queued work**

    Open the Redis configuration:

    ```bash
    sudo nano /etc/redis/redis.conf
    ```

    Set these values:

    ```ini
    bind 127.0.0.1 ::1
    appendonly yes
    maxmemory-policy noeviction
    ```

    - `bind` keeps Redis reachable from this server only.
    - `appendonly yes` writes the queue to disk, so a restart does not lose
      readings waiting in it.
    - `maxmemory-policy noeviction` makes a full Redis refuse new work with an
      error instead of deleting queued work.

    Restart Redis and check it answers:

    ```bash
    sudo systemctl enable redis-server
    sudo systemctl restart redis-server
    redis-cli ping   # prints PONG
    ```

    Never open port 6379 in the firewall (`ufw allow 6379`). From another
    machine, check Redis cannot be reached:

    ```bash
    nc -zv -w 5 <server-address> 6379   # must fail or time out
    ```

3. **Set `REDIS_URL` in `src/.env`**

    ```bash
    REDIS_URL=redis://localhost:6379/0
    ```

    One Redis server holds 16 numbered databases (0 to 15), the last part of
    the URL. When another app on this server already uses Redis, give
    KuraZetu a number that app does not use, such as
    `redis://localhost:6379/1`. Two apps on the same number take each other's
    jobs and discard them.

4. **Review the tracked service template**

    The repository ships a template at
    `src/.deploy/systemd/celery-worker.service`. Edit the copy so `User` and
    the paths match this server. The worker reads `src/.env` itself, like
    Gunicorn, so the unit needs no environment file.

    `--concurrency=2` runs two readings at once. Further readings wait in
    Redis until a process is free. Each process uses about as much memory as a
    Gunicorn worker.

5. **Install and start it**

    ```bash
    sudo cp src/.deploy/systemd/celery-worker.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable --now celery-worker
    ```

6. **Check status and logs**

    ```bash
    sudo systemctl status celery-worker
    sudo journalctl -u celery-worker -f
    ```

    The log lists `results.tasks.read_check` under `[tasks]` and shows
    `Connected to redis://localhost:6379/...` with the database number from
    `REDIS_URL`. Each reading logs a `received` line and a `succeeded` line.

    In the Django admin, **Celery Results → Task results** lists each job
    with its state (`STARTED`, `SUCCESS`, `FAILURE`), timings, worker, and
    the error when one crashed. Its rows are not deleted automatically.

7. **Add a restart alias (optional)**

    Add this to `~/.zshrc` or `~/.bashrc`:

    ```bash
    alias recw="sudo systemctl restart celery-worker"
    ```

## Restart order after a deploy

The worker does not reload code on its own. After pulling new code, restart
the worker first, then Gunicorn, so no reading runs on old code against a new
web server:

```bash
sudo systemctl restart celery-worker
sudo systemctl restart gunicorn
```

## Notes

- When the worker is stopped, readings stay queued in Redis and run when it
  starts again. A reading still running 90 seconds after the photo was sent
  is marked as timed out, and the person types the figures.
- When `ANTHROPIC_API_KEY` is blank, no reading is queued: the phone gets an
  empty form at once.
