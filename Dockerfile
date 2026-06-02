FROM python:3.12-slim AS runtime

RUN groupadd -r appuser -g 1000 && \
    useradd -r -u 1000 -g appuser -m -d /app appuser

RUN pip install --no-cache-dir \
    fastapi==0.115.0 \
    uvicorn[standard]==0.32.0 \
    pydantic==2.9.0 \
    pydantic-settings==2.5.0 \
    sqlalchemy[asyncio]==2.0.35 \
    aiosqlite==0.20.0 \
    httpx==0.27.2 \
    tenacity==9.0.0 \
    python-dotenv==1.0.1 \
    structlog==24.4.0 \
    slowapi==0.1.9 \
    python-multipart==0.0.10 \
    redis==5.0.8

ENV PYTHONPATH=/app/backend \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    APP_ENV=production

WORKDIR /app

RUN mkdir -p /app/data && chown -R appuser:appuser /app

COPY --chown=appuser:appuser backend/ /app/backend/
COPY --chown=appuser:appuser data/api_market.db /app/data/api_market.db

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/api/health')" || exit 1

CMD ["uvicorn", "api_market.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "2"]
