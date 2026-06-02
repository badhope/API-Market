<div align="center">

# 🌐 API-Market

### A Comprehensive Collection of 14,000+ Public APIs

**Unified · Standardized · Searchable · Open Source**

[![GitHub stars](https://img.shields.io/github/stars/badhope/API-Market?style=for-the-badge&logo=github)](https://github.com/badhope/API-Market/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/badhope/API-Market?style=for-the-badge&logo=github)](https://github.com/badhope/API-Market/network/members)
[![MIT License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![API Count](https://img.shields.io/badge/APIs-14,000+-blue?style=for-the-badge)](#)

[**🚀 Quick Start**](#-quick-start) · [**📖 API Reference**](#-api-reference) · [**🌐 中文文档**](#-中文文档) · [**🇯🇵 日本語**](#-日本語)

</div>

---

## 📖 Table of Contents

- [About The Project](#-about-the-project)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Deployment](#-deployment)
- [API Reference](#-api-reference)
- [Quality Scoring](#-quality-scoring)
- [Data Sources](#-data-sources)
- [Development](#-development)
- [Security & Privacy](#-security--privacy)
- [License](#-license)
- [中文文档](#-中文文档)
- [日本語](#-日本語)

---

## 🎯 About The Project

**API-Market** is the most comprehensive open-source collection of public APIs available on the internet. We aggregate APIs from multiple trusted sources, standardize their metadata, and provide powerful search and filtering capabilities through a modern web interface and REST API.

Built with **FastAPI** (Python), **Next.js 14** (TypeScript/React), and **SQLite + FTS5** for lightning-fast full-text search.

### Why API-Market?

| Problem | Solution |
|---------|----------|
| 🔍 APIs scattered across hundreds of repositories | ✅ One unified, searchable database |
| 📊 Inconsistent metadata formats | ✅ Standardized schema with quality scores |
| 🏷️ Poor categorization | ✅ 44 well-defined categories |
| 🔒 Unknown API reliability | ✅ Quality scoring system (A-F grades) |

### What Makes Us Different?

- **📊 Scale**: 14,000+ APIs from curated sources
- **🎯 Quality**: Every API is scored and graded (A-F)
- **🔍 Search**: SQLite FTS5 full-text search with relevance ranking
- **📁 Categories**: 44 carefully designed categories
- **🔄 Auto-Update**: Daily automated data collection via GitHub Actions
- **🌐 Modern Stack**: FastAPI backend + Next.js 14 frontend + Tailwind CSS
- **🐳 Docker Ready**: One-command deployment with Nginx reverse proxy

---

## ✨ Key Features

### Web Interface (Frontend)
- 🔍 **Instant Search** — Full-text search with relevance ranking
- 📊 **Quality Grades** — Know which APIs are reliable (A/B/C/D/F)
- 🏷️ **Smart Filtering** — Filter by category, grade, CORS, HTTPS
- 🌐 **i18n Support** — English / Chinese / Japanese language switching
- 🌙 **Dark Mode** — Light and dark theme support
- 📱 **Responsive** — Mobile-first design with Tailwind CSS

### REST API (Backend)
- 🚀 **Async FastAPI** — High-performance async Python backend
- 📦 **Pydantic v2** — Type-safe request/response validation
- ⚡ **Rate Limiting** — Per-endpoint request throttling
- 🗄️ **SQLite + FTS5** — Full-text search without external dependencies
- 🐳 **Docker** — Multi-stage build with Nginx reverse proxy
- 🔧 **CI/CD** — Automated lint, test, typecheck, security scan

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Nginx (port 80)                   │
│              Reverse Proxy + Rate Limiting            │
└─────┬──────────────────────────────────┬────────────┘
      │                                  │
      ▼                                  ▼
┌─────────────┐                 ┌──────────────────┐
│  Next.js 14 │                 │   FastAPI (8080)  │
│  Frontend   │─── API Proxy ──▶│   Backend API     │
│  Tailwind   │                 │   SQLAlchemy 2.0  │
└─────────────┘                 └────────┬─────────┘
                                         │
                                         ▼
                                ┌─────────────────┐
                                │  SQLite + FTS5   │
                                │  14,000+ APIs     │
                                │  44 Categories   │
                                └─────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- (Optional) Docker & Docker Compose

### Option 1: Docker Compose (Recommended)

```bash
git clone https://github.com/badhope/API-Market.git
cd API-Market

# Copy and configure environment
cp .env.example .env

# Start the stack
docker compose up -d

# Open http://localhost in your browser
```

### Option 2: Local Development

**Backend:**

```bash
cd API-Market
pip install -e .
python -m uvicorn api_market.main:app --host 0.0.0.0 --port 8080
```

**Frontend:**

```bash
cd API-Market/frontend
npm install
npm run dev

# Open http://localhost:3000
```

### Option 3: API Only

```bash
curl "http://localhost:8080/api/search?q=weather"
curl "http://localhost:8080/api/stats"
curl "http://localhost:8080/api/categories"
```

---

## 🌍 Deployment

The project supports two deployment modes:

| Mode | Use Case | Hosting |
|------|----------|---------|
| **Full stack (Docker)** | Self-hosted with backend + frontend | VPS, your own server |
| **Static (GitHub Pages)** | Public, free, no-server deployment | GitHub Pages + Render (backend) |

### Option A: GitHub Pages (Recommended for showcasing)

GitHub Pages hosts only static files. The site ships the **entire 14,000+ API
database** (6.6 MB `all.json`, ~1.5 MB gzipped) and does all paging, sorting,
filtering, and full-text search in the browser. No backend required for the
public site. The FastAPI backend is still useful for headless use — see
[docs/deploy-render.md](docs/deploy-render.md).

#### 1. One-time setup

```bash
# In the GitHub repo: Settings → Pages → Source → "Deploy from a branch"
# Then: Branch → "gh-pages" / (root) → Save
#
# (The workflow creates the gh-pages branch on its first run, so you may
# need to wait a minute after the first commit for it to appear in the
# branch dropdown.)
```

No other secrets are required. The workflow uses the default `GITHUB_TOKEN`.

#### 2. Push to `main`

```bash
git add . && git commit -m "feat: ship to GitHub Pages"
git push origin main
```

The `Deploy to GitHub Pages` workflow runs automatically. It will:

1. Read `data/api_market.db` from the repo and dump `frontend/public/data/*.json`
   (stats, categories, featured, all, top, category/*).
2. Run `next build` with `STATIC_EXPORT=true` to produce `frontend/out/`.
3. Publish `frontend/out/` to GitHub Pages.

Once green, your site is live at:

```
https://<owner>.github.io/API-Market/
```

#### 3. Local preview of the static build

```bash
cd frontend
python ../scripts/build_static_data.py   # populate public/data/
STATIC_EXPORT=true npm run build         # produce out/
npx serve out                            # serve at http://localhost:3000/API-Market/
```

The build output is a fully static folder — you can drop it on any static
host (S3 + CloudFront, Netlify, Cloudflare Pages, GitHub Pages, etc.).

### Option B: Full stack (Docker)

```bash
git clone https://github.com/badhope/API-Market.git
cd API-Market
cp .env.example .env
docker compose up -d
# Open http://localhost
```

The Docker setup includes a multi-stage build for the frontend (Next.js
standalone output behind Nginx) plus the FastAPI backend. See
[`docker-compose.yml`](docker-compose.yml) for the full stack.

---

## 📚 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api` | List APIs with pagination & filters |
| `GET` | `/api/search?q=` | Full-text search with relevance ranking |
| `GET` | `/api/categories` | List all categories |
| `GET` | `/api/category/{id}` | Get APIs in a category |
| `GET` | `/api/stats` | Statistics & metadata coverage |
| `GET` | `/api/health` | Health check |

### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | int | Page number | 1 |
| `per_page` | int | Items per page (max 100) | 20 |
| `sort` | string | Sort by: `name`, `quality`, `category`, `updated` | `name` |
| `order` | string | Sort order: `asc`, `desc` | `asc` |
| `grade` | string | Filter by grade: `A`, `B`, `C`, `D`, `F` | — |
| `category` | string | Filter by category ID | — |
| `cors` | bool | Filter CORS support | — |
| `free` | bool | Filter free APIs | — |

### Response Format

```json
{
  "total": 14405,
  "page": 1,
  "per_page": 20,
  "total_pages": 721,
  "items": [
    {
      "id": "development_openai",
      "name": "OpenAI API",
      "url": "https://api.openai.com",
      "description": "Powerful AI models for text, code, and images",
      "category_id": "development",
      "auth": "apiKey",
      "https": true,
      "cors": true,
      "quality_score": 95,
      "quality_grade": "A",
      "tags": ["ai", "machine-learning", "nlp"],
      "source": "public-apis"
    }
  ]
}
```

---

## 🎯 Quality Scoring

Every API is scored on a 0-100 scale and assigned a grade:

| Grade | Score Range | Meaning |
|-------|-------------|---------|
| 🟢 **A** | 85-100 | Excellent — Well documented, reliable |
| 🔵 **B** | 70-84 | Good — Solid choice for production |
| 🟡 **C** | 55-69 | Acceptable — May have limitations |
| 🟠 **D** | 40-54 | Poor — Use with caution |
| 🔴 **F** | 0-39 | Avoid — Missing critical information |

### Scoring Factors

- **Documentation** (+20): Has description
- **Security** (+15): HTTPS enabled
- **CORS** (+10): Cross-origin support
- **Category** (+15): Properly categorized
- **Source Quality** (+10): From trusted source

---

## 📊 Data Sources

We collect APIs from trusted, curated sources:

| Source | Type | Link |
|--------|------|------|
| APIs.guru | OpenAPI/Swagger specs | [apis.guru](https://apis.guru) |
| public-apis | Community curated | [GitHub](https://github.com/public-apis/public-apis) |
| marcelscruz/public-apis | Community curated | [GitHub](https://github.com/marcelscruz/public-apis) |
| n0shake/Public-APIs | Developer APIs | [GitHub](https://github.com/n0shake/Public-APIs) |
| public-api-lists | Multi-source aggregation | [GitHub](https://github.com/public-api-lists/public-api-lists) |
| keploy/public-apis-collection | Test-ready APIs | [GitHub](https://github.com/keploy/public-apis-collection) |

---

## 👨‍💻 Development

### Setup

```bash
# Clone the repository
git clone https://github.com/badhope/API-Market.git
cd API-Market

# Install backend dependencies
pip install -e ".[dev]"

# Install frontend dependencies
cd frontend && npm install && cd ..

# Run tests
python -m pytest backend/tests -v

# Run lint & typecheck
ruff check .
mypy backend/

# Start development servers
python -m uvicorn api_market.main:app --reload --port 8080 &
cd frontend && npm run dev
```

### Project Structure

```
API-Market/
├── backend/
│   ├── api_market/
│   │   ├── main.py           # FastAPI application
│   │   ├── config.py         # pydantic-settings configuration
│   │   ├── database.py       # SQLAlchemy async engine
│   │   ├── models/           # ORM models & Pydantic schemas
│   │   ├── routes/           # API route handlers
│   │   ├── services/         # Business logic layer
│   │   └── middleware/       # Security headers, CORS, logging
│   └── tests/                # pytest test suite
├── frontend/
│   └── src/
│       ├── app/              # Next.js App Router pages
│       ├── components/       # React components (shadcn/ui)
│       ├── i18n/             # EN/ZH/JA translations
│       └── lib/              # API client, utilities, constants
├── pipeline/
│   └── collector.py          # Async data collection pipeline
├── scripts/
│   └── migrate_to_sqlite.py  # JSON → SQLite migration
├── docker/
│   └── nginx.conf            # Nginx reverse proxy config
├── docker-compose.yml
├── Dockerfile
└── pyproject.toml
```

### Code Quality

- **Lint**: [ruff](https://github.com/astral-sh/ruff) — fast Python linter
- **Type Check**: [mypy](https://mypy-lang.org/) (strict mode)
- **Testing**: [pytest](https://pytest.org) + [pytest-asyncio](https://github.com/pytest-dev/pytest-asyncio)
- **CI/CD**: GitHub Actions (lint → typecheck → test → security → docker)
- **Pre-commit**: [pre-commit](https://pre-commit.com) hooks

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

All API data is collected from public sources. Please check individual API terms of service before use.

---

## 🔐 Security & Privacy

API-Market is designed to keep your secrets safe.

- **No secrets in the repository**: API keys, tokens, and passwords are read
  from environment variables only. See `.env.example` for the template.
- **CI Privacy Guard**: Every push and pull request runs a privacy scan that
  rejects any commit containing known secret patterns (GitHub PAT, OAuth,
  Slack, OpenAI, AWS, Google API keys, and private keys).
- **Gitignored data files**: The 8.7 MB SQLite database and large JSON dumps
  are excluded from the repository. See `.gitignore`.
- **No telemetry**: The hosted site does not collect analytics, cookies, or
  tracking data.
- **Vulnerability reporting**: See [SECURITY.md](SECURITY.md) for the
  private disclosure process.

Run `bash scripts/privacy_check.sh` locally before any commit to catch
secrets before they reach the remote.

---

## 🌐 中文文档

### 项目简介

**API-Market** 是互联网上最全面的开源公开 API 集合。采用 **FastAPI + Next.js 14 + SQLite FTS5** 现代技术栈，提供高质量、标准化的 API 目录服务。

### 快速开始

```bash
# Docker 部署（推荐）
git clone https://github.com/badhope/API-Market.git
cd API-Market
cp .env.example .env
docker compose up -d

# 本地开发
pip install -e .                      # 安装后端
cd frontend && npm install && cd ..   # 安装前端
python -m uvicorn api_market.main:app --port 8080 &  # 启动后端
cd frontend && npm run dev             # 启动前端
```

### 主要特性

- **📊 规模**：14,000+ API，来自多个精选数据源
- **🎯 质量**：每个 API 都有 0-100 评分和 A-F 等级
- **🔍 搜索**：SQLite FTS5 全文搜索引擎，支持相关性排序
- **📁 分类**：44 个精心设计的分类
- **🌐 国际化**：中英日文界面切换
- **🌙 暗色模式**：明暗主题自动适配
- **🔄 自动更新**：GitHub Actions 每日自动数据采集
- **🐳 Docker**：多阶段构建 + Nginx 反向代理，一键部署

### API 接口

| 端点 | 描述 | 示例 |
|------|------|------|
| `GET /api` | 分页列出所有 API | `/api?page=1&per_page=20&grade=A` |
| `GET /api/search?q=` | 全文搜索 | `/api/search?q=天气` |
| `GET /api/categories` | 列出所有分类 | `/api/categories` |
| `GET /api/category/{id}` | 获取分类中的 API | `/api/category/development` |
| `GET /api/stats` | 统计信息 | `/api/stats` |

### 数据来源

| 来源 | 说明 | 链接 |
|------|------|------|
| APIs.guru | OpenAPI/Swagger 规范 | [apis.guru](https://apis.guru) |
| public-apis | 社区精选 | [GitHub](https://github.com/public-apis/public-apis) |
| marcelscruz/public-apis | 社区精选 | [GitHub](https://github.com/marcelscruz/public-apis) |
| n0shake/Public-APIs | 开发者 API | [GitHub](https://github.com/n0shake/Public-APIs) |
| public-api-lists | 多源聚合 | [GitHub](https://github.com/public-api-lists/public-api-lists) |
| keploy/public-apis-collection | 测试就绪 API | [GitHub](https://github.com/keploy/public-apis-collection) |

---

## 🇯🇵 日本語

### プロジェクト概要

**API-Market** は、インターネット上で最も包括的なオープンソース公開APIコレクションです。**FastAPI + Next.js 14 + SQLite FTS5** の最新技術スタックを採用し、高品質で標準化されたAPIディレクトリを提供します。

### クイックスタート

```bash
# Dockerデプロイ（推奨）
git clone https://github.com/badhope/API-Market.git
cd API-Market
cp .env.example .env
docker compose up -d

# ローカル開発
pip install -e .                      # バックエンドインストール
cd frontend && npm install && cd ..   # フロントエンドインストール
python -m uvicorn api_market.main:app --port 8080 &  # バックエンド起動
cd frontend && npm run dev             # フロントエンド起動
```

### 主な特徴

- **📊 規模**：14,000以上のAPI、複数の信頼できるソースから収集
- **🎯 品質**：各APIに0-100のスコアとA-Fグレード
- **🔍 検索**：SQLite FTS5全文検索エンジン、関連性ランキング対応
- **📁 カテゴリ**：44の慎重に設計されたカテゴリ
- **🌐 国際化**：英語・中国語・日本語インターフェース切替
- **🌙 ダークモード**：ライト/ダークテーマ自動対応
- **🔄 自動更新**：GitHub Actionsによる毎日の自動データ収集
- **🐳 Docker**：マルチステージビルド + Nginxリバースプロキシ

### API エンドポイント

| エンドポイント | 説明 | 例 |
|------|------|------|
| `GET /api` | API一覧（ページネーション） | `/api?page=1&per_page=20&grade=A` |
| `GET /api/search?q=` | 全文検索 | `/api/search?q=weather` |
| `GET /api/categories` | 全カテゴリ一覧 | `/api/categories` |
| `GET /api/category/{id}` | カテゴリ内API取得 | `/api/category/development` |
| `GET /api/stats` | 統計情報 | `/api/stats` |

### データソース

| ソース | 説明 | リンク |
|------|------|------|
| APIs.guru | OpenAPI/Swagger仕様 | [apis.guru](https://apis.guru) |
| public-apis | コミュニティキュレーション | [GitHub](https://github.com/public-apis/public-apis) |
| marcelscruz/public-apis | コミュニティキュレーション | [GitHub](https://github.com/marcelscruz/public-apis) |
| n0shake/Public-APIs | 開発者向けAPI | [GitHub](https://github.com/n0shake/Public-APIs) |
| public-api-lists | マルチソース集約 | [GitHub](https://github.com/public-api-lists/public-api-lists) |
| keploy/public-apis-collection | テスト対応API | [GitHub](https://github.com/keploy/public-apis-collection) |

---

<div align="center">

### 🙏 Acknowledgments

Special thanks to all the amazing open-source projects that make this possible:

- [public-apis](https://github.com/public-apis/public-apis) — The original public APIs collection
- [APIs.guru](https://apis.guru) — OpenAPI directory
- All our [contributors](https://github.com/badhope/API-Market/graphs/contributors)

---

**Made with ❤️ by the API-Market Community**

[⬆ Back to Top](#-api-market)

</div>