# API-Market

[![Deploy Pages](https://github.com/badhope/API-Market/actions/workflows/pages.yml/badge.svg)](https://github.com/badhope/API-Market/actions/workflows/pages.yml)
[![Validate](https://github.com/badhope/API-Market/actions/workflows/daily-update.yml/badge.svg)](https://github.com/badhope/API-Market/actions/workflows/daily-update.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**语言**: [English](README.md) · [中文](README.zh.md) · [日本語](README.ja.md)

一份精选的公共 API 目录，呈现为一个快速的静态站点。
没有后端、没有 Cookie、没有追踪、没有构建服务器。
整个项目就是 git 里的文本文件 + GitHub Pages 上的静态导出。

## 项目说明

一份可检索的 API 索引 —— 它做什么、怎么调用、鉴权模式是什么、值不值得用。
基于几个质量信号（HTTPS、CORS、描述、上游源）打出 A–F 等级。
由纯 JSON Lines 文本和一个小型 TypeScript 构建脚本生成。

**线上地址**：<https://badhope.github.io/API-Market/>

## 目录结构

```
data/
  sources.json              上游源注册表（显示名、license）
  categories/<id>/
    meta.toml               display_name、blurb、icon
    apis.jsonl              一行一个 API，构建时 Zod 校验

frontend/
  src/
    app/                    Next.js 16 App Router
    components/codex/       设计系统（"Editorial Codex"）
    schemas/                Zod 数据契约（事实来源）
    lib/                    数据、搜索、格式化
    scripts/build-data.ts   文本源 → 静态 JSON + Orama 索引
  public/data/              构建产物（本地开发用）

.github/workflows/
  pages.yml                 push 到 main 时构建并部署
  daily-update.yml          触及 data/ 的 PR 触发校验
```

仅此而已。没有 `backend/`，没有 `docker/`，没有 `scripts/`。
之前维护的 14,000 条 API 目录已退役，改用策展式 + 贡献者驱动的模式 —— 见下文"添加 API"。

## 本地运行

```bash
cd frontend
npm install --legacy-peer-deps
npm run build:data    # 从 data/ 生成 public/data/*.json
npm run dev           # http://localhost:3000
```

一步一个命令。构建脚本也通过 `prebuild` 钩子接入，
所以 `npm run build` 会自动重新生成数据。

## 数据从 git 到页面的旅程

```
  data/categories/<id>/apis.jsonl
            │
            │  Zod 逐行校验
            ▼
  frontend/scripts/build-data.ts
            │
            ├─► stats.json / categories.json / featured.json
            ├─► top.json / all.json / category/<id>.json
            └─► orama.json（预构建的 Orama 搜索索引）
            │
            │  next build 拾取 public/data/*
            ▼
  frontend/out/    （静态导出）
            │
            ▼
  gh-pages 分支
```

搜索在浏览器内跑，查询预构建的 Orama 索引。没有服务器、没有 FTS5、没有 SQL —— WASM 加速的 Orama 引擎负责全文搜索、容错、分面和语言相关的词干提取（按需、客户端）。

## 添加 API

最干净的贡献方式：编辑 `data/categories/<id>/apis.jsonl`，加一行，开 PR。示例条目：

```jsonl
{"id":"open-meteo","name":"Open-Meteo","url":"https://api.open-meteo.com/v1/forecast","description":"Free weather forecast API for any location. No API key required.","auth":"none","https":true,"cors":true,"source":"open-meteo","tags":"forecast,free,no-key,global","quality_score":95,"quality_grade":"A","last_verified":"2026-06-01"}
```

字段说明在 [`frontend/src/schemas/api.ts`](frontend/src/schemas/api.ts)。
构建脚本会在 PR 上以精确错误拒绝任何不合规记录（URL 协议错、未知等级、tag 格式错等）。

### 添加新分类

1. `mkdir -p data/categories/<kebab-id>`
2. 创建 `data/categories/<id>/meta.toml`：
   ```toml
   [meta]
   id = "music"
   display_name = "Music"
   icon = "mus"
   blurb = "Streaming, metadata, lyrics, and audio analysis."
   order = 5
   ```
3. 创建 `data/categories/<id>/apis.jsonl`，至少一条记录。
4. 开 PR。CI 跑构建，静态站点自动获得新章节。

## 质量评分

启发式、快速、透明。分数 0–100、字母 A–F。
编辑者可以直接指定 `quality_grade`；否则构建时从 `quality_score` 派生。
别想太复杂 —— 这只是提示，不是契约。

构建脚本会强制以下不变量并派生其余字段：

- `tags` 在源是逗号分隔字符串，输出时拆成 `string[]`（匹配 UI 预期）
- `category_id` 由目录名隐含；在文件中冗余但 schema 保留以保安全
- `source_url` 未给时回退到源注册表
- `created_at` / `updated_at` 在构建时盖戳

## 技术栈

- **Next.js 16**（App Router、Turbopack、静态导出）
- **TypeScript 5** strict
- **Tailwind v4**（新 `@theme` 指令、手写设计令牌）
- **Zod 3** 做运行时 + 编译时数据契约
- **Orama 3**（浏览器 WASM 搜索）
- **smol-toml** 解析分类元数据
- **tsx** 跑 TS 构建脚本无需单独编译步骤

零 Python。零 Docker。零运行时服务。

## License

MIT。详见 [LICENSE](LICENSE)。

API 数据聚合自公开源；商用前请核对各 provider 的条款。
