FROM python:3.12-slim AS runtime

RUN groupadd -r appuser -g 1000 && \
    useradd -r -u 1000 -g appuser -m -d /app appuser

# System deps for SQLite FTS5 + asyncpg
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Install the package itself. This installs everything declared in
# pyproject.toml and resolves transitive deps from PyPI. Single source of
# truth for versions: never re-pin anything in this file.
COPY --chown=appuser:appuser pyproject.toml README.md LICENSE* /app/
WORKDIR /app
RUN pip install --no-cache-dir .

# Drop build deps to slim the image
RUN apt-get purge -y --auto-remove gcc libffi-dev

ENV PYTHONPATH=/app/backend \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    APP_ENV=production

RUN mkdir -p /app/data && chown -R appuser:appuser /app

COPY --chown=appuser:appuser backend/ /app/backend/
COPY --chown=appuser:appuser data/api_market.db /app/data/api_market.db

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/api/health')" || exit 1

CMD ["uvicorn", "api_market.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "2"]
