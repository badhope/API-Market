#!/usr/bin/env python3
"""Migrate data from legacy JSON format to SQLite with FTS5 full-text search."""

from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
DB_PATH = DATA_DIR / "api_market.db"
LEGACY_DB_PATH = Path(__file__).resolve().parents[1] / "api-database.json"
LEGACY_INDEX_PATH = Path(__file__).resolve().parents[1] / "search-index.json"

CATEGORY_ICONS: dict[str, str] = {
    "animals": "\U0001f43e",
    "anime": "\U0001f38c",
    "anti-malware": "\U0001f6e1",
    "analytics": "\U0001f4ca",
    "art-design": "\U0001f3a8",
    "auth": "\U0001f510",
    "blockchain": "\u26d3",
    "books": "\U0001f4da",
    "business": "\U0001f4bc",
    "calendar": "\U0001f4c5",
    "ci": "\U0001f504",
    "cloud-storage": "\u2601",
    "collaboration": "\U0001f91d",
    "cryptocurrency": "\U0001fa99",
    "currency": "\U0001f4b1",
    "data-validation": "\u2705",
    "development": "\U0001f4bb",
    "dictionaries": "\U0001f4d6",
    "documents": "\U0001f4c4",
    "education": "\U0001f393",
    "email": "\U0001f4e7",
    "entertainment": "\U0001f3ac",
    "environment": "\U0001f331",
    "events": "\U0001f4c5",
    "finance": "\U0001f4b0",
    "food-drink": "\U0001f354",
    "games-comics": "\U0001f3ae",
    "geocoding": "\U0001f5fa",
    "government": "\U0001f3db",
    "health": "\U0001f3e5",
    "iot": "\U0001f4e1",
    "jobs": "\U0001f4bc",
    "machine-learning": "\U0001f916",
    "media": "\U0001f4fa",
    "music": "\U0001f3b5",
    "news": "\U0001f4f0",
    "open-data": "\U0001f4ca",
    "open-source": "\U0001f527",
    "other": "\U0001f4e6",
    "patent": "\U0001f4dc",
    "payment": "\U0001f4b3",
    "personality": "\U0001f9e0",
    "phone": "\U0001f4f1",
    "photography": "\U0001f4f7",
    "programming": "\U0001f4bb",
    "science-math": "\U0001f52c",
    "security": "\U0001f512",
    "shopping": "\U0001f6d2",
    "social": "\U0001f465",
    "sports": "\u26bd",
    "sports-fitness": "\u26bd",
    "telecom": "\U0001f4de",
    "test-data": "\U0001f9ea",
    "text-analysis": "\U0001f4dd",
    "tracking": "\U0001f4cd",
    "transportation": "\U0001f697",
    "url-shorteners": "\U0001f517",
    "vehicle": "\U0001f699",
    "video": "\U0001f4f9",
    "weather": "\U0001f324",
}

