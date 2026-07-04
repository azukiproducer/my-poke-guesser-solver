# Poke Guesser Solver

React + TypeScript + Vite で作った、ポケモン推理ゲーム向けの手入力ソルバーです。ユーザーがゲーム中で入力したポケモンと判定結果を登録すると、静的な `public/data/pokemon-db.json` を使って候補一覧をAND条件で絞り込みます。

このアプリは `poke-guesser.jp` を自動操作せず、内部APIにもアクセスしません。実行時に PokeAPI も叩かず、ブラウザから読むのは生成済みJSONだけです。

## ローカル起動方法

```bash
pnpm install
pnpm run dev
```

ビルド確認:

```bash
pnpm run build
pnpm run preview
```

テスト:

```bash
pnpm test
```

## データ生成方法

PokeAPI v2 から全ポケモンのデータを取得して `public/data/pokemon-db.json` を生成します。

```bash
pnpm run build:data
```

デフォルトでは PokeAPI の `pokemon-species` 件数を使って全件取得します。検証用に取得上限を絞る場合は環境変数で変更できます。

```bash
POKEMON_MAX_DEX_NO=151 pnpm run build:data
```

レスポンスは `.cache/pokeapi/` に保存され、再実行時に再利用されます。PokeAPIへのアクセスはこの生成スクリプト実行時だけです。

## GitHub Pages デプロイ方法

`.github/workflows/deploy.yml` を追加済みです。GitHub リポジトリの Pages 設定で GitHub Actions を選択し、`main` ブランチへ push すると `pnpm run build` の成果物 `dist` が Pages にデプロイされます。

Vite の `base` は既定で `/my-poke-guesser-solver/` です。リポジトリ名が違う場合は `vite.config.ts` を変更するか、ビルド時に `VITE_BASE_PATH` を設定してください。

```bash
VITE_BASE_PATH=/your-repository-name/ pnpm run build
```

## 設計メモ

- アプリ実行時は `public/data/pokemon-db.json` だけを読みます。
- PokeAPIアクセスは `scripts/build-pokemon-db.ts` に限定しています。
- 判定ロジックは `src/lib/solver.ts` に分離しています。
- `recommendNextGuess()` は将来実装用の入口として用意しています。
- 入力フォーム、試行履歴、候補一覧は日本語UIです。
