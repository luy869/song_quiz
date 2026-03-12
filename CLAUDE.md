# CLAUDE.md

このファイルは、リポジトリで作業する Claude Code (claude.ai/code) へのガイダンスです。

## コマンド

```bash
npm run dev       # 開発サーバー起動 (localhost:5173)
npm run build     # 本番ビルド → dist/
npm run preview   # 本番ビルドのプレビュー
npm run lint      # ESLint 実行
```

テストフレームワークは未設定。

## アーキテクチャ

凋叶棕 (RD-Sounds) の楽曲における当て字・特殊読みを出題する日本語歌詞クイズの SPA。

**スクリーン状態機械** — `App.jsx` が一元管理:
```
START（アルバム選択）→ QUIZ（解答）→ RESULT（結果表示）
```

状態: `screen`, `albumIndex`, `album`, `score`, `quizKey`, `loading`, `error`

**データフロー:**
1. マウント時に `public/data/albums.yaml` を取得 → アルバム一覧を構築
2. アルバム選択 → `public/data/albums/{id}.yaml` を取得 → QUIZ 画面へ遷移
3. `QuizScreen` が全トラックの質問をフラットなリストに変換して出題
4. 終了時に `onFinish(score)` を呼び出し → RESULT 画面へ

リトライ・アルバム切替は `quizKey` のインクリメントで QuizScreen を remount してリセット。

**YAML データ形式** (`public/data/albums/{id}.yaml`): アルバムは `tracks[]` を持ち、各トラックは `questions[]` を持つ。質問フィールド: `prompt`, `target`, `display`, `choices[]`, `correct`（0始まりインデックス）, `answer.text`, `answer.reading`, `tags[]`。

**スタイリング:** コンポーネントごとの CSS Modules + `index.css` のグローバル CSS 変数（ダークテーマ、パープルアクセント `#a78bfa`、正解/不正解に緑/赤）。

## クイズコンテンツの追加

コード変更不要でアルバムを追加できる:
1. `public/data/albums/{id}.yaml` を既存フォーマットに従い作成
2. `public/data/albums.yaml` にエントリを追記
