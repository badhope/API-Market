from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from api_market.config import get_settings
from api_market.limiter import limiter
from api_market.middleware.logging import (
    CORSMiddlewareFixed,
    SecurityHeadersMiddleware,
    SlowRequestMiddleware,
)
from api_market.routes import apis, categories, health, search

settings = get_settings()


async def _on_rate_limit(request: Request, exc: Exception) -> JSONResponse:
    """Adapter so slowapi's handler matches Starlette's expected signature."""
    return _rate_limit_exceeded_handler(request, exc)  # type: ignore[arg-type, return-value]


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    from api_market.database import engine
    from api_market.models.api import Base

    if settings.debug:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="A comprehensive collection of 14,000+ public APIs from across the internet — unified, standardized, and searchable.",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan,
    )

    # slowapi requires the shared Limiter to be exposed on
    # `app.state.limiter` for `@limiter.limit(...)` decorators on
    # route handlers to actually enforce the configured quota.
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _on_rate_limit)

    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(CORSMiddlewareFixed)
    app.add_middleware(SlowRequestMiddleware, threshold_ms=200)
    app.add_middleware(GZipMiddleware, minimum_size=500)

    app.include_router(health.router)
    app.include_router(apis.router)
    app.include_router(categories.router)
    app.include_router(search.router)

    return app


app = create_app()
