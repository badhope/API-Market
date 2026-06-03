#!/usr/bin/env python3
"""Data quality validator and cleaner for API-Market v5.0."""

from __future__ import annotations

import json
import re
import sqlite3
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
DB_PATH = DATA_DIR / "api_market.db"
LEGACY_JSON = Path(__file__).resolve().parents[1] / "api-database.json"

NON_API_PATTERNS = re.compile(
    r"csv file|latex|vbscript|vim script|pandoc|hss style|"
    r"contributing guide|learn rest|status code definition|"
    r"why meteor|restful api modeling|http status code table",
    re.IGNORECASE,
)

GENERIC_DESCRIPTIONS = {
    "web api for tl mobile and web app",
    "no description",
    "api",
    "rest api",
    "",
}


@dataclass
class QualityReport:
    total_checked: int = 0
    cleaned: int = 0
    flagged_non_api: int = 0
    fixed_descriptions: int = 0
    fixed_categories: int = 0
    fixed_urls: int = 0
    removed_duplicates: int = 0
    issues: list[dict] = field(default_factory=list)


def clean_description(desc: str | None) -> str:
    if not desc:
        return ""
    desc = desc.strip()
    if desc.lower() in GENERIC_DESCRIPTIONS:
        return ""
    if desc.startswith('"') and desc.endswith('"'):
        desc = desc[1:-1]
    return desc[:500]


def is_likely_not_api(name: str, description: str) -> bool:
    if NON_API_PATTERNS.search(name):
        return True
    if NON_API_PATTERNS.search(description):
        return True
    return bool(re.match(r"^https?://", name))


def normalize_url(url: str) -> str:
    url = url.strip().rstrip("/")
    if url and not url.startswith("http"):
        url = f"https://{url}"
    return url


def clean_and_validate() -> QualityReport:
    report = QualityReport()

    if not DB_PATH.exists():
        print("ERROR: Database not found at", DB_PATH)
        return report

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM apis")
    report.total_checked = cursor.fetchone()[0]

    cursor.execute("SELECT id, name, url, description, category_id, auth FROM apis")
    rows = cursor.fetchall()

    non_api_ids: list[str] = []
    update_batch: list[tuple] = []

    for row in rows:
        api_id = row["id"]
        name = row["name"] or ""
        url = row["url"] or ""
        desc = row["description"] or ""

        if is_likely_not_api(name, desc):
            non_api_ids.append(api_id)
            report.flagged_non_api += 1
            report.issues.append(
                {
                    "id": api_id,
                    "name": name,
                    "issue": "likely_not_api",
                }
            )
            continue

        cleaned_desc = clean_description(desc)
        if cleaned_desc != desc:
            report.fixed_descriptions += 1
            update_batch.append(
                ("UPDATE apis SET description = ? WHERE id = ?", cleaned_desc, api_id)
            )

        cleaned_url = normalize_url(url)
        if cleaned_url != url:
            report.fixed_urls += 1
            update_batch.append(("UPDATE apis SET url = ? WHERE id = ?", cleaned_url, api_id))

    for sql, *params in update_batch:
        conn.execute(sql, params)

    for api_id in non_api_ids:
        conn.execute("UPDATE apis SET status = 'flagged', deprecated = 1 WHERE id = ?", (api_id,))

    conn.execute(
        "UPDATE categories SET api_count = (SELECT COUNT(*) FROM apis WHERE category_id = categories.id AND deprecated = 0)"
    )

    conn.commit()

    dup_cursor = conn.execute("""
        SELECT name, COUNT(*) as cnt, GROUP_CONCAT(id) as ids
        FROM apis WHERE deprecated = 0
        GROUP BY name HAVING cnt > 1 LIMIT 100
    """)
    for dup in dup_cursor.fetchall():
        ids = dup[2].split(",")
        for keep_id in ids[1:]:
            conn.execute("UPDATE apis SET deprecated = 1 WHERE id = ?", (keep_id,))
            report.removed_duplicates += 1

    conn.commit()

    fts_count = conn.execute("SELECT COUNT(*) FROM apis_fts").fetchone()[0]
    db_count = conn.execute("SELECT COUNT(*) FROM apis WHERE deprecated = 0").fetchone()[0]

    report.cleaned = report.flagged_non_api + report.fixed_descriptions

    report_path = DATA_DIR / "quality_report.json"
    report_data = {
        "generated_at": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total_original": report.total_checked,
        "total_active": db_count,
        "fts_entries": fts_count,
        "cleaned": report.cleaned,
        "flagged_non_api": report.flagged_non_api,
        "fixed_descriptions": report.fixed_descriptions,
        "fixed_urls": report.fixed_urls,
        "removed_duplicates": report.removed_duplicates,
        "issues": report.issues[:50],
    }
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2, ensure_ascii=False)

    conn.close()

    print(f"Total checked: {report.total_checked}")
    print(f"Active APIs: {db_count}")
    print(f"Flagged non-API: {report.flagged_non_api}")
    print(f"Fixed descriptions: {report.fixed_descriptions}")
    print(f"Fixed URLs: {report.fixed_urls}")
    print(f"Removed duplicates: {report.removed_duplicates}")
    print(f"Quality report saved to {report_path}")

    return report


def main() -> None:
    clean_and_validate()


if __name__ == "__main__":
    main()
