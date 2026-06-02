"""Build static JSON data files for GitHub Pages deployment.

Reads the SQLite database at data/api_market.db and writes lightweight
JSON files to frontend/public/data/ that the static frontend can fetch
without a backend.

Generated files:
  - stats.json             : aggregate stats (total APIs, categories, sources, grades, coverage)
  - categories.json        : full category list with summary stats
  - featured.json          : top 12 categories + top 9 quality APIs for the home page
  - category/<id>.json     : top 12 APIs per category (one file per category, 44 files)
  - top.json               : top 50 quality APIs for "browse all" view
  - manifest.json          : build metadata (built_at, version, file count)

Total footprint: ~2-3 MB. These get committed to the repo so the
GitHub Pages build is fully self-contained and doesn't need a backend
at runtime.
"""
from __future__ import annotations

import json
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "data" / "api_market.db"
OUT_DIR = ROOT / "frontend" / "public" / "data"
VERSION = "5.0.0"


def _row_to_api(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "url": row["url"],
        "description": row["description"],
        "category_id": row["category_id"],
        "auth": row["auth"],
        "https": bool(row["https"]) if row["https"] is not None else None,
        "cors": bool(row["cors"]) if row["cors"] is not None else None,
        "source": row["source"],
        "quality_score": row["quality_score"] or 0,
        "quality_grade": row["quality_grade"],
        "tags": [t.strip() for t in (row["tags"] or "").split(",") if t.strip()],
        "status": row["status"] or "active",
        "deprecated": bool(row["deprecated"]),
        "last_verified": row["last_verified"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def build_stats(conn: sqlite3.Connection) -> dict:
    cur = conn.cursor()
    total_apis = cur.execute("SELECT COUNT(*) FROM apis").fetchone()[0]
    total_categories = cur.execute("SELECT COUNT(*) FROM categories").fetchone()[0]
    grade_rows = cur.execute(
        "SELECT quality_grade, COUNT(*) FROM apis "
        "WHERE quality_grade IS NOT NULL GROUP BY quality_grade"
    ).fetchall()
    grade_distribution = {g: c for g, c in grade_rows}
    sources = [r[0] for r in cur.execute(
        "SELECT DISTINCT source FROM apis WHERE source IS NOT NULL ORDER BY source"
    ).fetchall() if r[0]]
    auth_count = cur.execute("SELECT COUNT(*) FROM apis WHERE auth IS NOT NULL").fetchone()[0]
    https_count = cur.execute("SELECT COUNT(*) FROM apis WHERE https = 1").fetchone()[0]
    cors_count = cur.execute("SELECT COUNT(*) FROM apis WHERE cors = 1").fetchone()[0]
    desc_count = cur.execute(
        "SELECT COUNT(*) FROM apis WHERE description IS NOT NULL AND LENGTH(description) > 5"
    ).fetchone()[0]
    last_updated_row = cur.execute("SELECT MAX(updated_at) FROM apis").fetchone()
    return {
        "total_apis": total_apis,
        "total_categories": total_categories,
        "sources": sources,
        "grade_distribution": grade_distribution,
        "metadata_coverage": {
            "auth": auth_count,
            "https": https_count,
            "cors": cors_count,
            "description": desc_count,
        },
        "last_updated": last_updated_row[0],
    }


def build_categories(conn: sqlite3.Connection) -> dict:
    cur = conn.cursor()
    rows = cur.execute("""
        SELECT c.id, c.name, c.display_name, c.icon, c.api_count,
               COALESCE(AVG(a.quality_score), 0) AS avg_quality
        FROM categories c
        LEFT JOIN apis a ON a.category_id = c.id
        GROUP BY c.id
        ORDER BY c.api_count DESC
    """).fetchall()
    items = [
        {
            "id": r[0],
            "name": r[1],
            "display_name": r[2],
            "icon": r[3],
            "api_count": r[4] or 0,
            "avg_quality": round(float(r[5] or 0), 1),
        }
        for r in rows
    ]
    return {"total": len(items), "items": items}


def build_featured(conn: sqlite3.Connection, categories_payload: dict) -> dict:
    cur = conn.cursor()
    featured_api_rows = cur.execute("""
        SELECT * FROM apis
        WHERE quality_grade IN ('A', 'B') AND deprecated = 0
        ORDER BY quality_score DESC, name ASC
        LIMIT 9
    """).fetchall()
    return {
        "top_categories": categories_payload["items"][:12],
        "top_apis": [_row_to_api(r) for r in featured_api_rows],
    }


def build_category_pages(conn: sqlite3.Connection) -> list[dict]:
    cur = conn.cursor()
    category_ids = [r[0] for r in cur.execute("SELECT id FROM categories ORDER BY api_count DESC").fetchall()]
    written = []
    for cid in category_ids:
        cat_row = cur.execute(
            "SELECT id, name, display_name, icon, api_count FROM categories WHERE id = ?",
            (cid,),
        ).fetchone()
        if not cat_row:
            continue
        api_rows = cur.execute("""
            SELECT * FROM apis
            WHERE category_id = ? AND deprecated = 0
            ORDER BY quality_score DESC, name ASC
            LIMIT 12
        """, (cid,)).fetchall()
        payload = {
            "category": {
                "id": cat_row[0],
                "name": cat_row[1],
                "display_name": cat_row[2],
                "icon": cat_row[3],
                "api_count": cat_row[4] or 0,
                "avg_quality": 0.0,
            },
            "total": cat_row[4] or 0,
            "page": 1,
            "per_page": 12,
            "items": [_row_to_api(r) for r in api_rows],
        }
        out_path = OUT_DIR / "category" / f"{cid}.json"
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        written.append({"id": cid, "file": f"category/{cid}.json", "size": out_path.stat().st_size})
    return written


def build_top(conn: sqlite3.Connection) -> list[dict]:
    cur = conn.cursor()
    rows = cur.execute("""
        SELECT * FROM apis
        WHERE deprecated = 0
        ORDER BY quality_score DESC, name ASC
        LIMIT 50
    """).fetchall()
    return [_row_to_api(r) for r in rows]


def main() -> int:
    if not DB_PATH.exists():
        print(f"ERROR: database not found: {DB_PATH}", file=sys.stderr)
        return 1
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "category").mkdir(exist_ok=True)

    print(f"Reading from {DB_PATH}")
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row

    stats = build_stats(conn)
    categories = build_categories(conn)
    featured = build_featured(conn, categories)
    category_files = build_category_pages(conn)
    top_apis = build_top(conn)

    (OUT_DIR / "stats.json").write_text(
        json.dumps(stats, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    (OUT_DIR / "categories.json").write_text(
        json.dumps(categories, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    (OUT_DIR / "featured.json").write_text(
        json.dumps(featured, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    (OUT_DIR / "top.json").write_text(
        json.dumps(top_apis, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )

    manifest = {
        "version": VERSION,
        "built_at": datetime.now(timezone.utc).isoformat(),
        "stats": {k: stats[k] for k in ("total_apis", "total_categories") if k in stats},
        "files": {
            "stats": "stats.json",
            "categories": "categories.json",
            "featured": "featured.json",
            "top": "top.json",
            "category_pages": len(category_files),
        },
        "category_files": [f["id"] for f in category_files],
    }
    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    total_size = sum(
        [(OUT_DIR / "stats.json").stat().st_size,
         (OUT_DIR / "categories.json").stat().st_size,
         (OUT_DIR / "featured.json").stat().st_size,
         (OUT_DIR / "top.json").stat().st_size,
         (OUT_DIR / "manifest.json").stat().st_size]
        + [f["size"] for f in category_files]
    )
    print(f"  stats.json            : {len(json.dumps(stats))} bytes")
    print(f"  categories.json       : {len(json.dumps(categories))} bytes")
    print(f"  featured.json         : {len(json.dumps(featured))} bytes")
    print(f"  top.json              : {len(json.dumps(top_apis))} bytes")
    print(f"  category/*.json       : {len(category_files)} files")
    print(f"  TOTAL: {total_size:,} bytes ({total_size / 1024 / 1024:.2f} MB)")
    print(f"Manifest: total_apis={stats['total_apis']}, total_categories={stats['total_categories']}")
    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
