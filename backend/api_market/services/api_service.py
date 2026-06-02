from __future__ import annotations

from typing import Any

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import InstrumentedAttribute
from sqlalchemy.sql import ColumnElement

from api_market.models.api import Api, Category

SearchItem = dict[str, Any]
SortableColumn = InstrumentedAttribute[Any] | ColumnElement[Any]


class ApiService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_stats(self) -> dict[str, Any]:
        total_apis_result = await self.db.execute(select(func.count(Api.id)))
        total_apis: int = total_apis_result.scalar() or 0

        total_cats_result = await self.db.execute(select(func.count(Category.id)))
        total_cats: int = total_cats_result.scalar() or 0

        grade_result = await self.db.execute(
            select(Api.quality_grade, func.count(Api.id))
            .where(Api.quality_grade.isnot(None))
            .group_by(Api.quality_grade)
        )
        grade_dist: dict[str, int] = {row[0]: row[1] for row in grade_result.all() if row[0]}

        auth_count_result = await self.db.execute(
            select(func.count(Api.id)).where(Api.auth.isnot(None))
        )
        auth_count: int = auth_count_result.scalar() or 0

        https_count_result = await self.db.execute(
            select(func.count(Api.id)).where(Api.https.is_(True))
        )
        https_count: int = https_count_result.scalar() or 0

        cors_count_result = await self.db.execute(
            select(func.count(Api.id)).where(Api.cors.is_(True))
        )
        cors_count: int = cors_count_result.scalar() or 0

        desc_count_result = await self.db.execute(
            select(func.count(Api.id))
            .where(Api.description.isnot(None))
            .where(func.length(Api.description) > 5)
        )
        desc_count: int = desc_count_result.scalar() or 0

        sources_result = await self.db.execute(
            select(Api.source).where(Api.source.isnot(None)).distinct()
        )
        sources: list[str] = [row[0] for row in sources_result.all() if row[0]]

        result = await self.db.execute(select(func.max(Api.updated_at)))
        last_updated = result.scalar()

        return {
            "total_apis": total_apis,
            "total_categories": total_cats,
            "sources": sources,
            "grade_distribution": grade_dist,
            "metadata_coverage": {
                "auth": auth_count,
                "https": https_count,
                "cors": cors_count,
                "description": desc_count,
            },
            "last_updated": last_updated.isoformat() if last_updated else None,
        }

    async def list_apis(
        self,
        page: int = 1,
        per_page: int = 20,
        sort_by: str = "name",
        order: str = "asc",
        grade: str | None = None,
        category_id: str | None = None,
        cors_only: bool = False,
        free_only: bool = False,
    ) -> tuple[list[Api], int]:
        query = select(Api)
        count_query = select(func.count(Api.id))

        if grade:
            query = query.where(Api.quality_grade == grade)
            count_query = count_query.where(Api.quality_grade == grade)
        if category_id:
            query = query.where(Api.category_id == category_id)
            count_query = count_query.where(Api.category_id == category_id)
        if cors_only:
            query = query.where(Api.cors.is_(True))
            count_query = count_query.where(Api.cors.is_(True))
        if free_only:
            query = query.where(Api.auth.is_(None))
            count_query = count_query.where(Api.auth.is_(None))

        sort_column: SortableColumn = Api.name
        if sort_by == "quality":
            sort_column = Api.quality_score
        elif sort_by == "category":
            sort_column = Api.category_id
        elif sort_by == "updated":
            sort_column = Api.updated_at

        if order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        total_result = await self.db.execute(count_query)
        total: int = total_result.scalar() or 0

        offset = max(0, (page - 1) * per_page)
        query = query.offset(offset).limit(per_page)

        result = await self.db.execute(query)
        apis = list(result.scalars().all())

        return apis, total

    async def get_categories(
        self,
        sort_by: str = "api_count",
        order: str = "desc",
    ) -> list[Category]:
        query = select(Category)

        col: SortableColumn = Category.api_count
        if sort_by == "name":
            col = Category.name

        if order == "desc":
            query = query.order_by(col.desc())
        else:
            query = query.order_by(col.asc())

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_category(self, category_id: str) -> Category | None:
        result = await self.db.execute(select(Category).where(Category.id == category_id))
        return result.scalar_one_or_none()

    async def search(
        self,
        query_text: str,
        page: int = 1,
        per_page: int = 20,
        category_id: str | None = None,
        sort_by: str = "relevance",
        order: str = "asc",
    ) -> tuple[list[SearchItem], int]:
        safe_query = query_text.replace('"', '""')

        count_sql = text("""
            SELECT COUNT(*)
            FROM apis_fts
            WHERE apis_fts MATCH :q
        """)
        count_result = await self.db.execute(count_sql, {"q": safe_query})
        total: int = count_result.scalar() or 0

        if sort_by and sort_by != "relevance":
            sort_col_map: dict[str, str] = {
                "name": "a.name",
                "quality": "a.quality_score",
                "category": "a.category_id",
                "updated": "a.updated_at",
            }
            sort_col_name = sort_col_map.get(sort_by, "a.name")

            sort_dir = "DESC" if order == "desc" else "ASC"

            where_clause = "WHERE f.apis_fts MATCH :q"
            if category_id:
                where_clause += " AND a.category_id = :cat"

            sort_sql = text(f"""
                SELECT a.id, a.name, a.url, a.description, a.category_id,
                       a.auth, a.https, a.cors, a.source,
                       a.quality_score, a.quality_grade, a.tags, a.status,
                       a.deprecated, a.last_verified, a.created_at, a.updated_at,
                       0 as rank
                FROM apis_fts f
                JOIN apis a ON f.api_id = a.id
                {where_clause}
                ORDER BY {sort_col_name} {sort_dir}
                LIMIT :lim OFFSET :off
            """)
            offset = max(0, (page - 1) * per_page)
            params: dict[str, Any] = {"q": safe_query, "lim": per_page, "off": offset}
            if category_id:
                params["cat"] = category_id
            result = await self.db.execute(sort_sql, params)
            items: list[SearchItem] = [self._row_to_search_item(row) for row in result.fetchall()]
            return items, total

        if category_id:
            fetch_count = per_page * 5
            fetch_offset = max(0, (page - 1) * per_page)
        else:
            fetch_count = per_page
            fetch_offset = max(0, (page - 1) * per_page)

        search_sql = text("""
            SELECT a.id, a.name, a.url, a.description, a.category_id,
                   a.auth, a.https, a.cors, a.source,
                   a.quality_score, a.quality_grade, a.tags, a.status,
                   a.deprecated, a.last_verified, a.created_at, a.updated_at,
                   rank
            FROM apis_fts
            JOIN apis a ON apis_fts.api_id = a.id
            WHERE apis_fts MATCH :q
            ORDER BY rank
            LIMIT :limit OFFSET :offset
        """)
        result = await self.db.execute(
            search_sql,
            {"q": safe_query, "limit": fetch_count, "offset": fetch_offset},
        )

        filtered: list[SearchItem] = []
        for row in result.fetchall():
            item = self._row_to_search_item(row)
            if category_id and item["category_id"] != category_id:
                continue
            filtered.append(item)
            if len(filtered) >= per_page:
                break

        if category_id:
            total = await self._count_matching_category(safe_query, category_id)

        return filtered, total

    def _row_to_search_item(self, row: Any) -> SearchItem:
        return {
            "id": row[0],
            "name": row[1],
            "url": row[2],
            "description": row[3],
            "category_id": row[4],
            "auth": row[5],
            "https": row[6],
            "cors": row[7],
            "source": row[8],
            "quality_score": row[9],
            "quality_grade": row[10],
            "tags": [t.strip() for t in (row[11] or "").split(",") if t.strip()],
            "status": row[12],
            "deprecated": row[13],
            "last_verified": row[14],
            "created_at": row[15],
            "updated_at": row[16],
            "relevance_score": round(row[17], 4) if row[17] is not None else 1.0,
        }

    async def _count_matching_category(self, safe_query: str, category_id: str) -> int:
        count_sql = text("""
            SELECT COUNT(*)
            FROM apis_fts
            JOIN apis a ON apis_fts.api_id = a.id
            WHERE apis_fts MATCH :q AND a.category_id = :cat
        """)
        result = await self.db.execute(count_sql, {"q": safe_query, "cat": category_id})
        return result.scalar() or 0


def get_api_service(db: AsyncSession) -> ApiService:
    return ApiService(db)
