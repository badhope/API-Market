from __future__ import annotations

import contextlib
import json
from typing import Any

import redis.asyncio as aioredis

from api_market.config import get_settings

settings = get_settings()


class CacheService:
    def __init__(self) -> None:
        self._redis: aioredis.Redis | None = None
        self._enabled = bool(settings.redis_url)

    async def _ensure_connection(self) -> aioredis.Redis | None:
        if not self._enabled:
            return None
        if self._redis is None:
            try:
                self._redis = aioredis.from_url(
                    settings.redis_url,
                    encoding="utf-8",
                    decode_responses=True,
                    socket_connect_timeout=2,
                    socket_timeout=2,
                )
                await self._redis.ping()
            except Exception:
                self._enabled = False
                self._redis = None
                return None
        return self._redis

    async def get(self, key: str) -> Any | None:
        redis = await self._ensure_connection()
        if redis is None:
            return None
        try:
            data = await redis.get(key)
            if data:
                return json.loads(data)
        except Exception:
            pass
        return None

    async def set(self, key: str, value: Any, ttl: int = 300) -> None:
        redis = await self._ensure_connection()
        if redis is None:
            return
        with contextlib.suppress(Exception):
            await redis.setex(key, ttl, json.dumps(value, default=str))

    async def delete(self, key: str) -> None:
        redis = await self._ensure_connection()
        if redis is None:
            return
        with contextlib.suppress(Exception):
            await redis.delete(key)

    async def flush_pattern(self, pattern: str) -> None:
        redis = await self._ensure_connection()
        if redis is None:
            return
        try:
            cursor = 0
            while True:
                cursor, keys = await redis.scan(cursor, match=pattern, count=100)
                if keys:
                    await redis.delete(*keys)
                if cursor == 0:
                    break
        except Exception:
            pass

    async def close(self) -> None:
        if self._redis:
            await self._redis.close()
            self._redis = None


_cache: CacheService | None = None


def get_cache() -> CacheService:
    global _cache
    if _cache is None:
        _cache = CacheService()
    return _cache
