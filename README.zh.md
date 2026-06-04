# API-Market

**语言**: [English](README.md) · [中文](README.zh.md) · [日本語](README.ja.md)

一个可搜索的 14,000+ 公共 HTTP API 目录。FastAPI 后端,Next.js 14 前端,
基于 SQLite FTS5 提供全文搜索。可作为单一 Docker 堆栈部署,也可作为
纯静态站点部署到 GitHub Pages(浏览时无需后端)。

## 项目简介

- 将精选的公共 API 列表(public-apis、APIs.guru 等)聚合到一个
  带 FTS5 索引的 SQLite 数据库中。
- 提供 REST API,支持无头调用:列表、筛选、分页、全文搜索。
- 整个目录的静态 JSON 转储在部署时构建到 `frontend/public/data/`,
  GitHub Pages 构建在浏览器中完成搜索和分页,零服务器成本。

## 快速开始

Docker 方式(完整堆栈,包含 Nginx 反向代理):

```bash
git clone https://github.com/badhope/API-Market
cd API-Market
cp .env.example .env
docker compose up -d
# http://localhost
```

本地开发(仅后端):

```bash
uv sync --extra dev                  # 或: pip install -e ".[dev,pipeline]"
make db-init                          # 一次性: 构建 data/api_market.db
make run                              # uvicorn 启动 :8080
```

本地开发(前端):

```bash
cd frontend && pnpm install && pnpm dev
# http://localhost:3000
```

## 部署到 GitHub Pages

`pages.yml` 在每次推送到 `main` 时构建静态站点,并部署到 `gh-pages` 分支。
构建需要 `data/api_market.db` 已被提交(确实已提交),并会生成
`frontend/public/data/*.json` 和 `frontend/out/`。除此以外无需其他配置。

## API

| 方法   | 路径                          | 说明                                         |
|--------|-------------------------------|----------------------------------------------|
| GET    | `/api`                        | 列表、分页、排序,按等级/CORS 筛选           |
| GET    | `/api/search?q=`              | FTS5 搜索,按相关性排序                      |
| GET    | `/api/categories`             | 分类列表,包含 api_count 和平均质量          |
| GET    | `/api/category/{id}`          | 单个分类下的 API                             |
| GET    | `/api/stats`                  | 汇总统计(缓存 5 分钟)                       |
| GET    | `/api/health`                 | `{status, version, uptime}`                  |

`DEBUG=true` 时可在 `/docs` 访问 OpenAPI 文档。

## 数据

- 44 个分类,约 1.4 万个 API。基于一组简单信号(描述长度、https、cors、
  来源)按 0-100(A-F)进行质量评分。该分数是一个粗略的启发式指标,
  仅供参考。
- 每日更新流水线在 UTC 时间 06:30 通过 `.github/workflows/daily-update.yml`
  运行,验证新数据集,如有变化则自动开启 PR。

## 项目结构

```
backend/         FastAPI 服务(api_market 包 + 测试)
frontend/        Next.js 14 应用,App Router,Tailwind v4
pipeline/        异步采集器(httpx + tenacity)
scripts/         数据迁移、验证、build_static_data
docker/          compose 堆栈的 nginx.conf
data/            SQLite 数据库(已跟踪,约 9.7 MB)+ collected/.gitkeep
```

## 开发

```bash
make all              # ruff + mypy + pytest
make db-reset         # 从全新 JSON 转储重建 SQLite
```

`backend/` 启用严格 mypy,`backend/ pipeline/ scripts/` 启用 ruff 格式 +
lint,`backend/tests/` 中有 13 个测试覆盖公开 API 表面。

## 许可证

MIT。详见 [LICENSE](LICENSE)。

API 数据来自公共来源,商用前请查看各提供方的条款。
