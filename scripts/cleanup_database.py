#!/usr/bin/env python3
"""
Post-migration cleanup for API-Market SQLite database.

Fixes data quality issues introduced by upstream data sources:

  1. **Duplicate categories**: merges entries that should be the same
     category but appear under different IDs. Examples:
       - ``sports`` -> ``sports-fitness``
       - ``vehicle`` -> ``transportation``
       - ``auth`` -> ``security``
       - ``ci`` -> ``development``
       - ``events`` -> ``calendar``
       - ``media`` -> ``entertainment``
       - ``programming`` -> ``development``
       - ``text-analysis`` -> ``machine-learning``
       - ``anti-malware`` -> ``security``
       - ``anime`` -> ``entertainment``
       - ``analytics`` -> ``open-data``
       - ``business`` -> ``jobs``
       - ``crypto`` -> ``cryptocurrency``
       - ``collaboration`` -> ``social``
       - ``telecom`` -> ``phone``
       - ``education`` -> ``books``

  2. **Tag cleanup**: removes the first tag if it just duplicates the
     category id (the pipeline stores ``[category]`` in tags, which
     pollutes the search index with redundant data).

  3. **Empty API count**: recomputes ``categories.api_count`` from the
     actual rows in ``apis`` so the count is always correct.

This script is idempotent and safe to re-run.
"""

from __future__ import annotations

import argparse
import sqlite3
import sys
from pathlib import Path

CATEGORY_ALIASES: dict[str, str] = {
    "sports": "sports-fitness",
    "vehicle": "transportation",
    "auth": "security",
    "ci": "development",
    "events": "calendar",
    "media": "entertainment",
    "programming": "development",
    "text-analysis": "machine-learning",
    "anti-malware": "security",
    "anime": "entertainment",
    "analytics": "open-data",
    "business": "jobs",
    "crypto": "cryptocurrency",
    "collaboration": "social",
    "telecom": "phone",
    "education": "books",
    "art-design": "photography",
}


def merge_category_duplicates(conn: sqlite3.Connection) -> dict[str, int]:
    """Reassign rows from deprecated category ids to canonical ones, then
    drop the deprecated rows. Returns a ``{old_id: rows_moved}`` map.
    """
    moved: dict[str, int] = {}
    for old_id, new_id in CATEGORY_ALIASES.items():
        if old_id == new_id:
            continue
        cur = conn.execute("SELECT COUNT(*) FROM apis WHERE category_id = ?", (old_id,))
        n = cur.fetchone()[0]
        if n == 0:
            moved[old_id] = 0
            continue

        conn.execute(
            "UPDATE OR IGNORE apis SET category_id = ? WHERE category_id = ?",
            (new_id, old_id),
        )
        remaining = conn.execute(
            "SELECT COUNT(*) FROM apis WHERE category_id = ?", (old_id,)
        ).fetchone()[0]
        actually_moved = n - remaining
        moved[old_id] = actually_moved

        if remaining == 0:
            conn.execute("DELETE FROM categories WHERE id = ?", (old_id,))
    return moved


def cleanup_tags(conn: sqlite3.Connection) -> int:
    """Strip the leading category id from a comma-separated tag string when
    the first tag equals the row's category. Returns the number of rows
    touched.
    """
    rows = conn.execute(
        "SELECT id, category_id, tags FROM apis WHERE tags IS NOT NULL AND tags != ''"
    ).fetchall()
    updates: list[tuple[str, str]] = []
    for api_id, category_id, tags in rows:
        parts = [t.strip() for t in tags.split(",") if t.strip()]
        if not parts:
            continue
        if parts[0].lower() == (category_id or "").lower():
            deduped = parts[1:]
            new_tags = ",".join(deduped)
            if new_tags != tags:
                updates.append((new_tags, api_id))
    for new_tags, api_id in updates:
        conn.execute("UPDATE apis SET tags = ? WHERE id = ?", (new_tags, api_id))
    return len(updates)


def recompute_api_counts(conn: sqlite3.Connection) -> int:
    """Recompute ``categories.api_count`` from the actual rows in ``apis``."""
    conn.execute(
        """
        UPDATE categories
           SET api_count = (
               SELECT COUNT(*) FROM apis WHERE apis.category_id = categories.id
           )
        """
    )
    return conn.execute("SELECT COUNT(*) FROM categories").fetchone()[0]


def rebuild_fts_index(conn: sqlite3.Connection) -> int:
    """Rebuild the FTS5 index so the dedupe + tag cleanup are reflected."""
    conn.execute("DELETE FROM apis_fts")
    conn.execute(
        """
        INSERT INTO apis_fts(api_id, name, description, category_name, tags)
        SELECT a.id, a.name, COALESCE(a.description, ''),
               COALESCE(c.name, ''), COALESCE(a.tags, '')
        FROM apis a
        LEFT JOIN categories c ON a.category_id = c.id
        """
    )
    return conn.execute("SELECT COUNT(*) FROM apis_fts").fetchone()[0]


def analyze(conn: sqlite3.Connection) -> None:
    conn.execute("ANALYZE")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--db",
        default="data/api_market.db",
        type=Path,
        help="Path to the SQLite database (default: data/api_market.db)",
    )
    args = parser.parse_args()

    if not args.db.exists():
        print(f"ERROR: database not found: {args.db}", file=sys.stderr)
        return 1

    print(f"Opening {args.db} ...")
    conn = sqlite3.connect(args.db)
    try:
        before_cats = conn.execute("SELECT COUNT(*) FROM categories").fetchone()[0]
        before_apis = conn.execute("SELECT COUNT(*) FROM apis").fetchone()[0]
        before_empty_tags = conn.execute(
            "SELECT COUNT(*) FROM apis WHERE tags IS NULL OR tags = ''"
        ).fetchone()[0]
        print(
            f"  before: categories={before_cats}, apis={before_apis}, "
            f"apis with empty tags={before_empty_tags}"
        )

        moved = merge_category_duplicates(conn)
        moved_total = sum(moved.values())
        if moved_total:
            print(
                f"  merged categories: {moved_total} apis moved across "
                f"{sum(1 for v in moved.values() if v)} aliases"
            )
        else:
            print("  merged categories: nothing to move")

        tag_updates = cleanup_tags(conn)
        print(f"  tag cleanup: {tag_updates} apis updated")

        cat_count = recompute_api_counts(conn)
        print(f"  recomputed api_count for {cat_count} categories")

        fts_count = rebuild_fts_index(conn)
        print(f"  rebuilt FTS5 index: {fts_count} rows")

        analyze(conn)
        conn.commit()

        after_cats = conn.execute("SELECT COUNT(*) FROM categories").fetchone()[0]
        after_apis = conn.execute("SELECT COUNT(*) FROM apis").fetchone()[0]
        after_empty_tags = conn.execute(
            "SELECT COUNT(*) FROM apis WHERE tags IS NULL OR tags = ''"
        ).fetchone()[0]
        print(
            f"  after:  categories={after_cats}, apis={after_apis}, "
            f"apis with empty tags={after_empty_tags}"
        )
        print(
            f"  delta:  categories={after_cats - before_cats:+d}, "
            f"apis={after_apis - before_apis:+d}, "
            f"empty_tags={after_empty_tags - before_empty_tags:+d}"
        )
    finally:
        conn.close()

    return 0


if __name__ == "__main__":
    sys.exit(main())
