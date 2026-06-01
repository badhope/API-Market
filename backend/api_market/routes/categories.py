from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from api_market.config import get_settings
from api_market.database import get_db
from api_market.models.api import Api
from api_market.models.schemas import CategoryListResponse, CategorySummary
from api_market.services.api_service import get_api_service

router = APIRouter(tags=["categories"])
settings = get_settings()

limiter = Limiter(key_func=get_remote_address)


@router.get("/api/categories", response_model=CategoryListResponse)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def list_categories(
    request: Request,
    sort: str = Query("api_count", description="Sort field: api_count, name"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
) -> CategoryListResponse:
    service = get_api_service(db)
    categories = await service.get_categories(sort_by=sort, order=order)

    items: list[CategorySummary] = []
    for cat in categories:
        avg_result = await db.execute(
            select(func.avg(Api.quality_score)).where(Api.category_id == cat.id)
        )
        avg = avg_result.scalar()
        avg_quality = round(float(avg), 1) if avg else 0.0

        items.append(
            CategorySummary(
                id=cat.id,
                name=cat.name,
                display_name=cat.display_name,
                icon=cat.icon,
                api_count=cat.api_count,
                avg_quality=avg_quality,
            )
        )

    return CategoryListResponse(total=len(items), items=items)