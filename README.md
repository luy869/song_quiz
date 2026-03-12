# 歌詞あてクイズ | 凋叶棕 ファンサイト

凋叶棕（RD-Sounds）の楽曲に登場する、独特な「当て字」や「特殊な読み方」を題材にした4択クイズサイトです。

## 技術スタック
- **Frontend**: React 18 (Vite)
- **Styling**: CSS Modules (Vanilla CSS)
- **Data**: YAML

## 遊び方
1. スタート画面でアルバムを選択
2. 歌詞のフレーズが表示されるので、[ ] に入る正しい読み方（または漢字）を4択から選ぶ
3. 全問完了後に正答率に応じたリザルトが表示されます

## クイズデータの追加方法（管理者向け）

クイズデータはYAML形式でアルバムごとに管理されています。プログラムの知識がなくても簡単に追加できます。

1. `public/data/albums/` に新しいYAMLファイル（例：`dyj-02.yaml`）を作成し、問題データを記述します。
2. `public/data/albums.yaml` の一覧に新しいアルバムの情報を追記します。

### YAMLデータの書き方（例）
```yaml
id: dyj-02
title: 宴Ⅱ
vocal: めらみぽっぷ
url: https://example.com/

tracks:
  - id: dyj-02-01
    songTitle: サンプル曲
    questions:
      - id: dyj-02-01-q1
        prompt: いつか夢見た
        target: 天空の花の都
        display: 『天空の花の都』を目指し
        choices: [げんそうきょう, アリス, あのばしょ, そらのみやこ]
        correct: 2
        answer:
          text: あのばしょ
          reading: あのばしょ
```

## ローカル開発環境の立ち上げ

```bash
# パッケージのインストール
npm install

# 開発サーバーの起動 (localhost:5173)
npm run dev

# プロダクションビルド
npm run build
```
