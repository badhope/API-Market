from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_categories(async_client: AsyncClient) -> None:
    response = await async_client.get("/api/categories")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data
    assert isinstance(data["items"], list)
    assert data["total"] > 0


@pytest.mark.asyncio
async def test_list_categories_sort(async_client: AsyncClient) -> None:
    response = await async_client.get("/api/categories?sort=name&order=asc")
    assert response.status_code == 200
    data = response.json()
    names = [c["name"] for c in data["items"]]
    assert names == sorted(names)
