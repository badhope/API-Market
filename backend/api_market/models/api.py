from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from api_market.database import Base

if TYPE_CHECKING:
    pass


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    display_name: Mapped[str] = mapped_column(String(128), nullable=False)
    icon: Mapped[str | None] = mapped_column(String(16), nullable=True)
    api_count: Mapped[int] = mapped_column(Integer, default=0)

    apis = relationship("Api", back_populates="category_rel", lazy="selectin")

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
    quality_score: Mapped[int] = mapped_column(Integer, default=0)
    quality_grade: Mapped[str | None] = mapped_column(String(2), nullable=True)
    tags: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="active")
    deprecated: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    last_verified: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    category_rel = relationship("Category", back_populates="apis")

    def __repr__(self) -> str:
        return f"<Api id={self.id} name={self.name}>"

    @property
    def tag_list(self) -> list[str]:
        if not self.tags:
            return []
        return [t.strip() for t in self.tags.split(",") if t.strip()]
