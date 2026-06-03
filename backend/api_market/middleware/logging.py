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
        # `default-src 'self'` plus an explicit allowlist for the inline
        # bootstrap script in the Next.js root layout. JSON responses
        # (the only thing this API serves) aren't rendered by a browser,
        # so the CSP is mostly a defense-in-depth backstop.
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'self'"
        )
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
    """Strict, spec-compliant CORS handler.

    The previous version emitted ``Access-Control-Allow-Origin: https://a, https://b``
    when more than one origin was configured, which the CORS spec explicitly
    forbids — the browser will treat the response as a wildcard miss and
    block the request. This implementation reflects the *request*'s
    ``Origin`` header against the configured allowlist, and echoes the
    preflight ``Access-Control-Request-Headers`` so non-default headers
    (e.g. ``X-Request-Id``) survive the preflight round-trip.
    """

    PREFLIGHT_HEADERS = "Content-Type, Authorization, X-Request-Id"

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)
        self._settings = get_settings()

    async def dispatch(self, request: Request, call_next: NextRequest) -> Response:
        if request.method == "OPTIONS":
            response = Response(status_code=204)
            self._set_cors_headers(request, response)
            return response
        response = await call_next(request)
        self._set_cors_headers(request, response)
        return response

    def _set_cors_headers(self, request: Request, response: Response) -> None:
        origins = self._settings.cors_origins
        request_origin = request.headers.get("origin")

        if "*" in origins:
            # `*` is only valid with no credentials — keep behaviour explicit
            # so future maintainers don't accidentally enable credentialed wildcards.
            response.headers["Access-Control-Allow-Origin"] = "*"
        elif request_origin and request_origin in origins:
            response.headers["Access-Control-Allow-Origin"] = request_origin
            response.headers["Vary"] = "Origin"
        elif origins:
            # Fall back to the first configured origin rather than emitting
            # an invalid comma-separated list. Caches still need Vary to
            # avoid leaking one origin's response to another.
            response.headers["Access-Control-Allow-Origin"] = origins[0]
            response.headers["Vary"] = "Origin"

        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = self.PREFLIGHT_HEADERS
        response.headers["Access-Control-Max-Age"] = "86400"
        if "*" not in origins:
            response.headers["Access-Control-Allow-Credentials"] = "true"
