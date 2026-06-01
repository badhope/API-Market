#!/usr/bin/env python3
"""Async parallel API collection pipeline with retry logic and quality scoring."""

from __future__ import annotations

import asyncio
import json
import os
import re
import time
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlparse

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "development": ["api", "sdk", "framework", "library", "docker", "kubernetes", "ci/cd", "github", "gitlab",
                    "deploy", "build", "test", "webhook", "graphql", "rest", "swagger", "openapi", "endpoint",
                    "microservice", "serverless", "npm", "pip", "code", "compile", "ide", "sentry", "datadog",
                    "newrelic", "grafana", "prometheus", "postman", "firebase", "supabase", "appwrite"],
    "cryptocurrency": ["bitcoin", "ethereum", "crypto", "defi", "nft", "token", "web3", "solana", "coin",
                       "wallet", "dex", "swap", "mining", "blockchain", "smart contract", "solidity"],
    "finance": ["stock", "trading", "market data", "investment", "portfolio", "banking", "insurance",
                "loan", "mortgage", "credit", "accounting", "tax", "invoice", "financial", "plaid"],
    "machine-learning": ["ai ", "artificial intelligence", "machine learning", "deep learning", "neural",
                         "gpt", "llm", "chatbot", "nlp", "sentiment", "image recognition", "openai",
                         "anthropic", "gemini", "claude", "mistral", "embedding", "vector", "rag"],
    "weather": ["weather", "forecast", "temperature", "humidity", "rain", "snow", "wind", "climate",
                "meteorolog", "atmosphere", "uv", "air quality", "pollution"],
    "geocoding": ["geocod", "map", "location", "gps", "coordinate", "latitude", "longitude", "address",
                  "route", "direction", "distance", "gis", "satellite", "navigation"],
    "health": ["health", "medical", "doctor", "hospital", "disease", "symptom", "drug", "medicine",
               "fitness", "exercise", "workout", "covid", "vaccine", "mental health", "fitbit", "strava"],
    "government": ["government", "gov", "parliament", "congress", "senate", "legislation", "law",
                   "regulation", "police", "court", "election", "census", "nasa", "space"],
    "entertainment": ["music", "song", "artist", "album", "track", "playlist", "spotify", "movie", "tv",
                      "youtube", "vimeo", "netflix", "twitch", "game", "gaming", "steam", "esport"],
    "ecommerce": ["shop", "store", "product", "price", "cart", "order", "ecommerce", "amazon", "ebay",
                  "retail", "coupon", "marketplace", "catalog", "inventory"],
    "food": ["food", "recipe", "restaurant", "nutrition", "calorie", "meal", "drink", "beer", "wine"],
    "transportation": ["transport", "shipping", "delivery", "parcel", "logistics", "fleet", "vehicle",
                       "car", "automotive", "driving", "traffic", "parking", "fuel", "train", "bus",
                       "flight", "airline", "airport", "aviation"],
    "security": ["security", "firewall", "vpn", "ssl", "tls", "encryption", "malware", "virus",
                 "phishing", "auth", "2fa", "mfa", "password", "oauth", "jwt", "identity"],
    "social": ["social", "twitter", "facebook", "instagram", "linkedin", "reddit", "discord", "slack",
               "telegram", "whatsapp", "messaging", "chat", "collaboration", "team"],
    "email": ["email", "mail", "smtp", "imap", "inbox", "newsletter", "mailbox", "spam", "mailgun",
              "sendgrid", "ses", "mailchimp", "marketing", "campaign"],
    "news": ["news", "article", "headline", "journal", "press", "media", "rss", "feed", "blog"],
    "books": ["book", "library", "isbn", "author", "publish", "reading", "literature", "ebook"],
    "education": ["education", "learn", "course", "university", "school", "student", "teacher",
                  "grade", "quiz", "exam", "language", "translat", "dictionary"],
    "science": ["science", "math", "physics", "chemistry", "biology", "astronomy", "genome", "protein",
                "molecule", "equation", "calculator"],
    "animals": ["animal", "pet", "dog", "cat", "bird", "fish", "horse", "wildlife"],
    "sports": ["sport", "football", "soccer", "basketball", "baseball", "tennis", "cricket", "nfl", "nba"],
    "jobs": ["job", "career", "employ", "resume", "cv", "recruit", "hiring", "salary", "freelance"],
    "photography": ["photo", "image", "picture", "camera", "thumbnail", "screenshot", "icon", "logo",
                    "design", "color", "font", "typography", "ui", "ux"],
    "documents": ["document", "pdf", "word", "excel", "spreadsheet", "powerpoint", "slide", "form",
                  "signature", "contract", "scan", "ocr"],
    "phone": ["phone", "sms", "call", "telecom", "mobile", "carrier", "number", "dial", "voip"],
    "calendar": ["calendar", "event", "schedule", "meeting", "reminder", "holiday", "date", "time"],
    "environment": ["environment", "carbon", "emission", "sustainability", "green", "energy", "solar",
                    "renewable", "ecology", "wildfire", "earthquake"],
    "iot": ["iot", "sensor", "device", "smart home", "arduino", "raspberry", "mqtt", "zigbee", "bluetooth"],
    "video": ["video", "streaming", "broadcast", "tv", "channel", "live"],
    "tracking": ["track", "package", "shipment", "delivery", "courier", "parcel"],
    "test-data": ["fake", "mock", "test data", "dummy", "placeholder", "sample", "fixture"],
    "open-data": ["open data", "dataset", "data portal", "data gov", "census", "statistics",
                  "indicator", "world bank"],
    "url-shorteners": ["url short", "bit.ly", "tinyurl", "redirect", "link short"],
    "personality": ["personality", "mbti", "enneagram", "astrology", "zodiac", "psychology"],
}


