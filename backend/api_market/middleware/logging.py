from __future__ import annotations

import logging
import time
import uuid
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from api_market.config import get_settings

NextRequest = Callable[[Request], Awaitable[Response]]

_log = logging.getLogger("api_market.request")


class SlowRequestMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, threshold_ms: int = 200) -> None:
        super().__init__(app)
        self.threshold_ms = threshold_ms

    async def dispatch(self, request: Request, call_next: NextRequest) -> Response:
        start = time.monotonic()
        response = await call_next(request)
        elapsed_ms = (time.monotonic() - start) * 1000
        # Avoid breaking clients/proxies that strip it on the way back.
        response.headers["X-Response-Time-Ms"] = f"{elapsed_ms:.0f}"
        if elapsed_ms >= self.threshold_ms:
            _log.warning("slow request: %s %s %.0fms", request.method, request.url.path, elapsed_ms)
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: NextRequest) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Propagate a per-request id so logs and downstream 5xx responses can be correlated."""

    HEADER = "X-Request-Id"

    async def dispatch(self, request: Request, call_next: NextRequest) -> Response:
        rid = request.headers.get(self.HEADER) or uuid.uuid4().hex
        request.state.request_id = rid
        response = await call_next(request)
        response.headers[self.HEADER] = rid
        return response


class CORSMiddlewareFixed(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)
        self._settings = get_settings()

    async def dispatch(self, request: Request, call_next: NextRequest) -> Response:
        if request.method == "OPTIONS":
            response = Response(status_code=200)
            self._set_cors_headers(response)
            return response
        response = await call_next(request)
        self._set_cors_headers(response)
        return response

    def _set_cors_headers(self, response: Response) -> None:
        origins = self._settings.cors_origins
        if "*" in origins:
            response.headers["Access-Control-Allow-Origin"] = "*"
        else:
            response.headers["Access-Control-Allow-Origin"] = ", ".join(origins)
            response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Max-Age"] = "86400"
        if "*" not in origins:
            response.headers["Access-Control-Allow-Credentials"] = "true"
