from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_apis(async_client: AsyncClient) -> None:
    response = await async_client.get("/api?per_page=10")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "page" in data
    assert "items" in data
    assert isinstance(data["items"], list)


@pytest.mark.asyncio
async def test_list_apis_pagination(async_client: AsyncClient) -> None:
    response = await async_client.get("/api?page=2&per_page=1")
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 2
    assert data["per_page"] == 1


@pytest.mark.asyncio
async def test_list_apis_invalid_page(async_client: AsyncClient) -> None:
    response = await async_client.get("/api?page=0")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_apis_filter_grade(async_client: AsyncClient) -> None:
    response = await async_client.get("/api?grade=A")
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert item.get("quality_grade") == "A"


@pytest.mark.asyncio
async def test_get_stats(async_client: AsyncClient) -> None:
    response = await async_client.get("/api/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_apis" in data
    assert "total_categories" in data
    assert "sources" in data
    assert "grade_distribution" in data
    assert data["total_apis"] > 0


@pytest.mark.asyncio
async def test_get_category_apis(async_client: AsyncClient) -> None:
    response = await async_client.get("/api/category/weather")
    assert response.status_code == 200
    data = response.json()
    assert "category" in data
    assert "items" in data


@pytest.mark.asyncio
async def test_get_category_apis_not_found(async_client: AsyncClient) -> None:
    response = await async_client.get("/api/category/nonexistent")
    assert response.status_code == 404