CATEGORY_DISPLAY_NAMES: dict[str, str] = {
    "animals": "Animals",
    "anime": "Anime",
    "anti-malware": "Anti-Malware",
    "analytics": "Analytics & Metrics",
    "art-design": "Art & Design",
    "auth": "Authentication & Authorization",
    "blockchain": "Blockchain",
    "books": "Books",
    "business": "Business",
    "calendar": "Calendar",
    "ci": "Continuous Integration",
    "cloud-storage": "Cloud Storage & File Sharing",
    "collaboration": "Collaboration",
    "cryptocurrency": "Cryptocurrency",
    "currency": "Currency Exchange",
    "data-validation": "Data Validation",
    "development": "Development",
    "dictionaries": "Dictionaries",
    "documents": "Documents & Productivity",
    "education": "Education",
    "email": "Email",
    "entertainment": "Entertainment",
    "environment": "Environment",
    "events": "Events",
    "finance": "Finance",
    "food-drink": "Food & Drink",
    "games-comics": "Games & Comics",
    "geocoding": "Geocoding",
    "government": "Government",
    "health": "Health",
    "iot": "IoT (Internet of Things)",
    "jobs": "Jobs",
    "machine-learning": "Machine Learning & AI",
    "media": "Media",
    "music": "Music",
    "news": "News & Media",
    "open-data": "Open Data",
    "open-source": "Open Source Projects",
    "other": "Other",
    "patent": "Patent",
    "payment": "Payment & Billing",
    "personality": "Personality",
    "phone": "Phone & Telecom",
    "photography": "Photography & Images",
    "programming": "Programming",
    "science-math": "Science & Math",
    "security": "Security",
    "shopping": "Shopping & E-commerce",
    "social": "Social & Messaging",
    "sports": "Sports & Fitness",
    "sports-fitness": "Sports & Fitness",
    "telecom": "Telecom",
    "test-data": "Test Data",
    "text-analysis": "Text Analysis & NLP",
    "tracking": "Tracking",
    "transportation": "Transportation & Travel",
    "url-shorteners": "URL Shorteners",
    "vehicle": "Vehicle",
    "video": "Video",
    "weather": "Weather",
}


def sanitize_id(text: str) -> str:
    safe = re.sub(r"[^a-z0-9_]", "_", text.lower().strip())
    return safe[:120]


