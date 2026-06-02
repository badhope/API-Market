from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api_market.config import get_settings
from api_market.database import get_db
from api_market.models.api import Api
from api_market.models.schemas import (
    ApiListResponse,
    ApiSummary,
    CategoryDetailResponse,
    StatsResponse,
)
from api_market.services.api_service import get_api_service

router = APIRouter(tags=["apis"])
settings = get_settings()

limiter = Limiter(key_func=get_remote_address)


@router.get("/api/stats", response_model=StatsResponse)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def get_stats(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> StatsResponse:
    service = get_api_service(db)
    stats = await service.get_stats()
    return StatsResponse(**stats)


@router.get("/api", response_model=ApiListResponse)
@router.get("/api/", response_model=ApiListResponse)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def list_apis(
    request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    sort: str = Query(
        "name",
        pattern="^(name|quality|category|updated)$",
        description="Sort field: name, quality, category, updated",
    ),
    order: str = Query("asc", pattern="^(asc|desc)$", description="Sort order"),
    grade: str | None = Query(None, pattern="^[ABCDF]$", description="Filter by quality grade"),
    category: str | None = Query(None, description="Filter by category ID"),
    cors: bool | None = Query(None, description="Filter CORS-enabled APIs"),
    free: bool | None = Query(None, description="Filter free (no auth) APIs"),
    db: AsyncSession = Depends(get_db),
) -> ApiListResponse:
    service = get_api_service(db)
    apis, total = await service.list_apis(
        page=page,
        per_page=per_page,
        sort_by=sort,
        order=order,
        grade=grade,
        category_id=category,
        cors_only=cors,
        free_only=free,
    )
    total_pages = (total + per_page - 1) // per_page if total > 0 else 0
    return ApiListResponse(
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        items=[ApiSummary.from_orm_obj(a) for a in apis],
    )


@router.get("/api/category/{category_id}", response_model=CategoryDetailResponse)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def get_category_apis(
    request: Request,
    category_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    sort: str = Query(
        "quality",
        pattern="^(name|quality|category|updated)$",
        description="Sort field",
    ),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
) -> CategoryDetailResponse:
    service = get_api_service(db)
    category = await service.get_category(category_id)
    if not category:
        raise HTTPException(status_code=404, detail=f"Category '{category_id}' not found")

    apis, total = await service.list_apis(
        page=page,
        per_page=per_page,
        sort_by=sort,
        order=order,
        category_id=category_id,
    )
    total_pages = (total + per_page - 1) // per_page if total > 0 else 0

    avg_result = await db.execute(
        select(func.avg(Api.quality_score)).where(Api.category_id == category_id)
    )
    avg = avg_result.scalar()
    avg_quality = round(float(avg), 1) if avg else 0.0

    return CategoryDetailResponse(
        category={
            "id": category.id,
            "name": category.name,
            "display_name": category.display_name,
            "icon": category.icon,
            "api_count": category.api_count,
            "avg_quality": avg_quality,
        },
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        items=[ApiSummary.from_orm_obj(a) for a in apis],
    )
