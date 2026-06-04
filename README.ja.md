# API-Market

**言語**: [English](README.md) · [中文](README.zh.md) · [日本語](README.ja.md)

14,000+ の公開 HTTP API を検索可能なディレクトリ。FastAPI バックエンド、
Next.js 14 フロントエンド、SQLite FTS5 による全文検索。単一の Docker
スタックとしても、GitHub Pages 上の完全な静的サイトとしてもデプロイ
できます(閲覧時にバックエンドは不要)。

## 概要

- 厳選された公開 API リスト(public-apis、APIs.guru など)を、
  FTS5 インデックスを備えた単一の SQLite データベースに集約。
- ヘッドレス利用向けの REST API:一覧、フィルタ、ページネーション、
  全文検索を提供。
- カタログ全体の静的 JSON ダンプをデプロイ時に `frontend/public/data/`
  にビルドするため、GitHub Pages のビルドはブラウザ内で検索と
  ページネーションを行い、サーバーコストはゼロ。

## クイックスタート

Docker(完全スタック、Nginx リバースプロキシ込み):

```bash
git clone https://github.com/badhope/API-Market
cd API-Market
cp .env.example .env
docker compose up -d
# http://localhost
```

ローカル開発(バックエンドのみ):

```bash
uv sync --extra dev                  # または: pip install -e ".[dev,pipeline]"
make db-init                          # 初回のみ: data/api_market.db をビルド
make run                              # uvicorn を :8080 で起動
```

ローカル開発(フロントエンド):

```bash
cd frontend && pnpm install && pnpm dev
# http://localhost:3000
```

## GitHub Pages へのデプロイ

`pages.yml` は `main` へのプッシュごとに静的サイトをビルドし、
`gh-pages` ブランチへデプロイします。ビルドには `data/api_market.db`
のチェックインが必要(されています)、`frontend/public/data/*.json` と
`frontend/out/` を生成します。それ以外の準備は不要です。

## API

| メソッド | パス                         | 説明                                           |
|----------|------------------------------|------------------------------------------------|
| GET      | `/api`                       | 一覧、ページネーション、ソート、grade/CORS 絞込 |
| GET      | `/api/search?q=`             | FTS5 検索、関連度順                            |
| GET      | `/api/categories`            | api_count と平均品質を含むカテゴリ             |
| GET      | `/api/category/{id}`         | 単一カテゴリの API                             |
| GET      | `/api/stats`                 | 集計統計(5 分キャッシュ)                       |
| GET      | `/api/health`                | `{status, version, uptime}`                    |

`DEBUG=true` のとき `/docs` で OpenAPI ドキュメントを参照できます。

## データ

- 44 カテゴリ、約 14,000 API。品質スコアリングは 0-100(A-F)で、
  いくつかのシグナル(説明長、https、cors、ソース)に基づく
  ヒューリスティックです。保証ではなく、おおよその指標です。
- 日次更新パイプラインが `.github/workflows/daily-update.yml` 経由で
  UTC 06:30 に実行され、新しいデータセットを検証し、変更があれば
  PR を作成します。

## プロジェクト構成

```
backend/         FastAPI サービス(api_market パッケージ + テスト)
frontend/        Next.js 14 アプリ、App Router、Tailwind v4
pipeline/        非同期コレクター(httpx + tenacity)
scripts/         データ移行、検証、build_static_data
docker/          compose スタック用 nginx.conf
data/            SQLite データベース(追跡対象、約 9.7 MB)+ collected/.gitkeep
```

## 開発

```bash
make all              # ruff + mypy + pytest
make db-reset         # 新規 JSON ダンプから SQLite を再構築
```

`backend/` は strict mypy、`backend/ pipeline/ scripts/` は ruff format + lint
を適用。`backend/tests/` に公開 API サーフェスをカバーする 13 個の
テストがあります。

## ライセンス

MIT。詳細は [LICENSE](LICENSE) を参照。

API データは公開ソースから集約しています。商用利用の前には各提供者
の利用規約を確認してください。
