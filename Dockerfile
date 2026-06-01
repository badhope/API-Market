FROM python:3.12-slim AS builder

RUN pip install --no-cache-dir poetry && \
    python -m venv /opt/venv

ENV PATH="/opt/venv/bin:$PATH"

COPY pyproject.toml ./
RUN pip install --no-cache-dir fastapi uvicorn[standard] pydantic pydantic-settings \
    sqlalchemy[asyncio] aiosqlite httpx tenacity python-dotenv structlog slowapi python-multipart

FROM python:3.12-slim AS runtime

RUN groupadd -r appuser -g 1000 && \
    useradd -r -u 1000 -g appuser -m -d /app appuser

COPY --from=builder /opt/venv /opt/venv

ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

RUN mkdir -p /app/data && chown -R appuser:appuser /app

COPY --chown=appuser:appuser backend/ /app/
COPY --chown=appuser:appuser data/api_market.db /app/data/api_market.db

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/api/health')" || exit 1

CMD ["uvicorn", "api_market.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "2"]