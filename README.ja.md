# API-Market

[![Deploy Pages](https://github.com/badhope/API-Market/actions/workflows/pages.yml/badge.svg)](https://github.com/badhope/API-Market/actions/workflows/pages.yml)
[![Validate](https://github.com/badhope/API-Market/actions/workflows/daily-update.yml/badge.svg)](https://github.com/badhope/API-Market/actions/workflows/daily-update.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**言語**: [English](README.md) · [中文](README.zh.md) · [日本語](README.ja.md)

厳選された公開 API のディレクトリを、高速な静的サイトとして提供します。
バックエンドなし、Cookie なし、トラッキングなし、ビルドサーバーなし。
プロジェクト全体は git 内のテキストファイルと、GitHub Pages 上の静的エクスポートだけです。

## これは何

API を検索できるインデックス —— 機能、呼び出し方、認証方式、本当に使う価値があるかどうか。
HTTPS、CORS、説明、ソースといった品質シグナルで A〜F のグレードを付けます。
プレーンな JSON Lines と小さな TypeScript ビルドスクリプトから生成されます。

**公開サイト**：<https://badhope.github.io/API-Market/>

## レイアウト

```
data/
  sources.json              上流ソース登録（表示名、ライセンス）
  categories/<id>/
    meta.toml               display_name、blurb、icon
    apis.jsonl              1 行 1 API、ビルド時に Zod 検証

frontend/
  src/
    app/                    Next.js 16 App Router
    components/codex/       デザインシステム（"Editorial Codex"）
    schemas/                Zod データ契約（唯一の真実）
    lib/                    データ、検索、フォーマッタ
    scripts/build-data.ts   テキスト → 静的 JSON + Orama 索引
  public/data/              ビルド成果物（ローカル開発用にコミット）

.github/workflows/
  pages.yml                 main への push でビルド＆デプロイ
  daily-update.yml          data/ を触る PR で検証
```

これだけ。`backend/` なし、`docker/` なし、`scripts/` なし。
以前運用していた 14,000 件の API カタログは引退し、キュレーション + コントリビューター駆動の方式に切り替えました —— 後述の「API の追加」を参照。

## ローカル実行

```bash
cd frontend
npm install --legacy-peer-deps
npm run build:data    # data/ から public/data/*.json を生成
npm run dev           # http://localhost:3000
```

1 ステップ 1 コマンド。ビルドスクリプトは `prebuild` フックで配線されているので、`npm run build` で自動的にデータが再生成されます。

## データが git からページになるまで

```
  data/categories/<id>/apis.jsonl
            │
            │  Zod が全行を検証
            ▼
  frontend/scripts/build-data.ts
            │
            ├─► stats.json / categories.json / featured.json
            ├─► top.json / all.json / category/<id>.json
            └─► orama.json（事前ビルド済み Orama 検索索引）
            │
            │  next build が public/data/* を拾う
            ▼
  frontend/out/    （静的エクスポート）
            │
            ▼
  gh-pages ブランチ
```

検索はブラウザ側で、事前ビルドされた Orama 索引に対して実行されます。サーバーなし、FTS5 なし、SQL なし —— WASM 化された Orama エンジンが全文検索、誤字許容、ファセット、言語別ステミングを担当（クライアントサイド・オンデマンド）。

## API の追加

最もクリーンなコントリビューション：`data/categories/<id>/apis.jsonl` を編集し、1 行追加して PR を作成します。例：

```jsonl
{"id":"open-meteo","name":"Open-Meteo","url":"https://api.open-meteo.com/v1/forecast","description":"Free weather forecast API for any location. No API key required.","auth":"none","https":true,"cors":true,"source":"open-meteo","tags":"forecast,free,no-key,global","quality_score":95,"quality_grade":"A","last_verified":"2026-06-01"}
```

フィールド仕様は [`frontend/src/schemas/api.ts`](frontend/src/schemas/api.ts) にあります。
不正なレコード（誤った URL スキーム、不明なグレード、不正な tag 形式など）は PR 上で正確なエラーとともに拒否されます。

### 新しいカテゴリの追加

1. `mkdir -p data/categories/<kebab-id>`
2. `data/categories/<id>/meta.toml` を作成：
   ```toml
   [meta]
   id = "music"
   display_name = "Music"
   icon = "mus"
   blurb = "Streaming, metadata, lyrics, and audio analysis."
   order = 5
   ```
3. `data/categories/<id>/apis.jsonl` を、最低 1 レコードで作成。
4. PR を開く。CI がビルドを走らせ、静的サイトに新しい章が自動で追加されます。

## 品質スコアリング

ヒューリスティック、高速、透明。スコアは 0〜100 の数値と A〜F の字母。
編集者は `quality_grade` を直接指定可能。未指定なら `quality_score` から派生。
考えすぎないで —— これはヒントであり、契約ではありません。

ビルドスクリプトがいくつかの不変条件を強制し、残りを派生します：

- `tags` はソースではカンマ区切り文字列、出力では `string[]` に分割（UI 期待値と一致）
- `category_id` はディレクトリ名から暗黙に決まる。冗長だが schema が安全のために保持
- `source_url` 未指定時はソース登録表にフォールバック
- `created_at` / `updated_at` はビルド時にスタンプ

## 技術スタック

- **Next.js 16**（App Router、Turbopack、静的エクスポート）
- **TypeScript 5** strict
- **Tailwind v4**（新 `@theme` ディレクティブ、手書きデザイントークン）
- **Zod 3**（ランタイム + コンパイル時データ契約）
- **Orama 3**（ブラウザ WASM 検索）
- **smol-toml**（カテゴリメタデータ解析）
- **tsx**（TS ビルドスクリプトを別途コンパイルせず実行）

Python ゼロ。Docker ゼロ。ランタイムサービスゼロ。

## ライセンス

MIT。[LICENSE](LICENSE) を参照。

API データは公開ソースから集約しています。商用利用前に各プロバイダーの利用規約を確認してください。
