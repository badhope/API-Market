FROM python:3.12-slim AS runtime

RUN groupadd -r appuser -g 1000 && \
    useradd -r -u 1000 -g appuser -m -d /app appuser

# Install the package itself. This installs everything declared in
# pyproject.toml and resolves transitive deps from PyPI. Single source
# of truth for versions: never re-pin anything in this file.
# All declared deps (fastapi, pydantic, slowapi, redis, asyncpg,
# aiosqlite, uvicorn) ship as manylinux/musllinux wheels, so no
# gcc/libffi-dev toolchain is needed in the image.
COPY --chown=appuser:appuser pyproject.toml README.md LICENSE* /app/
WORKDIR /app
RUN pip install --no-cache-dir .

ENV PYTHONPATH=/app/backend \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    APP_ENV=production

RUN mkdir -p /app/data && chown -R appuser:appuser /app

COPY --chown=appuser:appuser backend/ /app/backend/

# data/api_market.db is generated at runtime / on the host (see
# `make db-init` or scripts/migrate_to_sqlite.py). The SQLite file is
# gitignored, so we don't COPY it into the image — bundling a stale
# snapshot into every layer would break rollbacks and inflate the image by
# ~10MB. In docker-compose the database is provided through the `api_data`
# volume; in CI the file is created by the host before `docker compose up`.
# We still copy data/.gitkeep so the target directory exists.
COPY --chown=appuser:appuser data/.gitkeep /app/data/.gitkeep

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/api/health')" || exit 1

CMD ["uvicorn", "api_market.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "2"]
