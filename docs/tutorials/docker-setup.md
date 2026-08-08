# Run the development project with Docker

Use Docker Compose to run the Django backend, web assets, and PostgreSQL from
one terminal command. You can also include the documentation server.

```{important}
This Compose application is for local development only. It is not a production
deployment configuration.
```

## Prerequisites

Install [Docker](https://docs.docker.com/get-started/get-docker/) with the
Docker Compose plugin.

## 1. Clone the repository

```bash
git clone https://github.com/shamash92/KuraZetu.git
cd KuraZetu/src
```

## 2. Configure the environment

Create your local environment file:

```bash
cp .env.local .env
```

Open `.env` and set `DATABASE_NAME`, `DATABASE_USER`, and
`DATABASE_PASSWORD`. Compose sets `DATABASE_HOST=db` inside the Django
containers, so you do not need to change the host in this file.

## 3. Start the application

Build and start the backend, frontend assets, and database:

```bash
docker compose up --build
```

The first build can take several minutes while Docker downloads the images and
installs the Python, Node.js, and Tailwind dependencies. Later builds reuse the
cache.

The `migrate` service applies database migrations once and then exits with code
`0`. This is expected. The web service starts after that migration succeeds.

On an Apple Silicon computer, Docker may warn that the PostGIS image targets
the AMD64 platform. The upstream image runs through Docker's emulation and may
start more slowly. Linux and Windows AMD64 hosts do not need that emulation.

The application is available at `http://localhost:8000/`. PostgreSQL is
available only on the local computer at port `5433`. Set `POSTGRES_PORT` before
starting Compose if you need a different host port.

## 4. Create a superuser

In another terminal, from the `src` directory, run:

```bash
docker compose exec web python manage.py createsuperuser
```

Follow the prompts and choose a strong development password. For example, you
can enter `0701234567` for the phone number; the application normalizes a local
Kenyan number before saving it.

The real Django admin path is set by `ADMIN_URL_SUFFIX` in `.env`. With the
example value, open `http://localhost:8000/backend/`. The `/admin/` path is a
honeypot and is not the Django administration site.

## 5. Include the documentation

Stop the application with {kbd}`Ctrl+C`, then restart it with the `docs`
profile:

```bash
docker compose --profile docs up --build
```

This runs the repository's `make run` target in the docs container. Open the
documentation at `http://localhost:8001/`. Changes under `docs/` trigger a
rebuild.

## 6. Stop the services

Press {kbd}`Ctrl+C` in the Compose terminal. If you started the services in
detached mode, run:

```bash
docker compose --profile docs down
```

This preserves the PostgreSQL and dependency volumes for the next run.

> Next step: [Load boundaries data](../how-to-guides/load_boundaries_data.md)