@dataclass
class ApiEntry:
    name: str
    url: str
    description: str = ""
    auth: str | None = None
    https: bool | None = None
    cors: bool | None = None
    source: str = ""
    category: str = "other"
    tags: list[str] = field(default_factory=list)
    quality_score: int = 0
    quality_grade: str = "F"


def classify_api(name: str, description: str) -> str:
    text = f"{name} {description}".lower()
    best_match = "other"
    best_score = 0
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(len(k) for k in keywords if k.lower() in text)
        if score > best_score:
            best_score = score
            best_match = category
    return best_match


def calculate_quality(entry: ApiEntry) -> tuple[int, str]:
    score = 0
    if entry.description and len(entry.description) > 5:
        score += min(25, len(entry.description) // 4 + 10)
    if entry.auth is not None:
        score += 10
    if entry.https is not None:
        score += 10
    if entry.cors is not None:
        score += 10
    if entry.url.startswith("https://"):
        score += 20
    elif entry.url.startswith("http://"):
        score += 10
    if any(x in entry.url.lower() for x in ["/docs", "/api", "swagger", "openapi"]):
        score += 5
    if entry.category != "other":
        score += 15
    if entry.source != "other":
        score += 5
    grade = (
        "A" if score >= 85
        else "B" if score >= 70
        else "C" if score >= 55
        else "D" if score >= 40
        else "F"
    )
    return score, grade


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=15))
async def fetch_json(client: httpx.AsyncClient, url: str) -> dict:
    resp = await client.get(url, timeout=30)
    resp.raise_for_status()
    return resp.json()


async def collect_apis_guru(client: httpx.AsyncClient) -> list[ApiEntry]:
    print("[1/3] Collecting from APIs.guru...")
    try:
        data = await fetch_json(client, "https://api.apis.guru/v2/list.json")
    except Exception as e:
        print(f"  Failed: {e}")
        return []

    entries: list[ApiEntry] = []
    for name, info in data.items():
        versions = info.get("versions", {})
        if not versions:
            continue
        latest = sorted(versions.keys(), reverse=True)[0]
        ver = versions[latest]
        vi = ver.get("info", {})
        desc = (vi.get("description", "") or "")[:200]
        url = ver.get("swaggerUrl", "")
        entry = ApiEntry(
            name=vi.get("title", name),
            url=url,
            description=desc,
            https=url.startswith("https"),
            source="apis.guru",
        )
        entry.category = classify_api(entry.name, entry.description)
        entry.quality_score, entry.quality_grade = calculate_quality(entry)
        entries.append(entry)

    print(f"  Collected {len(entries)} APIs from APIs.guru")
    return entries


