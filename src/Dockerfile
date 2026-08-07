FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libgdal-dev \
    binutils \
    libproj-dev \
    gdal-bin

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

RUN groupadd --gid 1000 app \
    && useradd --create-home --gid app --uid 1000 app

COPY --chown=app:app . .

USER app

CMD ["gunicorn", "CommunityTally.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "60"]
