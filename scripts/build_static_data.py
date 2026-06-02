"""Build static JSON data files for GitHub Pages deployment.

Reads the SQLite database at data/api_market.db and writes JSON snapshots
to frontend/public/data/ that the static frontend can fetch without a
backend. Every API is shipped — the frontend does all paging, sorting,
filtering, and search client-side.

Generated files:
  - stats.json             : aggregate stats (total APIs, categories, sources, grades)
  - categories.json        : full category list with summary stats
  - featured.json          : top 12 categories + top 9 quality APIs for the home page
  - all.json               : the full list of 14,000+ APIs (used for browse-all & search)
  - top.json               : top 50 quality APIs (used as a fast pre-rendered list)
  - category/<id>.json     : every API in each category (44 files, one per category)
  - manifest.json          : build metadata (built_at, version, file list)

Total footprint: ~5-6 MB uncompressed, ~1.5 MB gzipped. The GitHub Pages
limit is 1 GB, so this is well within bounds. All files are CDN-cached
forever once built, so users pay the download cost exactly once.
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


def build_all(conn: sqlite3.Connection) -> list[dict]:
    """Dump the entire API list (active + deprecated) for client-side search & browse."""
    cur = conn.cursor()
    rows = cur.execute("SELECT * FROM apis ORDER BY quality_score DESC, name ASC").fetchall()
    return [_row_to_api(r) for r in rows]


def build_category_pages(conn: sqlite3.Connection) -> list[dict]:
    """Write one JSON per category containing the first 12 APIs.

    The full list lives in all.json (loaded once, cached in the client). These
    per-category files are only used as the initial static page payload for
    SEO + first paint — the client hydrates and re-derives the full list from
    all.json filtered by category.
    """
    PREVIEW_COUNT = 12
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
            WHERE category_id = ?
            ORDER BY quality_score DESC, name ASC
            LIMIT ?
        """, (cid, PREVIEW_COUNT)).fetchall()
        items = [_row_to_api(r) for r in api_rows]
        payload = {
            "category": {
                "id": cat_row[0],
                "name": cat_row[1],
                "display_name": cat_row[2],
                "icon": cat_row[3],
                "api_count": cat_row[4] or 0,
                "avg_quality": 0.0,  # filled in client-side from all.json
            },
            "total": cat_row[4] or 0,
            "page": 1,
            "per_page": PREVIEW_COUNT,
            "preview": True,
            "items": items,
        }
        out_path = OUT_DIR / "category" / f"{cid}.json"
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        written.append({"id": cid, "file": f"category/{cid}.json", "size": out_path.stat().st_size, "count": len(items)})
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
    all_apis = build_all(conn)
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
    (OUT_DIR / "all.json").write_text(
        json.dumps(all_apis, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
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
            "all": "all.json",
            "category_pages": len(category_files),
        },
        "category_files": [f["id"] for f in category_files],
    }
    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    file_sizes = [
        (OUT_DIR / "stats.json").stat().st_size,
        (OUT_DIR / "categories.json").stat().st_size,
        (OUT_DIR / "featured.json").stat().st_size,
        (OUT_DIR / "top.json").stat().st_size,
        (OUT_DIR / "all.json").stat().st_size,
        (OUT_DIR / "manifest.json").stat().st_size,
    ] + [f["size"] for f in category_files]
    total_size = sum(file_sizes)
    print(f"  stats.json            : {file_sizes[0]:>12,} bytes")
    print(f"  categories.json       : {file_sizes[1]:>12,} bytes")
    print(f"  featured.json         : {file_sizes[2]:>12,} bytes")
    print(f"  top.json              : {file_sizes[3]:>12,} bytes")
    print(f"  all.json (14,405 APIs): {file_sizes[4]:>12,} bytes  ← full snapshot")
    print(f"  manifest.json         : {file_sizes[5]:>12,} bytes")
    print(f"  category/*.json       : {len(category_files):>12} files, {sum(f['size'] for f in category_files):,} bytes total")
    print(f"  ─────────────────────────────────────────")
    print(f"  TOTAL: {total_size:,} bytes ({total_size / 1024 / 1024:.2f} MB)")
    print(f"Manifest: total_apis={stats['total_apis']}, total_categories={stats['total_categories']}")
    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
