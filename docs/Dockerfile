FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install --no-install-recommends -y \
    git \
    make \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace/docs

COPY requirements.txt /tmp/docs-requirements.txt

RUN python -m venv /venv \
    && /venv/bin/pip install --no-cache-dir -r /tmp/docs-requirements.txt

RUN groupadd --gid 1000 docs \
    && useradd --create-home --gid docs --uid 1000 docs \
    && chown -R docs:docs /venv

ENV DEV_DIR=/tmp/docs-dev \
    DOCS_BUILDDIR=/tmp/docs-build \
    DOCS_VENVDIR=/venv \
    SPHINX_AUTOBUILD_OPTS="--ignore=_build/** --ignore=_dev/** --ignore=.venv/** -D llms_txt_enabled=0" \
    SPHINX_HOST=0.0.0.0 \
    SPHINX_PORT=8000

USER docs

CMD ["make", "run"]
