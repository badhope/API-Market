from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from api_market.database import Base

__all__ = ["Api", "Base", "Category"]


def _utcnow() -> datetime:
    """Timezone-aware UTC now. SQLAlchemy stores it as naive ISO text in SQLite."""
    return datetime.now(UTC).replace(tzinfo=None)


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    display_name: Mapped[str] = mapped_column(String(128), nullable=False)
    icon: Mapped[str | None] = mapped_column(String(16), nullable=True)
    api_count: Mapped[int] = mapped_column(Integer, default=0)

    # `noload` because no endpoint ever needs the full API list alongside
    # the category — the listing routes page over apis filtered by
    # category_id, and a default `selectin` here would force every
    # `GET /api/categories` to materialise all 14k rows in memory.
    apis = relationship("Api", back_populates="category_rel", lazy="noload")

    def __repr__(self) -> str:
        return f"<Category id={self.id} name={self.name}>"


class Api(Base):
    __tablename__ = "apis"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    name: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    url: Mapped[str] = mapped_column(String(1024), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True, default="")
    category_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("categories.id"), nullable=False, index=True
    )
    auth: Mapped[str | None] = mapped_column(String(32), nullable=True)
    https: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    cors: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    source: Mapped[str | None] = mapped_column(String(256), nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    # `quality_score` is used both for filtering (>= some threshold) and
    # sorting; the index makes `ORDER BY quality_score DESC` skip the
    # full table scan that would otherwise dominate list-queries.
    quality_score: Mapped[int] = mapped_column(Integer, default=0, index=True)
    quality_grade: Mapped[str | None] = mapped_column(String(2), nullable=True)
    tags: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="active")
    deprecated: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    last_verified: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    # `updated_at` is in the default sort path for both `list_apis` and
    # `search`; the index keeps `ORDER BY updated_at DESC LIMIT n` cheap.
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=_utcnow, onupdate=_utcnow, index=True
    )

    category_rel = relationship("Category", back_populates="apis", lazy="noload")

    def __repr__(self) -> str:
        return f"<Api id={self.id} name={self.name}>"

    @property
    def tag_list(self) -> list[str]:
        if not self.tags:
            return []
        return [t.strip() for t in self.tags.split(",") if t.strip()]