def main() -> None:
    print("=" * 60)
    print("  API-Market Data Migration: JSON -> SQLite + FTS5")
    print("=" * 60)

    if not LEGACY_DB_PATH.exists():
        print(f"\nERROR: Legacy database not found at {LEGACY_DB_PATH}")
        sys.exit(1)

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if DB_PATH.exists():
        DB_PATH.unlink()
        print(f"  Removed existing database: {DB_PATH}")

    engine = create_engine(f"sqlite:///{DB_PATH}")

    print("\n[1/5] Loading legacy JSON...")
    with open(LEGACY_DB_PATH, encoding="utf-8") as f:
        legacy_db = json.load(f)

    total_api_count = legacy_db["metadata"]["total_apis"]
    categories_raw = legacy_db["categories"]
    print(f"  Loaded {total_api_count} APIs across {len(categories_raw)} categories")

    print("\n[2/5] Creating database schema...")
    with engine.begin() as conn:
        conn.execute(
            text("""
            CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                display_name TEXT NOT NULL,
                icon TEXT,
                api_count INTEGER DEFAULT 0
            )
        """)
        )
        conn.execute(
            text("""
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
        )
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_apis_name ON apis(name)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_apis_category ON apis(category_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_apis_quality ON apis(quality_score)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_apis_deprecated ON apis(deprecated)"))

        conn.execute(
            text("""
            CREATE VIRTUAL TABLE IF NOT EXISTS apis_fts USING fts5(
                api_id UNINDEXED,
                name,
                description,
                category_name,
                tags,
                tokenize='porter unicode61'
            )
        """)
        )

    print("[3/5] Migrating categories and APIs...")
    total_migrated = 0

    with Session(engine) as session:
        for cat_data in categories_raw:
            cat_id = cat_data["id"]
            cat_name = cat_data.get("name", cat_id)
            display_name = CATEGORY_DISPLAY_NAMES.get(
                cat_id, cat_data.get("display_name", cat_name)
            )
            icon = CATEGORY_ICONS.get(cat_id, "\U0001f4e6")

            session.execute(
                text("""
                    INSERT OR REPLACE INTO categories (id, name, display_name, icon, api_count)
                    VALUES (:id, :name, :display_name, :icon, :api_count)
                """),
                {
                    "id": cat_id,
                    "name": cat_name,
                    "display_name": display_name,
                    "icon": icon,
                    "api_count": cat_data.get("api_count", len(cat_data.get("apis", []))),
                },
            )

            apis_data = cat_data.get("apis", [])
            for api_data in apis_data:
                api_id = api_data.get("id", f"{cat_id}_{sanitize_id(api_data.get('name', ''))}")
                api_id = api_id[:128]

                description = api_data.get("description", "")
                if isinstance(description, str) and description.strip():
                    description = description.strip()
                else:
                    description = ""

                auth = api_data.get("auth")
                if auth == "" or (isinstance(auth, str) and auth.strip().lower() == "no"):
                    auth = None

                https_val = api_data.get("https")
                if isinstance(https_val, bool):
                    https = https_val
                elif isinstance(https_val, str):
                    https = https_val.strip().lower() == "yes"
                else:
                    https = None

                cors_val = api_data.get("cors")
                if isinstance(cors_val, bool):
                    cors = cors_val
                elif isinstance(cors_val, str):
                    cors = cors_val.strip().lower() == "yes"
                else:
                    cors = None

                tags = api_data.get("tags", [])
                tags_str = ",".join(str(t) for t in tags) if isinstance(tags, list) else ""

                quality_score = api_data.get("quality_score") or api_data.get("quality", {}).get(
                    "score", 0
                )
                quality_grade = api_data.get("quality_grade") or api_data.get("quality", {}).get(
                    "grade"
                )

                source = api_data.get("source", "")
                if isinstance(source, list):
                    source = ",".join(str(s) for s in source)

                session.execute(
                    text("""
                        INSERT OR REPLACE INTO apis
                            (id, name, url, description, category_id, auth, https, cors,
                             source, quality_score, quality_grade, tags, status, deprecated, updated_at)
                        VALUES
                            (:id, :name, :url, :description, :category_id, :auth, :https, :cors,
                             :source, :quality_score, :quality_grade, :tags, :status, :deprecated, :updated_at)
                    """),
                    {
                        "id": api_id,
                        "name": api_data.get("name", "Unknown"),
                        "url": api_data.get("url", ""),
                        "description": description,
                        "category_id": cat_id,
                        "auth": auth,
                        "https": https,
                        "cors": cors,
                        "source": source,
                        "quality_score": quality_score,
                        "quality_grade": quality_grade,
                        "tags": tags_str,
                        "status": api_data.get("status", "active"),
                        "deprecated": 1 if api_data.get("status") == "deprecated" else 0,
                        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
                    },
                )
                total_migrated += 1

            if total_migrated % 2000 == 0:
                session.commit()
                print(f"  Migrated {total_migrated}/{total_api_count} APIs...")

        session.commit()

    print("\n[4/5] Building FTS5 full-text search index...")
    with engine.begin() as conn:
        conn.execute(
            text("""
            INSERT INTO apis_fts(api_id, name, description, category_name, tags)
            SELECT a.id, a.name, COALESCE(a.description, ''),
                   COALESCE(c.name, ''), COALESCE(a.tags, '')
            FROM apis a
            LEFT JOIN categories c ON a.category_id = c.id
        """)
        )

    print("\n[5/5] Verifying migration...")
    with engine.begin() as conn:
        count_result = conn.execute(text("SELECT COUNT(*) FROM apis"))
        actual_count = count_result.scalar()
        cat_count_result = conn.execute(text("SELECT COUNT(*) FROM categories"))
        actual_cats = cat_count_result.scalar()
        fts_count_result = conn.execute(text("SELECT COUNT(*) FROM apis_fts"))
        fts_count = fts_count_result.scalar()

    engine.dispose()

    db_size_mb = DB_PATH.stat().st_size / 1024 / 1024

    print(f"\n{'=' * 60}")
    print("  Migration complete!")
    print(f"  APIs: {actual_count} (expected: {total_api_count})")
    print(f"  Categories: {actual_cats}")
    print(f"  FTS5 entries: {fts_count}")
    print(f"  Database size: {db_size_mb:.2f} MB")
    print(f"  Path: {DB_PATH}")
    print(f"{'=' * 60}")

    if actual_count != total_api_count:
        print(f"\n  WARNING: API count mismatch! ({actual_count} vs {total_api_count})")

    engine.dispose()


if __name__ == "__main__":
    main()
