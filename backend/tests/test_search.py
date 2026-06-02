from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_search_basic(async_client: AsyncClient) -> None:
    response = await async_client.get("/api/search?q=weather")
    assert response.status_code == 200
    data = response.json()
    assert "query" in data
    assert data["query"] == "weather"
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_search_pagination(async_client: AsyncClient) -> None:
    response = await async_client.get("/api/search?q=weather&page=1&per_page=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) <= 2


@pytest.mark.asyncio
async def test_search_empty_query(async_client: AsyncClient) -> None:
    response = await async_client.get("/api/search?q=x")
    assert response.status_code == 200
