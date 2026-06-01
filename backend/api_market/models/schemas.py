from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ApiSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    url: str
    description: str | None = ""
    category_id: str
    auth: str | None = None
    https: bool | None = None
    cors: bool | None = None
    source: str | None = None
    quality_score: int = 0
    quality_grade: str | None = None
    tags: list[str] = Field(default_factory=list)
    status: str = "active"
    deprecated: bool = False
    last_verified: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    @staticmethod
    def from_orm_obj(api: Any, include_tags: bool = True) -> ApiSummary:
        return ApiSummary(
            id=api.id,
            name=api.name,
            url=api.url,
            description=api.description,
            category_id=api.category_id,
            auth=api.auth,
            https=api.https,
            cors=api.cors,
            source=api.source,
            quality_score=api.quality_score,
            quality_grade=api.quality_grade,
            tags=api.tag_list if include_tags else [],
            status=api.status,
            deprecated=api.deprecated,
            last_verified=api.last_verified,
            created_at=api.created_at,
            updated_at=api.updated_at,
        )


class CategorySummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    display_name: str
    icon: str | None = None
    api_count: int = 0
    avg_quality: float = 0.0


class PaginatedResponse(BaseModel):
    total: int
    page: int
    per_page: int
    total_pages: int
    items: list[Any] = Field(default_factory=list)


class SearchResultItem(ApiSummary):
    relevance_score: float = 0.0


class SearchResponse(PaginatedResponse):
    query: str | None = None
    items: list[SearchResultItem] = Field(default_factory=list)


class ApiListResponse(PaginatedResponse):
    items: list[ApiSummary] = Field(default_factory=list)


class CategoryListResponse(BaseModel):
    total: int
    items: list[CategorySummary] = Field(default_factory=list)


class CategoryDetailResponse(BaseModel):
    category: CategorySummary
    total: int
    page: int
    per_page: int
    items: list[ApiSummary] = Field(default_factory=list)


class StatsResponse(BaseModel):
    total_apis: int
    total_categories: int
    sources: list[str] = Field(default_factory=list)
    grade_distribution: dict[str, int] = Field(default_factory=dict)
    metadata_coverage: dict[str, int] = Field(default_factory=dict)
    last_updated: str | None = None


class HealthResponse(BaseModel):
    status: str
    version: str
    uptime: float


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None