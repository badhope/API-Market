from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from api_market.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    display_name = Column(String(128), nullable=False)
    icon = Column(String(16), nullable=True)
    api_count = Column(Integer, default=0)

    apis = relationship("Api", back_populates="category_rel", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Category id={self.id} name={self.name}>"


class Api(Base):
    __tablename__ = "apis"

    id = Column(String(128), primary_key=True)
    name = Column(String(256), nullable=False, index=True)
    url = Column(String(1024), nullable=False)
    description = Column(Text, nullable=True, default="")
    category_id = Column(String(64), ForeignKey("categories.id"), nullable=False, index=True)
    auth = Column(String(32), nullable=True)
    https = Column(Boolean, nullable=True)
    cors = Column(Boolean, nullable=True)
    source = Column(String(256), nullable=True)
    source_url = Column(String(1024), nullable=True)
    quality_score = Column(Integer, default=0)
    quality_grade = Column(String(2), nullable=True)
    tags = Column(Text, nullable=True)
    status = Column(String(16), default="active")
    deprecated = Column(Boolean, default=False, index=True)
    last_verified = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category_rel = relationship("Category", back_populates="apis")

    def __repr__(self) -> str:
        return f"<Api id={self.id} name={self.name}>"

    @property
    def tag_list(self) -> list[str]:
        if not self.tags:
            return []
        return [t.strip() for t in self.tags.split(",") if t.strip()]