# Running the Project with Docker

This guide will help you set up and run the project using Docker and Docker Compose.

```{important}
The documentation process has not been integrated in docker yet. You will need to run the documentation server separately.
```

## Prerequisites

- [Docker](https://docs.docker.com/get-started/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed

## 1. Clone the Repository

```bash
git clone https://github.com/shamash92/KuraZetu.git
cd KuraZetu
```

## 2. Configure Environment Variables

Copy the example `.env.local` file to `.env`:

```bash
cd src
cp .env.local .env
```

Make sure to set the database host to `db` (matching the Docker Compose service name):

```bash
...
DATABASE_HOST=db
# Add other environment variables as needed
```

## 3. Start the Services

Run the following command to build and start the containers in detached mode:

```bash
docker compose build --progress=plain 
docker compose up -d
```

This will start all services defined in your `docker-compose.yml` file.

## 4. Create a Superuser

After the containers are running, create a Django superuser:

```bash
docker compose exec web python manage.py createsuperuser
```

Follow the prompts to set up your admin credentials.

## 5. Access the Application

- The web application should be available at `http://localhost:8000` (or the port specified in your `docker-compose.yml`).
- The admin panel is typically at `http://localhost:8000/admin/`.

---

You are now running the project with Docker!

> Next steps:
>
> - [Load Boundaries Data](../how-to-guides/load_boundaries_data.md)