async def collect_github_repo(
    client: httpx.AsyncClient, repo: str, token: str = ""
) -> list[ApiEntry]:
    headers: dict[str, str] = {}
    if token:
        headers["Authorization"] = f"token {token}"
    headers["Accept"] = "application/vnd.github.v3.raw"

    try:
        url = f"https://api.github.com/repos/{repo}/readme"
        resp = await client.get(url, headers=headers, timeout=20)
        resp.raise_for_status()
        content = resp.text
    except Exception:
        return []

    entries: list[ApiEntry] = []
    for line in content.split("\n"):
        if not line.startswith("| [") or line.startswith("| ---"):
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 5:
            continue
        name_match = re.search(r"\[(.*?)\]\((.*?)\)", parts[1])
        if not name_match:
            continue
        auth_raw = parts[3].strip() if len(parts) > 3 else ""
        auth: str | None = None
        if auth_raw and auth_raw.lower() != "no":
            auth = auth_raw.strip("`")
        https_raw = parts[4].strip() if len(parts) > 4 else ""
        https: bool | None = None
        if https_raw.lower() == "yes":
            https = True
        elif https_raw.lower() == "no":
            https = False
        cors_raw = parts[5].strip() if len(parts) > 5 else ""
        cors: bool | None = None
        if cors_raw.lower() == "yes":
            cors = True
        elif cors_raw.lower() == "no":
            cors = False

        entry = ApiEntry(
            name=name_match.group(1),
            url=name_match.group(2),
            description=parts[2].strip()[:200] if len(parts) > 2 else "",
            auth=auth,
            https=https,
            cors=cors,
            source=repo,
        )
        entry.category = classify_api(entry.name, entry.description)
        entry.quality_score, entry.quality_grade = calculate_quality(entry)
        entries.append(entry)
    return entries


async def collect_github_all(client: httpx.AsyncClient, token: str = "") -> list[ApiEntry]:
    print("[2/3] Collecting from GitHub repos...")
    repos = [
        "public-apis/public-apis",
        "marcelscruz/public-apis",
        "n0shake/Public-APIs",
        "public-api-lists/public-api-lists",
        "keploy/public-apis-collection",
    ]

    tasks = [collect_github_repo(client, repo, token) for repo in repos]
    results = await asyncio.gather(*tasks)

    all_entries: list[ApiEntry] = []
    for repo, entries in zip(repos, results):
        print(f"  {repo}: {len(entries)} APIs")
        all_entries.extend(entries)

    seen: set[tuple[str, str]] = set()
    unique: list[ApiEntry] = []
    for entry in all_entries:
        key = (entry.name.lower(), entry.url.lower().rstrip("/"))
        if key not in seen:
            seen.add(key)
            unique.append(entry)

    print(f"  Total unique: {len(unique)} (from {len(all_entries)} raw)")
    return unique


def merge_entries(guru: list[ApiEntry], github: list[ApiEntry]) -> list[ApiEntry]:
    print("[3/3] Merging and deduplicating...")
    seen: dict[tuple[str, str], ApiEntry] = {}

    all_entries = guru + github
    for entry in all_entries:
        key = (entry.name.lower().strip(), entry.url.lower().rstrip("/"))
        if not key[0] or not key[1]:
            continue
        if key in seen:
            existing = seen[key]
            if not existing.description and entry.description:
                existing.description = entry.description
            if existing.auth is None and entry.auth is not None:
                existing.auth = entry.auth
            if existing.https is None and entry.https is not None:
                existing.https = entry.https
            if existing.cors is None and entry.cors is not None:
                existing.cors = entry.cors
            if existing.source == "other" and entry.source != "other":
                existing.source = entry.source
        else:
            seen[key] = entry

    merged = list(seen.values())
    print(f"  Merged: {len(merged)} unique APIs")
    return merged


async def main() -> None:
    print("=" * 60)
    print("  API-Market Collection Pipeline v5.0")
    print("=" * 60)

    token = os.environ.get("GITHUB_TOKEN", "")

    async with httpx.AsyncClient(
        headers={"User-Agent": "API-Market/5.0"},
        follow_redirects=True,
    ) as client:
        guru_apis, github_apis = await asyncio.gather(
            collect_apis_guru(client),
            collect_github_all(client, token),
        )

    merged = merge_entries(guru_apis, github_apis)

    categories: defaultdict[str, list[dict]] = defaultdict(list)
    for entry in merged:
        safe_name = re.sub(r"[^a-z0-9]", "_", entry.name.lower().strip())[:40]
        api_id = f"{entry.category}_{safe_name}"
        categories[entry.category].append({
            "id": api_id,
            "name": entry.name,
            "url": entry.url,
            "description": entry.description,
            "category": entry.category,
            "auth": entry.auth,
            "https": entry.https,
            "cors": entry.cors,
            "source": entry.source,
            "quality_score": entry.quality_score,
            "quality_grade": entry.quality_grade,
            "tags": entry.tags,
        })

    output_dir = Path(__file__).resolve().parents[1] / "data" / "collected"
    output_dir.mkdir(parents=True, exist_ok=True)

    output_path = output_dir / "pipeline_output.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({
            "collected_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "total_apis": len(merged),
            "total_categories": len(categories),
            "categories": {k: v for k, v in sorted(categories.items())},
        }, f, indent=2, ensure_ascii=False)

    print(f"\n{'=' * 60}")
    print(f"  Pipeline complete: {len(merged)} APIs, {len(categories)} categories")
    print(f"  Output: {output_path}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    asyncio.run(main())