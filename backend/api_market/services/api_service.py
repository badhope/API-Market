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
        # SQLAlchemy AsyncSession is single-connection, so we have to
        # issue the queries serially. Three queries: aggregate row,
        # grade histogram, distinct sources. Each is cheap on indexed
        # columns; the whole thing finishes in a few ms on SQLite.
        agg_sql = text("""
            SELECT
                COUNT(*) AS total,
                COUNT(quality_grade) AS with_grade,
                COUNT(auth) AS with_auth,
                COALESCE(SUM(https), 0) AS https_count,
                COALESCE(SUM(cors), 0) AS cors_count,
                MAX(updated_at) AS last_updated
            FROM apis
        """)
        grade_sql = text("""
            SELECT quality_grade, COUNT(*) AS cnt
            FROM apis
            WHERE quality_grade IS NOT NULL
            GROUP BY quality_grade
        """)
        desc_sql = text("""
            SELECT COUNT(*) FROM apis
            WHERE description IS NOT NULL AND LENGTH(description) > 5
        """)
        src_sql = text("SELECT DISTINCT source FROM apis WHERE source IS NOT NULL")
        cat_sql = select(func.count(Category.id))

        agg = (await self.db.execute(agg_sql)).one()
        grades = (await self.db.execute(grade_sql)).all()
        desc = (await self.db.execute(desc_sql)).scalar()
        sources_rows = (await self.db.execute(src_sql)).all()
        cats = (await self.db.execute(cat_sql)).scalar()

        grade_dist: dict[str, int] = {r[0]: int(r[1]) for r in grades if r[0] is not None}
        sources = sorted(r[0] for r in sources_rows if r[0])
        # SQLite returns the column as a str when stored as TEXT; let
        # both str and datetime pass through unchanged.
        lu = agg.last_updated
        last_updated_iso = lu if isinstance(lu, str) else (lu.isoformat() if lu else None)

        return {
            "total_apis": int(agg.total or 0),
            "total_categories": int(cats or 0),
            "sources": sources,
            "grade_distribution": grade_dist,
            "metadata_coverage": {
                "auth": int(agg.with_auth or 0),
                "https": int(agg.https_count or 0),
                "cors": int(agg.cors_count or 0),
                "description": int(desc or 0),
            },
            "last_updated": last_updated_iso,
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

    @staticmethod
    def _escape_fts5(query_text: str) -> str | None:
        """Return a safe FTS5 MATCH expression, or None if the query is
        effectively empty after sanitisation.

        Failure modes we have to handle:
          1. FTS5 syntax characters (`*`, `:`, `(`, `)`, `^`, `+`, `-`)
             would be parsed as operators. A bare `*` raises a syntax
             error; `foo:5` is parsed as `column:term`.
          2. Double quotes would let the user close the literal and run
             arbitrary FTS5 syntax.

        Wrapping the (sanitised) query in double quotes makes FTS5
        treat it as a phrase-literal string; the operator characters
        inside are inert. If sanitisation leaves nothing but whitespace
        we return None so the caller can short-circuit with an empty
        result instead of raising a FTS5 syntax error.
        """
        sanitised = query_text
        for ch in '"*():^+-':
            sanitised = sanitised.replace(ch, " ")
        phrase = sanitised.strip()
        if not phrase:
            return None
        return f'"{phrase}"'

    async def search(
        self,
        query_text: str,
        page: int = 1,
        per_page: int = 20,
        category_id: str | None = None,
        sort_by: str = "relevance",
        order: str = "asc",
    ) -> tuple[list[SearchItem], int]:
        safe_query = self._escape_fts5(query_text)
        if safe_query is None:
            # Query is all FTS5 operators / whitespace — there is no
            # sensible MATCH expression, so short-circuit with an empty
            # result instead of asking SQLite to parse a syntax error.
            return [], 0

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
