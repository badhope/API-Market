from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from api_market.config import get_settings
from api_market.database import get_db
from api_market.limiter import limiter
from api_market.models.schemas import SearchResponse, SearchResultItem
from api_market.services.api_service import get_api_service

router = APIRouter(tags=["search"])
settings = get_settings()

MAX_QUERY_LENGTH = 200


@router.get("/api/search", response_model=SearchResponse)
@limiter.limit(f"{settings.rate_limit_search_per_minute}/minute")
async def search_apis(
    request: Request,
    q: str = Query(..., min_length=1, max_length=MAX_QUERY_LENGTH, description="Search query"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    category: str | None = Query(None, description="Filter by category ID"),
    sort: str = Query(
        "relevance",
        pattern="^(relevance|name|quality|category|updated)$",
        description="Sort field: relevance, name, quality, category, updated",
    ),
    order: str = Query("asc", pattern="^(asc|desc)$", description="Sort order: asc, desc"),
    db: AsyncSession = Depends(get_db),
) -> SearchResponse:
    service = get_api_service(db)
    items, total = await service.search(
        query_text=q,
        page=page,
        per_page=per_page,
        category_id=category,
        sort_by=sort,
        order=order,
    )
    total_pages = (total + per_page - 1) // per_page if total > 0 else 0
    return SearchResponse(
        query=q,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        items=[SearchResultItem(**item) for item in items],
    )
