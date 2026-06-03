from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.exceptions import HTTPException as StarletteHTTPException

from api_market.config import get_settings
from api_market.limiter import limiter
from api_market.middleware.logging import (
    CORSMiddlewareFixed,
    RequestIdMiddleware,
    SecurityHeadersMiddleware,
    SlowRequestMiddleware,
)
from api_market.routes import apis, categories, health, search

settings = get_settings()


async def _on_rate_limit(request: Request, exc: Exception) -> JSONResponse:
    """Adapter so slowapi's handler matches Starlette's expected signature."""
    return _rate_limit_exceeded_handler(request, exc)  # type: ignore[arg-type, return-value]


def _error_payload(code: str, message: str, **extra: object) -> dict[str, object]:
    body: dict[str, object] = {"error": code, "detail": message}
    body.update(extra)
    return body


async def _http_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Wrap FastAPI's default {"detail": "..."} so every 4xx/5xx the
    # client sees has the same `{error, detail}` shape.
    http_exc = exc if isinstance(exc, StarletteHTTPException) else None
    status_code = http_exc.status_code if http_exc else 500
    detail_raw = http_exc.detail if http_exc else "request failed"
    detail = detail_raw if isinstance(detail_raw, str) else "request failed"
    headers = http_exc.headers if http_exc else None
    return JSONResponse(
        status_code=status_code,
        content=_error_payload("http_error", detail),
        headers=headers,
    )


async def _validation_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Trim loc tuples to their last element for readability — the
    # frontend only needs the field name.
    errs = exc.errors() if isinstance(exc, RequestValidationError) else []
    fields = [
        {"field": ".".join(str(p) for p in err["loc"][1:]) or err["loc"][0], "message": err["msg"]}
        for err in errs
    ]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content=_error_payload(
            "validation_error", "request body or query failed validation", fields=fields
        ),
    )


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
    # 4xx and 422 go through our wrapper so every error the client sees
    # has the same {error, detail} shape; unhandled exceptions fall
    # through to Starlette's default 500 (the X-Request-Id header from
    # RequestIdMiddleware helps correlate logs).
    app.add_exception_handler(StarletteHTTPException, _http_exception_handler)
    app.add_exception_handler(RequestValidationError, _validation_exception_handler)

    app.add_middleware(RequestIdMiddleware)
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
