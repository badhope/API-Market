from __future__ import annotations

import os
import sqlite3
import tempfile
from collections.abc import AsyncGenerator
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

TEST_DATA_DIR = Path(tempfile.mkdtemp())
TEST_DB_PATH = TEST_DATA_DIR / "test_api_market.db"


@pytest.fixture(scope="session")
def test_db_path() -> str:
    prod_db = Path(__file__).resolve().parents[3] / "data" / "api_market.db"
    if prod_db.exists():
        return str(prod_db)

    conn = sqlite3.connect(str(TEST_DB_PATH))
    conn.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            display_name TEXT NOT NULL,
            icon TEXT,
            api_count INTEGER DEFAULT 0
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS apis (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            description TEXT DEFAULT '',
            category_id TEXT NOT NULL REFERENCES categories(id),
            auth TEXT,
            https BOOLEAN,
            cors BOOLEAN,
            source TEXT,
            source_url TEXT,
            quality_score INTEGER DEFAULT 0,
            quality_grade TEXT,
            tags TEXT,
            status TEXT DEFAULT 'active',
            deprecated BOOLEAN DEFAULT 0,
            last_verified TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS apis_fts USING fts5(
            api_id UNINDEXED, name, description, category_name, tags,
            tokenize='porter unicode61'
        )
    """)
    conn.execute("""
        INSERT OR REPLACE INTO categories (id, name, display_name, icon, api_count)
        VALUES
            ('weather', 'weather', 'Weather', '🌤', 1),
            ('development', 'development', 'Development', '💻', 1)
    """)
    conn.execute("""
        INSERT OR REPLACE INTO apis
            (id, name, url, description, category_id, auth, https, cors,
             source, source_url, quality_score, quality_grade, tags, status, deprecated)
        VALUES
            ('weather_openweathermap', 'OpenWeatherMap', 'https://api.openweathermap.org',
             'Current weather and forecast data', 'weather', 'apiKey', true, true,
             'public-apis', '', 85, 'A', 'weather,forecast,climate', 'active', 0),
            ('development_github', 'GitHub', 'https://api.github.com',
             'GitHub REST API v3', 'development', 'OAuth', true, true,
             'public-apis', '', 90, 'A', 'git,repository,code', 'active', 0)
    """)
    conn.execute("""
        INSERT INTO apis_fts (api_id, name, description, category_name, tags)
        SELECT id, name, COALESCE(description, ''),
               (SELECT name FROM categories WHERE id = category_id),
               COALESCE(tags, '')
        FROM apis
    """)
    conn.commit()
    conn.close()
    return str(TEST_DB_PATH)


@pytest.fixture
async def async_client(test_db_path: str) -> AsyncGenerator[AsyncClient, None]:
    os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{test_db_path}"

    from api_market.config import get_settings

    get_settings.cache_clear()

    from api_market.main import create_app

    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
