from __future__ import annotations

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from api_market.config import get_settings
from api_market.middleware.logging import (
    CORSMiddlewareFixed,
    SecurityHeadersMiddleware,
    SlowRequestMiddleware,
)
from api_market.routes import apis, categories, health, search

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    from api_market.database import engine
    from api_market.models.api import Base  # noqa: F401

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