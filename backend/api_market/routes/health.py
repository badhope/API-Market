from __future__ import annotations

import time

from fastapi import APIRouter

from api_market.config import get_settings
from api_market.models.schemas import HealthResponse

router = APIRouter(tags=["health"])

_start_time = time.time()


@router.get("/api/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        version=settings.app_version,
        uptime=round(time.time() - _start_time, 1),
    )
