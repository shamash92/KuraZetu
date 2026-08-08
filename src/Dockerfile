FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TAILWIND_CLI_PATH=/home/app/.django_tailwind_cli

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgdal-dev \
    binutils \
    libproj-dev \
    gdal-bin \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

RUN groupadd --gid 1000 app \
    && useradd --create-home --gid app --uid 1000 app

COPY --chown=app:app . .

RUN install -d --owner=app --group=app /app/staticfiles/css /app/media

USER app

RUN SECRET_KEY=docker-build-only \
    DEBUG=True \
    ALLOWED_HOSTS=localhost \
    DATABASE_NAME=unused \
    DATABASE_USER=unused \
    DATABASE_PASSWORD=unused \
    DATABASE_HOST=localhost \
    CORS_ALLOWED_ORIGINS=http://localhost \
    python manage.py tailwind download_cli

CMD ["gunicorn", "CommunityTally.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "60"]
